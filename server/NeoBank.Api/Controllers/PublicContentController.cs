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

        return Ok(new { pages });
    }
}
