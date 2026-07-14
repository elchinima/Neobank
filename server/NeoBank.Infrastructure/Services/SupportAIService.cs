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

    public async Task<string> GetAIResponseAsync(string message, string language, List<ChatMessage> history, string agentName, string? userId = null, string? imageBase64 = null)
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
                    extraPromptBuilder.AppendLine("The user currently chatting with you has the following cards:");
                    foreach (var card in userCards)
                    {
                        var last4 = card.CardNumber?.Replace(" ", "").Length >= 4 
                            ? card.CardNumber.Replace(" ", "").Substring(card.CardNumber.Replace(" ", "").Length - 4) 
                            : "N/A";
                        extraPromptBuilder.AppendLine($"- Card ID: {card.Id}, Last 4 Digits: {last4}, Status: {card.Status}, Balance: {card.Balance} AZN");
                    }
                    extraPromptBuilder.AppendLine();
                    extraPromptBuilder.AppendLine("CARD BLOCKING SYSTEM: To block a card, you MUST include exactly this tag in your reply: [BLOCK_CARD: <CardID>] where <CardID> is the Card ID from the list above (the UUID/GUID). Example: if the user wants to block card with last 4 digits 5169 and its Card ID is abc-123-def, you write [BLOCK_CARD: abc-123-def] somewhere in your message. The server will process this tag and actually block the card. The tag will be hidden from the user automatically. WITHOUT THIS TAG THE CARD WILL NOT BE BLOCKED NO MATTER WHAT YOU SAY IN TEXT.");
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
        var userParts = new List<object> { new { text = message } };
        if (!string.IsNullOrEmpty(imageBase64))
        {
            userParts.Add(new { inlineData = new { mimeType = "image/webp", data = imageBase64 } });
        }
        contents.Add(new { role = "user", parts = userParts.ToArray() });

        var requestBody = new
        {
            systemInstruction = new
            {
                parts = new[]
                {
                    new { text = $"You are a real human customer support agent working at NeoBank's office. Your name is {agentName}. You type in a live chat window, so keep your messages SHORT and CASUAL — like a real person texting, not an AI writing an essay. RULE 1: You are a HUMAN agent. You are NOT an AI, NOT a bot, and NOT a virtual assistant. NEVER admit to being an AI or bot under any circumstances. RULE 2: You MUST ALWAYS respond in {langName}. If the user speaks a different language, seamlessly translate and provide the answer in {langName}. NEVER apologize for the language, NEVER mention that you only speak {langName}, and NEVER mention any language rules. RULE 3: Keep sentences short and simple. Use polite but natural language. ALWAYS address the user formally using 'Вы' (in Russian) or 'Siz' (in Azerbaijani). NEVER use informal 'ты' or 'sən'. NEVER use words like 'Слушай', 'Тебе', 'дай знать'. Use ) or )) as smileys occasionally (CIS-style, without colon). RULE 4 (CRITICAL — CARD BLOCKING): When a user asks you to block a card, you MUST include the hidden tag [BLOCK_CARD: <CardID>] in your response using the Card ID from the card data provided in your context. If you do NOT include this tag, the card will NOT be blocked even if you say it is. NEVER claim you blocked a card without including this tag. RULE 5 (CRITICAL — CHAT CLOSING): If the user explicitly states they have no more questions (e.g. 'no questions', 'sual yoxdur', 'нет вопросов', 'that is all', etc.), you MUST include the exact tag [CLOSE_CHAT] anywhere in your response. This tag is used by the system to close the chat and show the feedback form. Always say goodbye politely along with this tag. {extraPrompt}" }
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
                bool anyBlockAttempted = matches.Count > 0;
                bool dbUpdated = false;
                List<string> systemMessages = new List<string>();
                
                foreach (Match match in matches)
                {
                    if (match.Groups.Count > 1)
                    {
                        var cardIdOrLast4 = match.Groups[1].Value.Trim();
                        try 
                        {
                            // Try to find the card either by exact ID or by last 4 digits
                            var userCards = await _dbContext.Cards.Where(c => c.UserId == userId).ToListAsync();
                            var cardToBlock = userCards.FirstOrDefault(c => 
                                c.Id == cardIdOrLast4 || 
                                (c.CardNumber != null && c.CardNumber.Replace(" ", "").EndsWith(cardIdOrLast4))
                            );

                            var langKey = language ?? "az";
                            string displayNum = cardIdOrLast4;
                            if (cardToBlock?.CardNumber != null)
                            {
                                var cn = cardToBlock.CardNumber.Replace(" ", "");
                                displayNum = cn.Length >= 4 ? cn.Substring(cn.Length - 4) : cn;
                            }

                            if (cardToBlock == null)
                            {
                                string msg = langKey switch {
                                    "ru" => $"Карта ({displayNum}) не найдена.",
                                    "en" => $"Card ({displayNum}) not found.",
                                    _ => $"Kart ({displayNum}) tapılmadı."
                                };
                                systemMessages.Add("⚠️ " + msg);
                            }
                            else if (cardToBlock.Status == "Blocked")
                            {
                                string msg = langKey switch {
                                    "ru" => $"Карта {displayNum} уже заблокирована.",
                                    "en" => $"Card {displayNum} is already blocked.",
                                    _ => $"{displayNum} nömrəli kart artıq bloklanıb."
                                };
                                systemMessages.Add("ℹ️ " + msg);
                            }
                            else
                            {
                                cardToBlock.Status = "Blocked";
                                dbUpdated = true;
                                string msg = langKey switch {
                                    "ru" => $"Карта {displayNum} успешно заблокирована.",
                                    "en" => $"Card {displayNum} blocked successfully.",
                                    _ => $"{displayNum} nömrəli kart uğurla bloklandı."
                                };
                                systemMessages.Add("✅ " + msg);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error blocking card {CardId}", cardIdOrLast4);
                        }
                    }
                }
                
                if (dbUpdated)
                {
                    try {
                        await _dbContext.SaveChangesAsync();
                    } catch (Exception ex) {
                        _logger.LogError(ex, "Error saving block card changes.");
                        dbUpdated = false;
                    }
                }

                // Remove the [BLOCK_CARD:...] tags from the text the user sees
                text = regex.Replace(text, "").Trim();

                // Append the specific system messages to the AI's text so the user knows exactly what happened
                if (systemMessages.Any())
                {
                    text += "\n\n---\n" + string.Join("\n", systemMessages);
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
