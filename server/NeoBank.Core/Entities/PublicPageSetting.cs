namespace NeoBank.Core.Entities;

public class PublicPageSetting
{
    public int Id { get; set; }
    public string PageKey { get; set; } = string.Empty;
    public ICollection<PublicPageSettingTranslation> Translations { get; set; } = new List<PublicPageSettingTranslation>();
}
