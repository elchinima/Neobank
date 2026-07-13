using Microsoft.AspNetCore.Mvc;
using NeoBank.Application.Interfaces;

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

        var response = await _supportAIService.GetAIResponseAsync(request.Message);
        return Ok(new { response });
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
}
