namespace NeoBank.Core.Entities;

public class Card
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string CardType { get; set; } = "Standard";
    public string CardNumber { get; set; } = string.Empty;
    public string Network { get; set; } = "Visa";
    public string Cvv { get; set; } = string.Empty;
    public string ExpiryDate { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public decimal Balance { get; set; } = 0.00m;
    public decimal MonthlyFee { get; set; } = 0.00m;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
