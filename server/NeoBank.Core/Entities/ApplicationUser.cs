namespace NeoBank.Core.Entities;

public class ApplicationUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public List<RefreshToken> RefreshTokens { get; set; } = new();
    public UserSession? Session { get; set; }
}
