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

    [HttpGet("cashbacks")]
    public async Task<IActionResult> GetPublicCashbacks()
    {
        var categories = await _context.CashbackCategories
            .Select(c => new
            {
                c.Id,
                c.TitleEn, c.TitleRu, c.TitleAz,
                c.TextEn, c.TextRu, c.TextAz,
                c.Rate,
                c.Variant
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost("newsletter/request")]
    public async Task<IActionResult> RequestNewsletterSubscription([FromBody] NewsletterRequestDto dto, [FromServices] NeoBank.Application.Interfaces.IEmailService emailService)
    {
        if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest(new { message = "Email is required" });

        var user = await _context.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (user == null)
        {
            return Ok(new { exists = false });
        }

        if (user.Session != null && user.Session.IsSubscribedToNewsletter)
        {
            return Ok(new { exists = true, isSubscribed = true });
        }

        var code = Random.Shared.Next(1000, 9999).ToString();
        var verification = new NeoBank.Core.Entities.EmailVerificationCode
        {
            UserId = user.Id,
            Code = code,
            Purpose = "NewsletterSubscribe",
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };
        _context.EmailVerificationCodes.Add(verification);
        await _context.SaveChangesAsync();

        await emailService.SendVerificationCodeAsync(user.Email, user.FirstName, code, "NewsletterSubscribe");

        return Ok(new { exists = true, isSubscribed = false });
    }

    [HttpPost("newsletter/verify")]
    public async Task<IActionResult> VerifyNewsletterSubscription([FromBody] NewsletterVerifyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Code)) 
            return BadRequest(new { message = "Email and code are required" });

        var user = await _context.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (user == null) return BadRequest(new { message = "User not found" });

        var verification = await _context.EmailVerificationCodes
            .Where(x => x.UserId == user.Id && x.Purpose == "NewsletterSubscribe" && !x.IsUsed)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (verification == null || verification.Code != dto.Code || verification.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired code." });
        }

        verification.IsUsed = true;
        if (user.Session != null)
        {
            user.Session.IsSubscribedToNewsletter = true;
        }
        await _context.SaveChangesAsync();

        return Ok(new { message = "Successfully subscribed" });
    }

    [HttpPost("newsletter/unsubscribe")]
    public async Task<IActionResult> UnsubscribeNewsletter([FromBody] NewsletterRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest(new { message = "Email is required" });

        var user = await _context.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (user == null) return BadRequest(new { message = "User not found" });

        if (user.Session != null)
        {
            user.Session.IsSubscribedToNewsletter = false;
        }
        await _context.SaveChangesAsync();

        return Ok(new { message = "Successfully unsubscribed" });
    }
}

public class NewsletterRequestDto
{
    public string Email { get; set; } = string.Empty;
}

public class NewsletterVerifyDto
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
