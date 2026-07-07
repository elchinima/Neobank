using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.Auth;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IPasswordHasher<ApplicationUser> _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;

    public AuthService(
        IApplicationDbContext dbContext,
        IPasswordHasher<ApplicationUser> passwordHasher,
        IJwtService jwtService,
        IEmailService emailService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string ipAddress)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser != null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var user = new ApplicationUser
        {
            Email = dto.Email.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Role = "User",
            RegistrationIp = ipAddress,
            LastIp = ipAddress,
            LastLoginAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            IsEmailVerified = false,
            TwoFactorEnabled = false
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        // Send email verification code
        var code = GenerateCode();
        await SaveVerificationCode(user.Id, code, "EmailVerification");
        await _emailService.SendVerificationCodeAsync(user.Email, user.FirstName, code, "EmailVerification");

        return new AuthResponseDto
        {
            RequiresEmailVerification = true,
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, string ipAddress)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // If email not verified — send verification code, block login
        if (!user.IsEmailVerified)
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

        // If 2FA is enabled — send 2FA code, return tempToken
        if (user.TwoFactorEnabled)
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

        // Normal login
        return await CompleteLoginAsync(user, ipAddress);
    }

    public async Task<bool> SendEmailVerificationAsync(string userId)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        var code = GenerateCode();
        await SaveVerificationCode(user.Id, code, "EmailVerification");
        await _emailService.SendVerificationCodeAsync(user.Email, user.FirstName, code, "EmailVerification");
        return true;
    }

    public async Task<AuthResponseDto> VerifyEmailCodeAsync(string userId, string code, string ipAddress)
    {
        // Clean up expired codes first
        await CleanupExpiredCodesAsync();

        var entry = await _dbContext.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Code == code && c.Purpose == "EmailVerification" && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (entry == null || entry.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invalid or expired verification code.");
        }

        entry.IsUsed = true;

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new InvalidOperationException("User not found.");

        user.IsEmailVerified = true;
        await _dbContext.SaveChangesAsync();

        return await CompleteLoginAsync(user, ipAddress);
    }

    public async Task<AuthResponseDto> VerifyTwoFactorCodeAsync(string tempToken, string code, string ipAddress)
    {
        // Clean up expired codes first
        await CleanupExpiredCodesAsync();

        var entry = await _dbContext.EmailVerificationCodes
            .Include(c => c.User)
            .Where(c => c.TempToken == tempToken && c.Code == code && c.Purpose == "TwoFactor" && !c.IsUsed)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (entry == null || entry.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Invalid or expired 2FA code.");
        }

        entry.IsUsed = true;
        await _dbContext.SaveChangesAsync();

        return await CompleteLoginAsync(entry.User, ipAddress);
    }

    public async Task<bool> ToggleTwoFactorAsync(string userId, bool enabled)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        user.TwoFactorEnabled = enabled;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshTokenValue, string ipAddress)
    {
        var refreshToken = await _dbContext.RefreshTokens
            .Include(r => r.User)
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

        var roles = new List<string> { refreshToken.User.Role };
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
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        return MapToUserDto(user);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private async Task<AuthResponseDto> CompleteLoginAsync(ApplicationUser user, string ipAddress)
    {
        user.LastIp = ipAddress;
        user.LastLoginAt = DateTime.UtcNow;

        var oldTokens = _dbContext.RefreshTokens.Where(r => r.UserId == user.Id);
        _dbContext.RefreshTokens.RemoveRange(oldTokens);

        var refreshToken = CreateRefreshToken(user.Id, ipAddress);
        _dbContext.RefreshTokens.Add(refreshToken);

        await _dbContext.SaveChangesAsync();

        var roles = new List<string> { user.Role };
        var (token, expiration) = _jwtService.GenerateToken(user, roles);

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
        // Invalidate any previous unused codes for same user+purpose
        var oldCodes = _dbContext.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Purpose == purpose && !c.IsUsed);
        foreach (var old in oldCodes)
        {
            old.IsUsed = true;
        }

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
        var value = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 10_000_000;
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
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl,
            RegistrationIp = user.RegistrationIp,
            LastIp = user.LastIp,
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt,
            IsEmailVerified = user.IsEmailVerified,
            TwoFactorEnabled = user.TwoFactorEnabled
        };
    }
}
