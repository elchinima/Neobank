using System.ComponentModel.DataAnnotations.Schema;

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
    public string Iban { get; set; } = string.Empty;
    
    [NotMapped]
    public string Swift { get; } = "NEOBAZ22";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal CreditLimit { get; set; } = 0.00m;
    
    public DateTime? CreditLimitUpdatedAt { get; set; }
    
    [System.Text.Json.Serialization.JsonIgnore]
    public string? Pin { get; set; } = null;
    
    [NotMapped]
    public bool HasPin => !string.IsNullOrEmpty(Pin);
}
