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
    [HttpPost("{id}/withdraw")]
    public async Task<IActionResult> WithdrawDeposit(string id, [FromBody] WithdrawDepositRequest request)
    {
        var userId = GetUserId();
        var deposit = await _context.Deposits.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (deposit == null) return NotFound(new { message = "Deposit not found." });
        if (deposit.Status != "Active") return BadRequest(new { message = "Deposit is not active." });

        var targetCard = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.TargetCardId && c.UserId == userId);
        if (targetCard == null) return NotFound(new { message = "Target card not found." });

        var termExpired = deposit.CreatedAt.AddMonths(deposit.TermMonths) <= DateTime.UtcNow;

        decimal amountToReturn;
        if (termExpired)
        {
            amountToReturn = deposit.Amount + deposit.TotalIncome;
        }
        else
        {
            amountToReturn = deposit.Amount * 0.9m; // 10% penalty
        }

        targetCard.Balance += amountToReturn;
        deposit.Status = "Closed";

        var transaction = new Transaction
        {
            UserId = userId,
            CardId = targetCard.Id,
            Amount = amountToReturn,
            Type = "Credit",
            Category = "DepositWithdrawal",
            Description = termExpired ? $"Deposit withdrawal ({deposit.Amount} AZN + Interest)" : $"Early deposit withdrawal ({deposit.Amount} AZN with penalty)",
            Status = "Completed"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            deposit,
            newBalance = targetCard.Balance,
            message = termExpired ? "Deposit successfully withdrawn." : "Deposit successfully withdrawn early."
        });
    }

    public class WithdrawDepositRequest
    {
        public string TargetCardId { get; set; } = string.Empty;
    }
}
