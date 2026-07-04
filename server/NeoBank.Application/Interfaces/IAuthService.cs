using NeoBank.Application.DTOs.Auth;

namespace NeoBank.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string ipAddress);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, string ipAddress);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string ipAddress);
    Task<bool> RevokeTokenAsync(string refreshToken, string ipAddress);
    Task<UserDto?> GetCurrentUserAsync(string userId);
}
