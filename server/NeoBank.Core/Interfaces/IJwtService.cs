using System.Security.Claims;
using NeoBank.Core.Entities;

namespace NeoBank.Core.Interfaces;

public interface IJwtService
{
    (string Token, DateTime Expiration) GenerateToken(ApplicationUser user, IList<string> roles);
    ClaimsPrincipal? GetPrincipalFromToken(string token);
}
