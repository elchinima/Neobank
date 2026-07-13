namespace NeoBank.Application.Interfaces;

public interface ISupportAIService
{
    Task<string> GetAIResponseAsync(string message, string language);
}
