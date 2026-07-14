namespace NeoBank.Application.Interfaces;

public class ChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}

public interface ISupportAIService
{
    Task<string> GetAIResponseAsync(string message, string language, List<ChatMessage> history, string agentName, string? userId = null, string? imageBase64 = null);
}
