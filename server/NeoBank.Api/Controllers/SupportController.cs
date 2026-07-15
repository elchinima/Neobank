using Microsoft.AspNetCore.Mvc;
using NeoBank.Application.Interfaces;
using System.Security.Claims;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;
using NeoBank.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using System.Net.Http.Headers;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportController : ControllerBase
{
    private readonly ISupportAIService _supportAIService;
    private readonly IApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public SupportController(
        ISupportAIService supportAIService,
        IApplicationDbContext dbContext,
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _supportAIService = supportAIService;
        _dbContext = dbContext;
        _configuration = configuration;
        _httpClient = httpClient;
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

        string chatId = request.ChatId ?? Guid.NewGuid().ToString();

        var supportChat = await _dbContext.SupportChats.FirstOrDefaultAsync(c => c.Id == chatId);
        if (supportChat == null)
        {
            supportChat = new SupportChat
            {
                Id = chatId,
                UserId = userId ?? string.Empty
            };
            _dbContext.SupportChats.Add(supportChat);
        }

        var userMsg = new SupportChatMessage
        {
            Sender = "User",
            Text = request.Message,
            ImagePath = request.ImageBase64,
            Time = DateTime.UtcNow.ToString("HH:mm")
        };
        supportChat.Chat.Add(userMsg);
        
        await _dbContext.SaveChangesAsync();

        var response = await _supportAIService.GetAIResponseAsync(request.Message, request.Language, request.History, request.AgentName, userId, request.ImageBase64);
        
        var aiMsg = new SupportChatMessage
        {
            Sender = "AI",
            Text = response,
            ImagePath = null,
            Time = DateTime.UtcNow.ToString("HH:mm")
        };
        supportChat.Chat.Add(aiMsg);

        await _dbContext.SaveChangesAsync();

        return Ok(new { response, chatId });
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file, [FromForm] string? chatId)
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
            ms.Position = 0;

            string finalChatId = string.IsNullOrWhiteSpace(chatId) ? Guid.NewGuid().ToString() : chatId;
            string fileName = $"{Guid.NewGuid()}.webp";
            string objectPath = $"files/{finalChatId}/{fileName}";

            var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
            var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
            var bucketName = _configuration["SupportChatBucketName"] ?? _configuration["SUPPORT_CHAT_BUCKET_NAME"] ?? "neobank-files";
            
            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            {
                return StatusCode(500, "Supabase configuration is missing.");
            }

            var uploadUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}/{objectPath}";
            var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
            request.Headers.Add("apiKey", supabaseKey);
            request.Content = new ByteArrayContent(ms.ToArray());
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("image/webp");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                return StatusCode(500, $"Supabase upload failed: {err}");
            }

            var publicUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/{objectPath}";

            // The frontend might expect imageBase64 property due to previous implementation, 
            // so we return the public URL in that property to avoid breaking the frontend if it's already coded that way.
            return Ok(new { imageBase64 = publicUrl, chatId = finalChatId });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error processing image: {ex.Message}");
        }
    }

    [HttpPost("chat/{chatId}/review")]
    public async Task<IActionResult> SubmitReview(string chatId, [FromBody] ReviewRequest request)
    {
        var supportChat = await _dbContext.SupportChats.FirstOrDefaultAsync(c => c.Id == chatId);
        if (supportChat == null)
        {
            return NotFound("Chat not found.");
        }

        supportChat.Review.Add(new SupportChatReview
        {
            Rating = request.Rating,
            Comment = request.Comment
        });

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Review saved successfully." });
    }
}

public class ChatRequest
{
    public string? ChatId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Language { get; set; } = "az";
    public List<ChatMessage> History { get; set; } = new List<ChatMessage>();
    public string AgentName { get; set; } = "NeoBank Assistant";
    public string? ImageBase64 { get; set; }
}

public class ReviewRequest
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
