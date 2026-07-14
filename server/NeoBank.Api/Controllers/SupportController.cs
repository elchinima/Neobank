using Microsoft.AspNetCore.Mvc;
using NeoBank.Application.Interfaces;
using System.Security.Claims;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;
namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportController : ControllerBase
{
    private readonly ISupportAIService _supportAIService;

    public SupportController(ISupportAIService supportAIService)
    {
        _supportAIService = supportAIService;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message) && string.IsNullOrWhiteSpace(request.ImageBase64))
        {
            return BadRequest("Message or image is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            request.Message = "Please analyze this image.";
        }

        string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;

        var response = await _supportAIService.GetAIResponseAsync(request.Message, request.Language, request.History, request.AgentName, userId, request.ImageBase64);
        return Ok(new { response });
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("File size exceeds 10MB limit.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
        {
            return BadRequest("Only .jpg, .jpeg, and .png formats are allowed.");
        }

        try
        {
            using var image = await Image.LoadAsync(file.OpenReadStream());
            
            // Reduce width and height by 50%
            image.Mutate(x => x.Resize(image.Width / 2, image.Height / 2));
            
            using var ms = new MemoryStream();
            // Save as Webp with 50% quality
            await image.SaveAsWebpAsync(ms, new WebpEncoder { Quality = 50 });
            
            var base64 = Convert.ToBase64String(ms.ToArray());
            return Ok(new { imageBase64 = base64 });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error processing image: {ex.Message}");
        }
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string Language { get; set; } = "az";
    public List<ChatMessage> History { get; set; } = new List<ChatMessage>();
    public string AgentName { get; set; } = "NeoBank Assistant";
    public string? ImageBase64 { get; set; }
}
