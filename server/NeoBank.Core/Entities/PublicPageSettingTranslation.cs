namespace NeoBank.Core.Entities;

public class PublicPageSettingTranslation
{
    public int Id { get; set; }
    public int PublicPageSettingId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string? BannerImageUrl { get; set; }
    public string MediaText { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public PublicPageSetting PublicPageSetting { get; set; } = null!;
}
