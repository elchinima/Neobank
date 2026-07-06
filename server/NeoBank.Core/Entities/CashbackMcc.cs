namespace NeoBank.Core.Entities;

public class CashbackMcc
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Code { get; set; } = string.Empty; // e.g. "001"
    
    public string CategoryId { get; set; } = string.Empty;
    public CashbackCategory Category { get; set; } = null!;
}
