namespace NeoBank.Core.Entities;

public class FooterSetting
{
    public int Id { get; set; }
    
    /// <summary>
    /// e.g. "Contact" or "Social"
    /// </summary>
    public string Category { get; set; } = string.Empty;
    
    /// <summary>
    /// e.g. "email", "phone", "address", "facebook", "instagram"
    /// </summary>
    public string Key { get; set; } = string.Empty;
    
    /// <summary>
    /// Display text (for contacts) or empty (for socials)
    /// </summary>
    public string Value { get; set; } = string.Empty;
    
    /// <summary>
    /// The actual href (e.g. mailto:..., tel:..., or https://...)
    /// </summary>
    public string Url { get; set; } = string.Empty;
}
