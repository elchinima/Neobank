using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoBank.Application.DTOs.Auth;
using NeoBank.Application.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    private string GetClientIpAddress()
    {
        var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = expiresAt,
            Secure = HttpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/api/auth"
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var ip = GetClientIpAddress();
            var response = await _authService.RegisterAsync(dto, ip);
            SetRefreshTokenCookie(response.RefreshToken, response.RefreshTokenExpiration);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during registration.", details = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            var ip = GetClientIpAddress();
            var response = await _authService.LoginAsync(dto, ip);
            SetRefreshTokenCookie(response.RefreshToken, response.RefreshTokenExpiration);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during login.", details = ex.Message });
        }
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto? dto)
    {
        try
        {
            var token = Request.Cookies["refreshToken"] ?? dto?.RefreshToken;
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { message = "Refresh token is required." });
            }

            var ip = GetClientIpAddress();
            var response = await _authService.RefreshTokenAsync(token, ip);
            SetRefreshTokenCookie(response.RefreshToken, response.RefreshTokenExpiration);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during token refresh.", details = ex.Message });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto? dto)
    {
        try
        {
            var token = Request.Cookies["refreshToken"] ?? dto?.RefreshToken;
            if (!string.IsNullOrEmpty(token))
            {
                var ip = GetClientIpAddress();
                await _authService.RevokeTokenAsync(token, ip);
            }

            Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "/api/auth" });
            return Ok(new { message = "Logged out successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during logout.", details = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(user);
    }
}
