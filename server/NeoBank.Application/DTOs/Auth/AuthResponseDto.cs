namespace NeoBank.Application.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiration { get; set; }
    public UserDto User { get; set; } = null!;

    // Intermediate states — set when full auth is pending verification
    public bool RequiresEmailVerification { get; set; } = false;
    public bool RequiresTwoFactor { get; set; } = false;
    public string? TempToken { get; set; } // Used to link 2FA code to the pending login session
}

