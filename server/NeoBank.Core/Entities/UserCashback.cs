namespace NeoBank.Core.Entities;

public class UserCashback
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public decimal AmountEarned { get; set; }
    
    public ApplicationUser User { get; set; } = null!;
    public CashbackCategory Category { get; set; } = null!;
}
