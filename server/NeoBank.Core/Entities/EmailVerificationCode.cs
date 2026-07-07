namespace NeoBank.Core.Entities;

public class EmailVerificationCode
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public string Code { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty; // "EmailVerification" | "TwoFactor"
    public string? TempToken { get; set; } // Used for 2FA flow to link code to session
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
