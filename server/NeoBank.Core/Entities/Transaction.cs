namespace NeoBank.Core.Entities;

public class Transaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string CardId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = "Debit";
    public string Category { get; set; } = "Other";
    public string Description { get; set; } = string.Empty;
    public string RecipientAccount { get; set; } = string.Empty;
    public string Status { get; set; } = "Completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public decimal? BalanceAfter { get; set; }
}
