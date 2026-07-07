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
        var pages = await _context.PublicPageSettings
            .OrderBy(p => p.PageKey)
            .Select(p => new
            {
                p.PageKey,
                p.BannerImageUrl,
                p.MediaText,
                p.UpdatedAt
            })
            .ToListAsync();

        var footerLinks = await _context.FooterLinks
            .OrderBy(f => f.Section)
            .ThenBy(f => f.SortOrder)
            .Select(f => new
            {
                f.Id,
                f.Section,
                f.Label,
                f.Url,
                f.SortOrder,
                f.IsExternal
            })
            .ToListAsync();

        var footerContacts = await _context.FooterContacts
            .OrderBy(f => f.SortOrder)
            .Select(f => new
            {
                f.Id,
                f.ContactKey,
                f.Label,
                f.Value,
                f.Url,
                f.SortOrder
            })
            .ToListAsync();

        return Ok(new { pages, footerLinks, footerContacts });
    }
}
