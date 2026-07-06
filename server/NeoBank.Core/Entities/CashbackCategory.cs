namespace NeoBank.Core.Entities;

public class CashbackCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TitleKey { get; set; } = string.Empty; // e.g. "catMetroTitle"
    public string TextKey { get; set; } = string.Empty; // e.g. "catMetroText"
    public decimal Rate { get; set; } // e.g. 100 for 100%, 5 for 5%

    // Navigation properties
    public ICollection<CashbackMcc> MccCodes { get; set; } = new List<CashbackMcc>();
    public ICollection<UserCashback> UserCashbacks { get; set; } = new List<UserCashback>();
}
