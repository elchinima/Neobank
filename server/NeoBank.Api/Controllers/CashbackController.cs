using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CashbackController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CashbackController(IApplicationDbContext context)
    {
        _context = context;
    }

    private string GetUserId()
    {
        return User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
    }

    [HttpGet]
    public async Task<IActionResult> GetCashbackData()
    {
        var userId = GetUserId();

        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (session == null)
            return NotFound(new { message = "Session not found" });

        // If variant not selected, return preview of both variants
        if (string.IsNullOrEmpty(session.CashbackVariant))
        {
            var allCategories = await _context.CashbackCategories
                .OrderByDescending(c => c.Rate)
                .ToListAsync();

            var variantAPreview = allCategories
                .Where(c => c.Variant == "A")
                .Select(c => new
                {
                    Id = c.Id,
                    TitleEn = c.TitleEn, TitleRu = c.TitleRu, TitleAz = c.TitleAz,
                    TextEn = c.TextEn, TextRu = c.TextRu, TextAz = c.TextAz,
                    Rate = c.Rate, Limit = c.Limit
                }).ToList();

            var variantBPreview = allCategories
                .Where(c => c.Variant == "B")
                .Select(c => new
                {
                    Id = c.Id,
                    TitleEn = c.TitleEn, TitleRu = c.TitleRu, TitleAz = c.TitleAz,
                    TextEn = c.TextEn, TextRu = c.TextRu, TextAz = c.TextAz,
                    Rate = c.Rate, Limit = c.Limit
                }).ToList();

            return Ok(new
            {
                VariantSelected = false,
                CanChange = true,
                VariantACategories = variantAPreview,
                VariantBCategories = variantBPreview
            });
        }

        // Variant is selected — return filtered categories with earned amounts
        var categories = await _context.CashbackCategories
            .Where(c => c.Variant == session.CashbackVariant)
            .OrderByDescending(c => c.Rate)
            .ToListAsync();

        var userCashbacks = await _context.UserCashbacks
            .Where(uc => uc.UserId == userId)
            .ToListAsync();

        var result = categories.Select(c =>
        {
            var userCashback = userCashbacks.FirstOrDefault(uc => uc.CategoryId == c.Id);
            return new
            {
                Id = c.Id,
                TitleEn = c.TitleEn, TitleRu = c.TitleRu, TitleAz = c.TitleAz,
                TextEn = c.TextEn, TextRu = c.TextRu, TextAz = c.TextAz,
                Rate = c.Rate,
                Limit = c.Limit,
                Variant = c.Variant,
                Earned = userCashback?.AmountEarned ?? 0m,
                MccCodes = c.MccCodes
            };
        }).ToList();

        var totalEarned = result.Sum(r => r.Earned);

        return Ok(new
        {
            VariantSelected = true,
            SelectedVariant = session.CashbackVariant,
            CanChange = false,
            TotalEarned = totalEarned,
            Categories = result
        });
    }

    [HttpPost("select-variant")]
    public async Task<IActionResult> SelectVariant([FromBody] SelectVariantRequest request)
    {
        if (request.Variant != "A" && request.Variant != "B")
            return BadRequest(new { message = "Variant must be 'A' or 'B'" });

        var userId = GetUserId();
        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (session == null)
            return NotFound(new { message = "Session not found" });

        // Check if already selected
        if (!string.IsNullOrEmpty(session.CashbackVariant))
        {
            return BadRequest(new
            {
                message = "variantAlreadySelected"
            });
        }

        session.CashbackVariant = request.Variant;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Variant selected successfully", variant = request.Variant });
    }
}

public class SelectVariantRequest
{
    public string Variant { get; set; } = string.Empty;
}
