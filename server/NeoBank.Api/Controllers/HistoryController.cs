using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public HistoryController(IApplicationDbContext context)
    {
        _context = context;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        var userId = GetUserId();
        var transactions = await _context.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var cardIds = transactions.Select(t => t.CardId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
        var cards = await _context.Cards
            .Where(c => cardIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id);

        var result = transactions.Select(t =>
        {
            cards.TryGetValue(t.CardId, out var card);
            return new
            {
                t.Id,
                t.UserId,
                t.CardId,
                t.Amount,
                t.Type,
                t.Category,
                t.Description,
                t.RecipientAccount,
                t.Status,
                t.CreatedAt,
                t.BalanceAfter,
                CardType = card?.CardType,
                CardLastFour = card != null && card.CardNumber.Length >= 4
                    ? card.CardNumber[^4..] : (string?)null
            };
        });

        return Ok(result);
    }
}
