using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NeoBank.Application.DTOs.Auth;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
namespace NeoBank.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IPasswordHasher<ApplicationUser> _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;

    public class PendingRegistration
    {
        public RegisterDto Dto { get; set; } = null!;
        public string IpAddress { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public AuthService(
        IApplicationDbContext dbContext,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IJwtService jwtService,
        IEmailService emailService,
        IConfiguration configuration,
        IMemoryCache cache)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _emailService = emailService;
        _configuration = configuration;
        _cache = cache;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string ipAddress)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var code = GenerateCode();
        // This will throw if the email service fails (e.g., unverified sender in Brevo)
        await _emailService.SendVerificationCodeAsync(dto.Email.Trim(), dto.FirstName.Trim(), code, "EmailVerification");

        var pending = new PendingRegistration
        {
            Dto = dto,
            IpAddress = ipAddress,
            Code = code
        };

        // Cache for 15 minutes
        _cache.Set($"PendingReg_{normalizedEmail}", pending, TimeSpan.FromMinutes(15));

        return new AuthResponseDto
        {
            RequiresEmailVerification = true,
            User = new UserDto { 
                Id = normalizedEmail, 
                Email = dto.Email.Trim(), 
                FirstName = dto.FirstName.Trim() 
            }
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string ipAddress)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is disabled.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var session = user.Session;

        if (session == null || !session.IsEmailVerified)
        {
            var code = GenerateCode();
            await SaveVerificationCode(user.Id, code, "EmailVerification");
            await _emailService.SendVerificationCodeAsync(user.Email, user.FirstName, code, "EmailVerification");

            return new AuthResponseDto
            {
                RequiresEmailVerification = true,
                User = MapToUserDto(user)
            };
        }

        if (session.TwoFactorEnabled)
        {
            var tempToken = GenerateTempToken();
            var code = GenerateCode();
            await SaveVerificationCode(user.Id, code, "TwoFactor", tempToken);
            await _emailService.SendVerificationCodeAsync(user.Email, user.FirstName, code, "TwoFactor");

            return new AuthResponseDto
            {
                RequiresTwoFactor = true,
                TempToken = tempToken,
                User = MapToUserDto(user)
            };
        }

        return await CompleteLoginAsync(user, ipAddress);
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(string googleToken, string ipAddress)
    {
        string email;
        string givenName;
        string familyName;
        string? picture;

        try
        {
            using var httpClient = new System.Net.Http.HttpClient();
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", googleToken);
            var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

            if (!response.IsSuccessStatusCode)
            {
                throw new UnauthorizedAccessException("Invalid Google token.");
            }

            var json = await response.Content.ReadAsStringAsync();
            var payload = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);
            
            email = payload.GetProperty("email").GetString()!;
            givenName = payload.TryGetProperty("given_name", out var g) ? g.GetString()! : "Google User";
            familyName = payload.TryGetProperty("family_name", out var f) ? f.GetString()! : string.Empty;
            picture = payload.TryGetProperty("picture", out var p) ? p.GetString() : null;
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException($"Invalid Google token: {ex.Message}");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Account not found.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is disabled.");
        }

        return await CompleteLoginAsync(user, ipAddress);
    }

    public async Task<bool> SendEmailVerificationAsync(string userId)
    {
        var normalizedEmail = userId.Trim().ToLowerInvariant();
        
        // Check if it's a pending registration
        if (_cache.TryGetValue($"PendingReg_{normalizedEmail}", out PendingRegistration? pending) && pending != null)
        {
            var code = GenerateCode();
            pending.Code = code;
            await _emailService.SendVerificationCodeAsync(pending.Dto.Email, pending.Dto.FirstName, code, "EmailVerification");
            _cache.Set($"PendingReg_{normalizedEmail}", pending, TimeSpan.FromMinutes(15));
            return true;
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        var fifteenMinutesAgo = DateTime.UtcNow.AddMinutes(-15);
        var recentCode = await _dbContext.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Purpose == "EmailVerification" && c.CreatedAt > fifteenMinutesAgo)
            .FirstOrDefaultAsync();

        if (recentCode != null)
        {
            throw new InvalidOperationException("Please wait 15 minutes before requesting a new code.");
        }

        var dbCode = GenerateCode();
        await SaveVerificationCode(user.Id, dbCode, "EmailVerification");
        await _emailService.SendVerificationCodeAsync(user.Email, user.FirstName, dbCode, "EmailVerification");
        return true;
    }

    public async Task<AuthResponseDto> VerifyEmailCodeAsync(string userId, string code, string ipAddress)
    {
        var normalizedEmail = userId.Trim().ToLowerInvariant();

        // 1. Check if it's a pending registration in cache
        if (_cache.TryGetValue($"PendingReg_{normalizedEmail}", out PendingRegistration? pending) && pending != null)
        {
            if (pending.Code != code)
            {
                throw new InvalidOperationException("Invalid or expired verification code.");
            }

            var newUser = new ApplicationUser
            {
                Email = pending.Dto.Email.Trim(),
                FirstName = pending.Dto.FirstName.Trim(),
                LastName = pending.Dto.LastName.Trim(),
                Role = UserRole.User,
                IsActive = true
            };

            newUser.PasswordHash = _passwordHasher.HashPassword(newUser, pending.Dto.Password);
            _dbContext.Users.Add(newUser);

            var session = new UserSession
            {
                UserId = newUser.Id,
                RegistrationIp = pending.IpAddress,
                LastIp = ipAddress,
                LastLoginAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                IsEmailVerified = true,
                TwoFactorEnabled = false,
                IsSubscribedToNewsletter = false
            };

            _dbContext.UserSessions.Add(session);
            await _dbContext.SaveChangesAsync();

            newUser.Session = session;
            _cache.Remove($"PendingReg_{normalizedEmail}");

            return await CompleteLoginAsync(newUser, ipAddress);
        }

        // 2. Fallback to normal DB code verification (for logins or existing accounts)
        await CleanupExpiredCodesAsync();

        var entry = await _dbContext.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Code == code && c.Purpose == "EmailVerification" && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (entry == null || entry.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invalid or expired verification code.");
        }

        _dbContext.EmailVerificationCodes.Remove(entry);

        var user = await _dbContext.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new InvalidOperationException("User not found.");

        if (user.Session != null)
        {
            user.Session.IsEmailVerified = true;
        }
        await _dbContext.SaveChangesAsync();

        return await CompleteLoginAsync(user, ipAddress);
    }

    public async Task<AuthResponseDto> VerifyTwoFactorCodeAsync(string tempToken, string code, string ipAddress)
    {
        await CleanupExpiredCodesAsync();

        var entry = await _dbContext.EmailVerificationCodes
            .Include(c => c.User)
                .ThenInclude(u => u.Session)
            .Where(c => c.TempToken == tempToken && c.Code == code && c.Purpose == "TwoFactor" && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (entry == null || entry.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invalid or expired 2FA code.");
        }

        _dbContext.EmailVerificationCodes.Remove(entry);
        await _dbContext.SaveChangesAsync();

        return await CompleteLoginAsync(entry.User, ipAddress);
    }

    public async Task<bool> ToggleTwoFactorAsync(string userId, bool enabled)
    {
        var user = await _dbContext.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        if (user.Session != null)
        {
            user.Session.TwoFactorEnabled = enabled;
            await _dbContext.SaveChangesAsync();
        }
        return true;
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshTokenValue, string ipAddress)
    {
        var refreshToken = await _dbContext.RefreshTokens
            .Include(r => r.User)
                .ThenInclude(u => u.Session)
            .FirstOrDefaultAsync(r => r.Token == refreshTokenValue);

        if (refreshToken == null || !refreshToken.IsActive || !refreshToken.User.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = ipAddress;

        var newRefreshToken = CreateRefreshToken(refreshToken.UserId, ipAddress);
        refreshToken.ReplacedByToken = newRefreshToken.Token;

        _dbContext.RefreshTokens.Add(newRefreshToken);
        await _dbContext.SaveChangesAsync();

        var roles = new List<string> { refreshToken.User.Role.ToString() };
        var (accessToken, expiration) = _jwtService.GenerateToken(refreshToken.User, roles);

        return new AuthResponseDto
        {
            Token = accessToken,
            Expiration = expiration,
            RefreshToken = newRefreshToken.Token,
            RefreshTokenExpiration = newRefreshToken.ExpiresAt,
            User = MapToUserDto(refreshToken.User)
        };
    }

    public async Task<bool> RevokeTokenAsync(string refreshTokenValue, string ipAddress)
    {
        var refreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshTokenValue);

        if (refreshToken == null || !refreshToken.IsActive)
        {
            return false;
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = ipAddress;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(string userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        return MapToUserDto(user);
    }

    private async Task<AuthResponseDto> CompleteLoginAsync(ApplicationUser user, string ipAddress)
    {
        var session = user.Session ?? await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.UserId == user.Id);

        if (session != null)
        {
            session.LastIp = ipAddress;
            session.LastLoginAt = DateTime.UtcNow;
        }

        var oldTokens = _dbContext.RefreshTokens.Where(r => r.UserId == user.Id);
        _dbContext.RefreshTokens.RemoveRange(oldTokens);

        var refreshToken = CreateRefreshToken(user.Id, ipAddress);
        _dbContext.RefreshTokens.Add(refreshToken);

        await _dbContext.SaveChangesAsync();

        var roles = new List<string> { user.Role.ToString() };
        var (token, expiration) = _jwtService.GenerateToken(user, roles);

        // Attach session for mapping
        if (session != null) user.Session = session;

        return new AuthResponseDto
        {
            Token = token,
            Expiration = expiration,
            RefreshToken = refreshToken.Token,
            RefreshTokenExpiration = refreshToken.ExpiresAt,
            User = MapToUserDto(user)
        };
    }

    private async Task SaveVerificationCode(string userId, string code, string purpose, string? tempToken = null)
    {
        var oldCodes = _dbContext.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Purpose == purpose);
        
        _dbContext.EmailVerificationCodes.RemoveRange(oldCodes);

        var entry = new EmailVerificationCode
        {
            UserId = userId,
            Code = code,
            Purpose = purpose,
            TempToken = tempToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.EmailVerificationCodes.Add(entry);
        await _dbContext.SaveChangesAsync();
    }

    private async Task CleanupExpiredCodesAsync()
    {
        var expired = _dbContext.EmailVerificationCodes
            .Where(c => c.ExpiresAt < DateTime.UtcNow || c.IsUsed);
        _dbContext.EmailVerificationCodes.RemoveRange(expired);
        await _dbContext.SaveChangesAsync();
    }

    private static string GenerateCode()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        rng.GetBytes(bytes);
        var value = BitConverter.ToUInt32(bytes, 0) % 10_000_000;
        return value.ToString("D7");
    }

    private static string GenerateTempToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static RefreshToken CreateRefreshToken(string userId, string ipAddress)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        return new RefreshToken
        {
            UserId = userId,
            Token = Convert.ToBase64String(randomBytes),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };
    }

    private static UserDto MapToUserDto(ApplicationUser user)
    {
        var session = user.Session;
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            AvatarUrl = user.AvatarUrl,
            RegistrationIp = session?.RegistrationIp,
            LastIp = session?.LastIp,
            LastLoginAt = session?.LastLoginAt,
            CreatedAt = session?.CreatedAt ?? DateTime.UtcNow,
            IsEmailVerified = session?.IsEmailVerified ?? false,
            TwoFactorEnabled = session?.TwoFactorEnabled ?? false,
            IsSubscribedToNewsletter = session?.IsSubscribedToNewsletter ?? false
        };
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null) return false;

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new InvalidOperationException("Invalid current password");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ConfirmDisableTwoFactorAsync(string token)
    {
        var verification = await _dbContext.EmailVerificationCodes
            .Include(c => c.User)
                .ThenInclude(u => u.Session)
            .FirstOrDefaultAsync(c => c.TempToken == token && c.Purpose == "Disable2FA" && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow);

        if (verification == null)
            return false;

        _dbContext.EmailVerificationCodes.Remove(verification);

        if (verification.User.Session != null)
        {
            verification.User.Session.TwoFactorEnabled = false;
        }

        await _dbContext.SaveChangesAsync();

        return true;
    }
}
