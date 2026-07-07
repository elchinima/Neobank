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
public class LoansController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICardDebitService _cardDebitService;

    public LoansController(IApplicationDbContext context, ICardDebitService cardDebitService)
    {
        _context = context;
        _cardDebitService = cardDebitService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetLoans()
    {
        var userId = GetUserId();
        var loans = await _context.Loans
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return Ok(loans);
    }

    public class ApplyLoanRequest
    {
        public decimal Amount { get; set; }
        public int TermMonths { get; set; }
        public string TargetCardId { get; set; } = string.Empty;
    }

    [HttpPost("apply")]
    public async Task<IActionResult> ApplyLoan([FromBody] ApplyLoanRequest request)
    {
        var userId = GetUserId();

        if (request.Amount < 500 || request.Amount > 100000)
        {
            return BadRequest(new { message = "The loan amount must be between 500 and 100,000 AZN." });
        }

        if (request.TermMonths < 3 || request.TermMonths > 84)
        {
            return BadRequest(new { message = "The loan term must be between 3 and 84 months." });
        }

        var targetCard = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.TargetCardId && c.UserId == userId);
        if (targetCard == null)
        {
            return NotFound(new { message = "Destination card not found." });
        }

        decimal baseRate = 9.9m;
        decimal rate = Math.Round(baseRate + ((decimal)Math.Ceiling(request.TermMonths / 12.0) - 1) * 2m, 1);
        decimal monthlyRate = (rate / 100) / 12;
        double monthlyPaymentDouble = (double)request.Amount * ((double)monthlyRate * Math.Pow(1 + (double)monthlyRate, request.TermMonths)) / (Math.Pow(1 + (double)monthlyRate, request.TermMonths) - 1);
        decimal monthlyPayment = Math.Round((decimal)monthlyPaymentDouble, 2);


        targetCard.Balance += request.Amount;

        var loan = new Loan
        {
            UserId = userId,
            TargetCardId = targetCard.Id,
            Amount = request.Amount,
            TermMonths = request.TermMonths,
            InterestRate = rate,
            MonthlyPayment = monthlyPayment,
            RemainingBalance = Math.Round(monthlyPayment * request.TermMonths, 2),
            Status = "Active"
        };

        var transaction = new Transaction
        {
            UserId = userId,
            CardId = targetCard.Id,
            Amount = request.Amount,
            Type = "Credit",
            Category = "LoanPayout",
            Description = $"Loan disbursement ({request.Amount} AZN for {request.TermMonths} months)",
            Status = "Completed"
        };

        _context.Loans.Add(loan);
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            loan,
            newBalance = targetCard.Balance,
            message = "Loan successfully processed and funds disbursed to the card."
        });
    }

    public class PayLoanRequest
    {
        public string? SourceCardId { get; set; }
    }

    [HttpPost("{id}/pay")]
    public async Task<IActionResult> PayLoan(string id, [FromBody] PayLoanRequest? request = null)
    {
        var userId = GetUserId();
        var loan = await _context.Loans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (loan == null)
        {
            return NotFound(new { message = "Loan not found." });
        }

        if (loan.Status != "Active")
        {
            return BadRequest(new { message = "This loan is not active." });
        }

        string cardIdToCharge = !string.IsNullOrEmpty(request?.SourceCardId) ? request.SourceCardId : loan.TargetCardId;

        var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
        {
            CardId = cardIdToCharge,
            UserId = userId,
            Amount = loan.MonthlyPayment,
            Category = "LoanPayment",
            Description = $"Monthly payment for loan {loan.Id.Substring(0, 8)}"
        });

        if (!debitResult.Success)
        {
            return debitResult.HttpStatusCode == 404
                ? BadRequest(new { message = "The selected card is not available or blocked." })
                : BadRequest(new { message = debitResult.ErrorMessage });
        }

        loan.RemainingBalance -= loan.MonthlyPayment;
        if (loan.RemainingBalance <= 0)
        {
            loan.RemainingBalance = 0;
            loan.Status = "Paid";
        }
        else
        {
            if (loan.NextPaymentDate.Year < 2000)
            {
                loan.NextPaymentDate = DateTime.UtcNow.AddMonths(1);
            }
            else
            {
                loan.NextPaymentDate = loan.NextPaymentDate.AddMonths(1);
            }
        }
        loan.PaidAmount += loan.MonthlyPayment;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            loan,
            newBalance = debitResult.NewBalance,
            message = "Loan payment successful."
        });
    }
}
