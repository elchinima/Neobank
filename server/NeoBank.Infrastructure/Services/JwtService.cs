using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime Expiration) GenerateToken(ApplicationUser user, IList<string> roles)
    {
        var secretKey = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForNeoBankJwtToken2026!#SecureKey_Minimum32Chars";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.GivenName, user.FirstName),
            new(ClaimTypes.Surname, user.LastName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("avatarUrl", user.AvatarUrl ?? string.Empty)
        };

        foreach (var role in roles)
        {
            if (!claims.Any(c => c.Type == ClaimTypes.Role && c.Value == role))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        var expiryInMinutes = double.TryParse(_configuration["Jwt:ExpiryInMinutes"], out var minutes) ? minutes : 30;
        var expiration = DateTime.UtcNow.AddMinutes(expiryInMinutes);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "NeoBankApi",
            audience: _configuration["Jwt:Audience"] ?? "NeoBankClient",
            claims: claims,
            expires: expiration,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiration);
    }

    public ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        var secretKey = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForNeoBankJwtToken2026!#SecureKey_Minimum32Chars";
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _configuration["Jwt:Issuer"] ?? "NeoBankApi",
            ValidAudience = _configuration["Jwt:Audience"] ?? "NeoBankClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateLifetime = true
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
