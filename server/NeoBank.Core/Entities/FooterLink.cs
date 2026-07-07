namespace NeoBank.Core.Entities;

public class FooterLink
{
    public int Id { get; set; }
    public string Section { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsExternal { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
