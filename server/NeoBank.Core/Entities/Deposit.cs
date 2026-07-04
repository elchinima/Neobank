namespace NeoBank.Core.Entities;

public class Deposit
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string SourceCardId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int TermMonths { get; set; }
    public decimal InterestRate { get; set; }
    public decimal TotalIncome { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
