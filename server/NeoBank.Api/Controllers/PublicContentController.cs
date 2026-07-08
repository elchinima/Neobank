using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/public-content")]
public class PublicContentController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public PublicContentController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPublicContent()
    {
        var rawPages = await _context.PublicPageSettings.ToListAsync();

        var pages = rawPages
            .GroupBy(p => p.PageName)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                PageKey = g.Key,
                Translations = g.ToDictionary(
                    t => t.LanguageCode,
                    t => new { t.BannerImageUrl, t.MediaText, t.UpdatedAt }
                )
            });

        var footerSettings = await _context.FooterSettings.ToListAsync();
        
        var footerContacts = footerSettings
            .Where(f => f.Category == "Contact")
            .Select(f => new { contactKey = f.Key, label = f.Key, value = f.Value, url = f.Url });
            
        var footerSocials = footerSettings
            .Where(f => f.Category == "Social")
            .Select(f => new { section = "social", label = f.Key, url = f.Url, isExternal = true });

        return Ok(new { pages, footerContacts, footerSocials });
    }
}
