using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NeoBank.Application.Interfaces;

namespace NeoBank.Infrastructure.Services;

public class SupportAIService : ISupportAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupportAIService> _logger;

    public SupportAIService(HttpClient httpClient, IConfiguration configuration, ILogger<SupportAIService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetAIResponseAsync(string message, string language, List<ChatMessage> history, string agentName)
    {
        var apiKey = _configuration["GEMINI_API_KEY"];
        var modelName = _configuration["GEMINI_MODEL"] ?? "gemini-1.5-flash";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("Gemini API key is not configured.");
            return "Oops, an error occurred connecting to the AI. Please try again later.";
        }

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";

        var langName = language switch {
            "ru" => "Russian",
            "en" => "English",
            _ => "Azerbaijani"
        };

        var baseDir = Directory.GetCurrentDirectory();
        var promptsDir = Path.Combine(baseDir, "Data", "AI Promts");
        
        if (!Directory.Exists(promptsDir))
        {
            // Fallback for development if running from NeoBank.Api
            promptsDir = Path.Combine(baseDir, "..", "NeoBank.Infrastructure", "Data", "AI Promts");
        }

        var extraPromptBuilder = new StringBuilder();
        if (Directory.Exists(promptsDir))
        {
            var promptFiles = Directory.GetFiles(promptsDir, "*.md");
            foreach (var file in promptFiles)
            {
                extraPromptBuilder.AppendLine(await File.ReadAllTextAsync(file));
                extraPromptBuilder.AppendLine();
            }
        }
        var extraPrompt = extraPromptBuilder.ToString();

        var contents = new List<object>();
        foreach (var msg in history)
        {
            contents.Add(new { role = msg.Role, parts = new[] { new { text = msg.Text } } });
        }
        contents.Add(new { role = "user", parts = new[] { new { text = message } } });

        var requestBody = new
        {
            systemInstruction = new
            {
                parts = new[]
                {
                    new { text = $"You are a helpful, professional, and friendly AI customer support agent for NeoBank. Your name is {agentName}. Answer concisely and clearly. You MUST ONLY answer in {langName} language, regardless of what language the user speaks. {extraPrompt}" }
                }
            },
            contents = contents
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(url, content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API error: {StatusCode} {ErrorContent}", response.StatusCode, errorContent);
                return "Sorry, a server error occurred while contacting the AI.";
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            await Task.Delay(20000);

            return text ?? "I could not formulate an answer. Please try again.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Gemini API.");
            return "Connection problem. Our specialists will join you shortly.";
        }
    }
}
