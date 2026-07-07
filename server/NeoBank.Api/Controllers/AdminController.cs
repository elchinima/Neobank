using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AdminController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var usersCount = await _context.Users.CountAsync();
        var pagesCount = await _context.PublicPageSettings.CountAsync();
        var footerLinksCount = await _context.FooterLinks.CountAsync();
        var footerContactsCount = await _context.FooterContacts.CountAsync();

        var recentUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Role,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            usersCount,
            pagesCount,
            footerLinksCount,
            footerContactsCount,
            recentUsers
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        var usersQuery = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            usersQuery = usersQuery.Where(u =>
                u.Id.ToLower().Contains(normalizedSearch) ||
                u.FirstName.ToLower().Contains(normalizedSearch) ||
                u.LastName.ToLower().Contains(normalizedSearch) ||
                u.Email.ToLower().Contains(normalizedSearch) ||
                u.Role.ToLower().Contains(normalizedSearch));
        }

        var users = await usersQuery
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("public-content")]
    public async Task<IActionResult> GetEditablePublicContent()
    {
        var pages = await _context.PublicPageSettings
            .Include(p => p.Translations)
            .OrderBy(p => p.PageKey)
            .Select(p => new
            {
                p.PageKey,
                Translations = p.Translations.ToDictionary(
                    t => t.LanguageCode,
                    t => new { t.BannerImageUrl, t.MediaText, t.UpdatedAt }
                )
            })
            .ToListAsync();

        var footerLinks = await _context.FooterLinks
            .OrderBy(f => f.Section)
            .ThenBy(f => f.SortOrder)
            .ToListAsync();

        var footerContacts = await _context.FooterContacts
            .OrderBy(f => f.SortOrder)
            .ToListAsync();

        return Ok(new { pages, footerLinks, footerContacts });
    }

    [HttpPut("page-settings/{pageKey}")]
    public async Task<IActionResult> UpdatePageSetting(string pageKey, [FromBody] PageSettingRequest request)
    {
        var normalizedPageKey = pageKey.Trim().ToLower();
        var page = await _context.PublicPageSettings
            .Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.PageKey == normalizedPageKey);

        if (page == null)
        {
            page = new PublicPageSetting { PageKey = normalizedPageKey };
            _context.PublicPageSettings.Add(page);
        }

        if (request.Translations != null)
        {
            foreach (var kvp in request.Translations)
            {
                var lang = kvp.Key;
                var transReq = kvp.Value;

                var existingTranslation = page.Translations.FirstOrDefault(t => t.LanguageCode == lang);
                if (existingTranslation == null)
                {
                    existingTranslation = new PublicPageSettingTranslation { LanguageCode = lang };
                    page.Translations.Add(existingTranslation);
                }

                existingTranslation.BannerImageUrl = string.IsNullOrWhiteSpace(transReq.BannerImageUrl) ? string.Empty : transReq.BannerImageUrl.Trim();
                existingTranslation.MediaText = transReq.MediaText?.Trim() ?? string.Empty;
                existingTranslation.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            page.PageKey,
            Translations = page.Translations.ToDictionary(
                t => t.LanguageCode,
                t => new { t.BannerImageUrl, t.MediaText, t.UpdatedAt }
            )
        });
    }

    [HttpPut("footer-links/{id:int}")]
    public async Task<IActionResult> UpdateFooterLink(int id, [FromBody] FooterLinkRequest request)
    {
        var link = await _context.FooterLinks.FirstOrDefaultAsync(f => f.Id == id);
        if (link == null)
        {
            return NotFound(new { message = "Footer link not found." });
        }

        link.Label = request.Label?.Trim() ?? string.Empty;
        link.Url = request.Url?.Trim() ?? string.Empty;
        link.IsExternal = request.IsExternal;
        link.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(link);
    }

    [HttpPut("footer-contacts/{id:int}")]
    public async Task<IActionResult> UpdateFooterContact(int id, [FromBody] FooterContactRequest request)
    {
        var contact = await _context.FooterContacts.FirstOrDefaultAsync(f => f.Id == id);
        if (contact == null)
        {
            return NotFound(new { message = "Footer contact not found." });
        }

        contact.Label = request.Label?.Trim() ?? string.Empty;
        contact.Value = request.Value?.Trim() ?? string.Empty;
        contact.Url = request.Url?.Trim() ?? string.Empty;
        contact.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(contact);
    }
}

public class PageSettingRequest
{
    public Dictionary<string, PageSettingTranslationRequest>? Translations { get; set; }
}

public class PageSettingTranslationRequest
{
    public string? BannerImageUrl { get; set; }
    public string? MediaText { get; set; }
}

public class FooterLinkRequest
{
    public string? Label { get; set; }
    public string? Url { get; set; }
    public bool IsExternal { get; set; }
}

public class FooterContactRequest
{
    public string? Label { get; set; }
    public string? Value { get; set; }
    public string? Url { get; set; }
}
