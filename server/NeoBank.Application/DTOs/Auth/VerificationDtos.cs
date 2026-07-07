namespace NeoBank.Application.DTOs.Auth;

public class VerifyEmailCodeDto
{
    public string UserId { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class TwoFactorLoginDto
{
    public string TempToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class ToggleTwoFactorDto
{
    public bool Enabled { get; set; }
}

public class ResendVerificationDto
{
    public string UserId { get; set; } = string.Empty;
    public string Purpose { get; set; } = "EmailVerification";
}
