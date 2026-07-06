namespace NeoBank.Application.DTOs.CardDebit;

public class CardDebitRequest
{
    public string CardId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Other";
    public string Description { get; set; } = string.Empty;
    public string? RecipientAccount { get; set; }
}
