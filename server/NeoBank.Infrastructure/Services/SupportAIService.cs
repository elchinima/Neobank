using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace NeoBank.Infrastructure.Services;

public class SupportAIService : ISupportAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupportAIService> _logger;
    private readonly IApplicationDbContext _dbContext;

    public SupportAIService(HttpClient httpClient, IConfiguration configuration, ILogger<SupportAIService> logger, IApplicationDbContext dbContext)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task<string> GetAIResponseAsync(string message, string language, List<ChatMessage> history, string agentName, string? userId = null)
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

        try {
            var cashbacks = await _dbContext.CashbackCategories.ToListAsync();
            if (cashbacks.Any())
            {
                extraPromptBuilder.AppendLine("---");
                extraPromptBuilder.AppendLine("IMPORTANT - ACTUAL CASHBACK CATEGORIES FROM DATABASE:");
                extraPromptBuilder.AppendLine("When the user asks about cashback, you MUST provide these exact categories, rates and limits:");
                foreach (var cb in cashbacks)
                {
                    extraPromptBuilder.AppendLine($"- Category: {cb.TitleAz} / {cb.TitleRu} / {cb.TitleEn}. Rate: {cb.Rate}%. Limit: {cb.Limit} AZN.");
                }
                extraPromptBuilder.AppendLine("---");
            }

            var footerSettings = await _dbContext.FooterSettings.ToListAsync();
            if (footerSettings.Any())
            {
                extraPromptBuilder.AppendLine("---");
                extraPromptBuilder.AppendLine("IMPORTANT - BANK CONTACT INFO FROM DATABASE (FOOTER SETTINGS):");
                extraPromptBuilder.AppendLine("When the user asks for contact info (phone, email, address, social links), you MUST provide these exact details:");
                foreach (var setting in footerSettings)
                {
                    extraPromptBuilder.AppendLine($"- {setting.Key} ({setting.Category}): {setting.Value} (Link: {setting.Url})");
                }
                extraPromptBuilder.AppendLine("---");
            }

            if (!string.IsNullOrEmpty(userId))
            {
                var userCards = await _dbContext.Cards.Where(c => c.UserId == userId).ToListAsync();
                if (userCards.Any())
                {
                    extraPromptBuilder.AppendLine("---");
                    extraPromptBuilder.AppendLine("IMPORTANT - THE CURRENT USER'S CARDS:");
                    extraPromptBuilder.AppendLine("The user currently chatting with you has the following cards. You can see their ID, last 4 digits of the card number, status, and balance:");
                    foreach (var card in userCards)
                    {
                        var last4 = card.CardNumber?.Replace(" ", "").Length >= 4 
                            ? card.CardNumber.Replace(" ", "").Substring(card.CardNumber.Replace(" ", "").Length - 4) 
                            : "N/A";
                        extraPromptBuilder.AppendLine($"- Card ID: {card.Id}, Last 4 Digits: {last4}, Status: {card.Status}, Balance: {card.Balance} AZN");
                    }
                    extraPromptBuilder.AppendLine("---");
                }
            }
        } catch(Exception ex) {
            _logger.LogError(ex, "Failed to load database categories for AI prompt.");
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
                    new { text = $"You are a helpful, professional, and friendly customer support agent for NeoBank. Your name is {agentName}. RULE 1: You are a HUMAN agent. You are NOT an AI, NOT a bot, and NOT a virtual assistant. NEVER admit to being an AI or bot under any circumstances. RULE 2: You MUST ALWAYS respond in {langName}. If the user speaks a different language, seamlessly translate and provide the answer in {langName}. NEVER apologize for the language, NEVER mention that you only speak {langName}, and NEVER mention any language rules. {extraPrompt}" }
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

            if (text != null && !string.IsNullOrEmpty(userId))
            {
                var regex = new Regex(@"\[BLOCK_CARD:\s*([^\]]+)\]");
                var matches = regex.Matches(text);
                bool dbUpdated = false;
                List<string> errors = new List<string>();
                
                foreach (Match match in matches)
                {
                    if (match.Groups.Count > 1)
                    {
                        var cardId = match.Groups[1].Value.Trim();
                        try 
                        {
                            var cardToBlock = await _dbContext.Cards.FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId);
                            if (cardToBlock == null)
                            {
                                errors.Add($"Карта не найдена в системе или доступ к ней запрещен.");
                            }
                            else if (cardToBlock.Status != "Blocked")
                            {
                                cardToBlock.Status = "Blocked";
                                dbUpdated = true;
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error blocking card {CardId}", cardId);
                            errors.Add($"Внутренняя ошибка сервера при попытке заблокировать карту.");
                        }
                    }
                }
                
                if (dbUpdated)
                {
                    try {
                        await _dbContext.SaveChangesAsync();
                    } catch (Exception ex) {
                        _logger.LogError(ex, "Error saving block card changes.");
                        errors.Add("Ошибка базы данных. Карты не были заблокированы, попробуйте позже.");
                    }
                }

                // Remove the tags from the final response text sent to the user
                text = regex.Replace(text, "");

                if (errors.Any())
                {
                    text += "\n\n**Системное уведомление (Ошибка блокировки):**\n- " + string.Join("\n- ", errors);
                }
            }

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
