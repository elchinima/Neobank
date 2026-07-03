using NeoBank.Application.DTOs.Auth;

namespace NeoBank.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserDto?> GetCurrentUserAsync(string userId);
}
