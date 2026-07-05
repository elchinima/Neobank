using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using NeoBank.Infrastructure.Services;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IStripeService _stripeService;

    public PaymentsController(IApplicationDbContext context, IStripeService stripeService)
    {
        _context = context;
        _stripeService = stripeService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    public class ProcessPaymentRequest
    {
        public string CardId { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = "Utilities";
        public string RecipientAccount { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    [HttpPost("process")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequest request)
    {
        var userId = GetUserId();

        if (request.Amount <= 0)
        {
            return BadRequest(new { message = "The payment amount must be greater than 0." });
        }

        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null)
        {
            return NotFound(new { message = "Card not found." });
        }

        if (card.Status != "Active")
        {
            return BadRequest(new { message = "The card is blocked." });
        }

        if (card.Balance < request.Amount)
        {
            return BadRequest(new { message = "Insufficient funds on the card." });
        }

        card.Balance -= request.Amount;

        var transaction = new Transaction
        {
            UserId = userId,
            CardId = card.Id,
            Amount = request.Amount,
            Type = "Debit",
            Category = request.CategoryName,
            Description = $"Payment for {request.ProviderName} ({request.RecipientAccount})",
            RecipientAccount = request.RecipientAccount,
            Status = "Completed"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            transactionId = transaction.Id,
            newBalance = card.Balance,
            message = "Payment successfully completed."
        });
    }

    public class StripeIntentRequest
    {
        public decimal Amount { get; set; }
        public string Description { get; set; } = "Payment via Stripe";
    }

    [HttpPost("stripe/intent")]
    public async Task<IActionResult> CreateStripeIntent([FromBody] StripeIntentRequest request)
    {
        var clientSecret = await _stripeService.CreatePaymentIntentAsync(request.Amount, "azn", request.Description);
        if (string.IsNullOrEmpty(clientSecret))
        {
            return BadRequest(new { message = "Failed to initialize Stripe payment." });
        }

        return Ok(new { clientSecret });
    }
}
