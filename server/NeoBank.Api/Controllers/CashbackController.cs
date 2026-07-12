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
        return User.Claims.FirstOrDefault(c => c.Type == "id")?.Value ?? string.Empty;
    }

    [HttpGet]
    public async Task<IActionResult> GetCashbackData()
    {
        var userId = GetUserId();
        var categories = await _context.CashbackCategories
            .OrderByDescending(c => c.Rate)
            .ToListAsync();

        var userCashbacks = await _context.UserCashbacks
            .Where(uc => uc.UserId == userId)
            .ToListAsync();

        var result = categories.Select(c => {
            var userCashback = userCashbacks.FirstOrDefault(uc => uc.CategoryId == c.Id);
            return new
            {
                Id = c.Id,
                TitleEn = c.TitleEn,
                TitleRu = c.TitleRu,
                TitleAz = c.TitleAz,
                TextEn = c.TextEn,
                TextRu = c.TextRu,
                TextAz = c.TextAz,
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
            TotalEarned = totalEarned,
            Categories = result
        });
    }
}
