namespace NeoBank.Core.Entities;

public class CashbackCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TitleEn { get; set; } = string.Empty;
    public string TitleRu { get; set; } = string.Empty;
    public string TitleAz { get; set; } = string.Empty;
    public string TextEn { get; set; } = string.Empty;
    public string TextRu { get; set; } = string.Empty;
    public string TextAz { get; set; } = string.Empty;
    public decimal Rate { get; set; } // e.g. 100 for 100%, 5 for 5%

    // Navigation properties
    public ICollection<CashbackMcc> MccCodes { get; set; } = new List<CashbackMcc>();
    public ICollection<UserCashback> UserCashbacks { get; set; } = new List<UserCashback>();
}
