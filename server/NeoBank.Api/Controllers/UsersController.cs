using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Interfaces;
using NeoBank.Infrastructure.Services;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAvatarProcessingService _avatarProcessingService;

    public UsersController(IApplicationDbContext context, IAvatarProcessingService avatarProcessingService)
    {
        _context = context;
        _avatarProcessingService = avatarProcessingService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        var userId = GetUserId();
        try
        {
            var avatarUrl = await _avatarProcessingService.ProcessAndUploadAvatarAsync(userId, file);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.AvatarUrl = avatarUrl;
                await _context.SaveChangesAsync();
            }

            return Ok(new { avatarUrl, message = "Avatar successfully uploaded and processed (512x512, WebP, 50% compression)." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error processing image: " + ex.Message });
        }
    }
}
