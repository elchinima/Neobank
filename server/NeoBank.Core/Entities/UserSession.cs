namespace NeoBank.Core.Entities;

public class UserSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public string? RegistrationIp { get; set; }
    public string? LastIp { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEmailVerified { get; set; } = false;
    public bool TwoFactorEnabled { get; set; } = false;
    public bool IsSubscribedToNewsletter { get; set; } = false;

    public string? CashbackVariant { get; set; } // "A" or "B", null = not yet selected

    [System.ComponentModel.DataAnnotations.MaxLength(1000)]
    public string? Note { get; set; }
}
