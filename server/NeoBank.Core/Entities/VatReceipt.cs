namespace NeoBank.Core.Entities;

public class VatReceipt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal VatRefund { get; set; }
    public string Status { get; set; } = "Approved";
    public DateTime Date { get; set; } = DateTime.UtcNow;
}
