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

    public async Task<string> GetAIResponseAsync(string message)
    {
        var apiKey = _configuration["GEMINI_API_KEY"];
        var modelName = _configuration["GEMINI_MODEL"] ?? "gemini-1.5-flash";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("Gemini API key is not configured.");
            return "Упс, произошла ошибка подключения к ИИ. Попробуйте позже.";
        }

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";

        var requestBody = new
        {
            systemInstruction = new
            {
                parts = new[]
                {
                    new { text = "You are a helpful, professional, and friendly AI customer support agent for NeoBank. Answer concisely and clearly in the language the user speaks." }
                }
            },
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = message }
                    }
                }
            }
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
                return "Извините, произошла ошибка сервера при обращении к ИИ.";
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text ?? "Я не смог сформулировать ответ. Попробуйте еще раз.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Gemini API.");
            return "Проблема с соединением. Наши специалисты скоро к вам присоединятся.";
        }
    }
}
