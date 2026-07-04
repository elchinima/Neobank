using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DashboardController(IApplicationDbContext context)
    {
        _context = context;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string period = "7d")
    {
        var userId = GetUserId();

        var cards = await _context.Cards.Where(c => c.UserId == userId).ToListAsync();
        decimal totalBalance = cards.Sum(c => c.Balance);

        var startDate = period switch
        {
            "24h" => DateTime.UtcNow.AddHours(-24),
            "month" => DateTime.UtcNow.AddDays(-30),
            _ => DateTime.UtcNow.AddDays(-7)
        };

        var transactions = await _context.Transactions
            .Where(t => t.UserId == userId && t.CreatedAt >= startDate)
            .ToListAsync();

        decimal totalIncome = transactions.Where(t => t.Type == "Credit").Sum(t => t.Amount);
        decimal totalExpenses = transactions.Where(t => t.Type == "Debit").Sum(t => t.Amount);


        decimal cashbackEarned = Math.Round(totalExpenses * 0.01m, 2);
        decimal vatRefundEarned = Math.Round(totalExpenses * 0.005m, 2);

        var categories = transactions
            .Where(t => t.Type == "Debit")
            .GroupBy(t => t.Category)
            .Select(g => new
            {
                name = g.Key,
                value = g.Sum(t => t.Amount)
            })
            .ToList();

        return Ok(new
        {
            totalBalance,
            totalIncome,
            totalExpenses,
            bonuses = new
            {
                cashback = cashbackEarned,
                vat = vatRefundEarned,
                total = cashbackEarned + vatRefundEarned
            },
            categories
        });
    }
}
