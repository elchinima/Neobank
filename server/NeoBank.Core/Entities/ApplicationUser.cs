namespace NeoBank.Core.Entities;

public class ApplicationUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string RoleId { get; set; } = "User";
    public Role? Role { get; set; }
    public string? AvatarUrl { get; set; }
    public string? RegistrationIp { get; set; }
    public string? LastIp { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsEmailVerified { get; set; } = false;
    public bool TwoFactorEnabled { get; set; } = false;
    public List<RefreshToken> RefreshTokens { get; set; } = new();
    
    [System.ComponentModel.DataAnnotations.MaxLength(1000)]
    public string? Note { get; set; }
}
