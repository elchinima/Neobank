namespace NeoBank.Core.Entities;

public class Loan
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string TargetCardId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int TermMonths { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal RemainingBalance { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime NextPaymentDate { get; set; } = DateTime.UtcNow.AddMonths(1);
    public decimal PaidAmount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<LoanStatusHistory> StatusHistory { get; set; } = new List<LoanStatusHistory>();
}

public class LoanStatusHistory
{
    public string Status { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
