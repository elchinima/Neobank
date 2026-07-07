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

    [HttpPut("page-settings/{pageKey}")]
    public async Task<IActionResult> UpdatePageSetting(string pageKey, [FromBody] PageSettingRequest request)
    {
        var normalizedPageKey = pageKey.Trim().ToLower();
        var existingRecords = await _context.PublicPageSettings
            .Where(p => p.PageName == normalizedPageKey)
            .ToListAsync();

        if (request.Translations != null)
        {
            foreach (var kvp in request.Translations)
            {
                var lang = kvp.Key;
                var transReq = kvp.Value;

                var record = existingRecords.FirstOrDefault(r => r.LanguageCode == lang);
                if (record == null)
                {
                    record = new PublicPageSetting { PageName = normalizedPageKey, LanguageCode = lang };
                    _context.PublicPageSettings.Add(record);
                }

                record.BannerImageUrl = string.IsNullOrWhiteSpace(transReq.BannerImageUrl) ? string.Empty : transReq.BannerImageUrl.Trim();
                record.MediaText = transReq.MediaText?.Trim() ?? string.Empty;
                record.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        var updatedRecords = await _context.PublicPageSettings
            .Where(p => p.PageName == normalizedPageKey)
            .ToListAsync();

        return Ok(new
        {
            PageKey = normalizedPageKey,
            Translations = updatedRecords.ToDictionary(
                t => t.LanguageCode,
                t => new { t.BannerImageUrl, t.MediaText, t.UpdatedAt }
            )
        });
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
