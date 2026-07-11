namespace NeoBank.Core.Entities;

public enum UserRole
{
    Developer = 1,
    SuperAdmin = 2,
    Admin = 3,
    Support = 4,
    Business = 5,
    User = 6
}

/// <summary>
/// Helper for converting UserRole enum to display-friendly string.
/// "SuperAdmin" → "Super Admin", others as-is.
/// </summary>
public static class UserRoleExtensions
{
    public static string ToDisplayName(this UserRole role) => role switch
    {
        UserRole.SuperAdmin => "Super Admin",
        _ => role.ToString()
    };
}
