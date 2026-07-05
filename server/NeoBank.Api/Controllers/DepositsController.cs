using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepositsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DepositsController(IApplicationDbContext context)
    {
        _context = context;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetDeposits()
    {
        var userId = GetUserId();
        var deposits = await _context.Deposits
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return Ok(deposits);
    }

    public class OpenDepositRequest
    {
        public decimal Amount { get; set; }
        public int TermMonths { get; set; }
        public string SourceCardId { get; set; } = string.Empty;
    }

    [HttpPost("open")]
    public async Task<IActionResult> OpenDeposit([FromBody] OpenDepositRequest request)
    {
        var userId = GetUserId();

        if (request.Amount < 100)
        {
            return BadRequest(new { message = "The minimum deposit amount is 100 AZN." });
        }

        var sourceCard = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.SourceCardId && c.UserId == userId);
        if (sourceCard == null)
        {
            return NotFound(new { message = "Source card not found." });
        }

        if (sourceCard.Balance < request.Amount)
        {
            return BadRequest(new { message = "Insufficient funds on the card." });
        }

        decimal rate = 12.0m;
        decimal totalIncome = Math.Round(request.Amount * (rate / 100m) * (request.TermMonths / 12.0m), 2);


        sourceCard.Balance -= request.Amount;

        var deposit = new Deposit
        {
            UserId = userId,
            SourceCardId = sourceCard.Id,
            Amount = request.Amount,
            TermMonths = request.TermMonths,
            InterestRate = rate,
            TotalIncome = totalIncome,
            Status = "Active"
        };

        var transaction = new Transaction
        {
            UserId = userId,
            CardId = sourceCard.Id,
            Amount = request.Amount,
            Type = "Debit",
            Category = "DepositFunding",
            Description = $"Deposit opening ({request.Amount} AZN for {request.TermMonths} months)",
            Status = "Completed"
        };

        _context.Deposits.Add(deposit);
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            deposit,
            newBalance = sourceCard.Balance,
            message = "Deposit successfully opened."
        });
    }
}
