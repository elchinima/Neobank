namespace NeoBank.Core.Entities;

public class PublicPageSetting
{
    public int Id { get; set; }
    public string PageName { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string? BannerImageUrl { get; set; }
    public string MediaText { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
