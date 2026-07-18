using NeoBank.Application.DTOs.Auth;

namespace NeoBank.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string ipAddress);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, string ipAddress);
    Task<AuthResponseDto> GoogleLoginAsync(string googleToken, string ipAddress);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string ipAddress);
    Task<bool> RevokeTokenAsync(string refreshToken, string ipAddress);
    Task<UserDto?> GetCurrentUserAsync(string userId);

    // Email verification
    Task<bool> SendEmailVerificationAsync(string userId);
    Task<AuthResponseDto> VerifyEmailCodeAsync(string userId, string code, string ipAddress);

    // 2FA
    Task<AuthResponseDto> VerifyTwoFactorCodeAsync(string tempToken, string code, string ipAddress);
    Task<bool> ToggleTwoFactorAsync(string userId, bool enabled);
    Task<bool> ConfirmDisableTwoFactorAsync(string token);

    // Password Management
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto);
}
