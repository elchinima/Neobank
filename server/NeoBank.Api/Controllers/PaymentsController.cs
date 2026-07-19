using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.CardDebit;
using NeoBank.Application.Interfaces;
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
    private readonly ICardDebitService _cardDebitService;

    public PaymentsController(IApplicationDbContext context, IStripeService stripeService, ICardDebitService cardDebitService)
    {
        _context = context;
        _stripeService = stripeService;
        _cardDebitService = cardDebitService;
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
        try
        {
            var userId = GetUserId();

            var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
            {
                CardId = request.CardId,
                UserId = userId,
                Amount = request.Amount,
                Category = request.CategoryName,
                Description = $"Payment for {request.ProviderName} ({request.RecipientAccount})",
                RecipientAccount = request.RecipientAccount
            });

            if (!debitResult.Success)
            {
                return debitResult.HttpStatusCode == 404
                    ? NotFound(new { message = debitResult.ErrorMessage })
                    : BadRequest(new { message = debitResult.ErrorMessage });
            }

            if (request.CategoryName == "Transfer" && (request.ProviderName == "Internal Transfer" || request.ProviderName == "NeoBank Transfer" || request.ProviderName == "IBAN Transfer"))
            {
                Card? destCard = null;
                if (request.ProviderName == "IBAN Transfer")
                {
                    request.RecipientAccount = request.RecipientAccount.Replace(" ", "").ToUpper();
                    if (!System.Text.RegularExpressions.Regex.IsMatch(request.RecipientAccount, @"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$"))
                    {
                        return BadRequest(new { message = "Invalid IBAN format." });
                    }
                    destCard = await _context.Cards.FirstOrDefaultAsync(c => c.Iban == request.RecipientAccount);
                }
                else
                {
                    destCard = await _context.Cards.FirstOrDefaultAsync(c => c.CardNumber == request.RecipientAccount);
                }

                if (destCard != null)
                {
                    destCard.Balance += request.Amount;
                    var creditTransaction = new Transaction
                    {
                        UserId = destCard.UserId,
                        CardId = destCard.Id,
                        Amount = request.Amount,
                        Type = "Credit",
                        Category = "Transfer",
                        Description = request.ProviderName == "IBAN Transfer" ? $"Transfer via IBAN from {debitResult.Card!.Iban}" : $"Transfer from {debitResult.Card!.CardNumber}",
                        RecipientAccount = request.ProviderName == "IBAN Transfer" ? debitResult.Card!.Iban : debitResult.Card!.CardNumber,
                        Status = "Completed",
                        BalanceAfter = destCard.Balance
                    };
                    _context.Transactions.Add(creditTransaction);
                }
                else if (request.ProviderName != "IBAN Transfer")
                {
                    return BadRequest(new { message = "Recipient card not found." });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                transactionId = debitResult.Transaction!.Id,
                newBalance = debitResult.NewBalance,
                message = "Payment successfully completed."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Payment processing error.", details = ex.Message });
        }
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
