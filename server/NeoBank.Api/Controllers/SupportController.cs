using Microsoft.AspNetCore.Mvc;
using NeoBank.Application.Interfaces;
using System.Security.Claims;

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
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Message is required.");
        }

        string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;

        var response = await _supportAIService.GetAIResponseAsync(request.Message, request.Language, request.History, request.AgentName, userId);
        return Ok(new { response });
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string Language { get; set; } = "az";
    public List<ChatMessage> History { get; set; } = new List<ChatMessage>();
    public string AgentName { get; set; } = "NeoBank Assistant";
}
