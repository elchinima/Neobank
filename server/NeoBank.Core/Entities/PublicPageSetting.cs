namespace NeoBank.Core.Entities;

public class PublicPageSetting
{
    public int Id { get; set; }
    public string PageKey { get; set; } = string.Empty;
    public string? BannerImageUrl { get; set; }
    public string MediaText { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
