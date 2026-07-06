using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.CardDebit;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepositsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICardDebitService _cardDebitService;

    public DepositsController(IApplicationDbContext context, ICardDebitService cardDebitService)
    {
        _context = context;
        _cardDebitService = cardDebitService;
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

        var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
        {
            CardId = request.SourceCardId,
            UserId = userId,
            Amount = request.Amount,
            Category = "DepositFunding",
            Description = $"Deposit opening ({request.Amount} AZN for {request.TermMonths} months)"
        });

        if (!debitResult.Success)
        {
            return debitResult.HttpStatusCode == 404
                ? NotFound(new { message = "Source card not found." })
                : BadRequest(new { message = debitResult.ErrorMessage });
        }

        decimal rate = 12.0m;
        decimal totalIncome = Math.Round(request.Amount * (rate / 100m) * (request.TermMonths / 12.0m), 2);

        var deposit = new Deposit
        {
            UserId = userId,
            SourceCardId = debitResult.Card!.Id,
            Amount = request.Amount,
            TermMonths = request.TermMonths,
            InterestRate = rate,
            TotalIncome = totalIncome,
            Status = "Active"
        };

        _context.Deposits.Add(deposit);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            deposit,
            newBalance = debitResult.NewBalance,
            message = "Deposit successfully opened."
        });
    }
}
