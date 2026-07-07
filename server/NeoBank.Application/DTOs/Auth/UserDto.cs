namespace NeoBank.Application.DTOs.Auth;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? RegistrationIp { get; set; }
    public string? LastIp { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool TwoFactorEnabled { get; set; }
}
