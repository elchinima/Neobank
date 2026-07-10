using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.CardDebit;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using Stripe;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CardsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICardDebitService _cardDebitService;
    private readonly IEmailService _emailService;

    public CardsController(IApplicationDbContext context, ICardDebitService cardDebitService, IEmailService emailService)
    {
        _context = context;
        _cardDebitService = cardDebitService;
        _emailService = emailService;
        StripeConfiguration.ApiKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetCards()
    {
        var userId = GetUserId();
        var cards = await _context.Cards
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(cards);
    }

    public class CreateCheckoutSessionRequest
    {
        public string CardType { get; set; } = string.Empty;
        public string Network { get; set; } = "Visa";
    }

    [HttpPost("create-checkout-session")]
    public IActionResult CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request)
    {
        long amount = request.CardType switch
        {
            "Premium" => 1900,
            "Elite" => 900,
            _ => 0
        };

        if (amount == 0) return BadRequest(new { message = "Invalid card type or free card." });

        var origin = Request.Headers["Origin"].ToString();
        if (string.IsNullOrEmpty(origin))
        {
            origin = "http://localhost:5173";
        }

        try
        {
            if (string.IsNullOrEmpty(StripeConfiguration.ApiKey))
            {
                return BadRequest(new { message = "Stripe API key is not configured on the server." });
            }

            var options = new Stripe.Checkout.SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<Stripe.Checkout.SessionLineItemOptions>
                {
                    new Stripe.Checkout.SessionLineItemOptions
                    {
                        PriceData = new Stripe.Checkout.SessionLineItemPriceDataOptions
                        {
                            UnitAmount = amount,
                            Currency = "azn",
                            ProductData = new Stripe.Checkout.SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"{request.CardType} Card Subscription",
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                SuccessUrl = $"{origin}/user/cards?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = $"{origin}/user/cards?canceled=true",
                Metadata = new Dictionary<string, string>
                {
                    { "cardType", request.CardType },
                    { "network", request.Network }
                }
            };

            var service = new Stripe.Checkout.SessionService();
            var session = service.Create(options);

            return Ok(new { url = session.Url });
        }
        catch (StripeException e)
        {
            return BadRequest(new { message = e.StripeError.Message });
        }
        catch (Exception e)
        {
            return BadRequest(new { message = "An error occurred while creating checkout session: " + e.Message });
        }
    }

    public class AcquireCardRequest
    {
        public string CardType { get; set; } = "Standard";
        public string Network { get; set; } = "Visa";
        public string PaymentMethod { get; set; } = "free";
        public string? SourceCardId { get; set; }
        public string? SessionId { get; set; }
    }

    [HttpPost("acquire")]
    public async Task<IActionResult> AcquireCard([FromBody] AcquireCardRequest request)
    {
        var userId = GetUserId();

        var existingCard = await _context.Cards
            .FirstOrDefaultAsync(c => c.UserId == userId && c.CardType == request.CardType);

        if (existingCard != null)
        {
            return BadRequest(new { message = $"You already own a {request.CardType} card. Only 1 card per type is allowed." });
        }

        decimal monthlyFee = request.CardType switch
        {
            "Premium" => 19.00m,
            "Elite" => 9.00m,
            _ => 0.00m
        };


        if (monthlyFee > 0)
        {
            if (request.PaymentMethod == "balance")
            {
                if (string.IsNullOrEmpty(request.SourceCardId))
                {
                    return BadRequest(new { message = "Please select a card to pay for the first month's subscription." });
                }

                var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
                {
                    CardId = request.SourceCardId,
                    UserId = userId,
                    Amount = monthlyFee,
                    Category = "CardFee",
                    Description = $"Payment for the 1st month of {request.CardType} card"
                });

                if (!debitResult.Success)
                {
                    return debitResult.HttpStatusCode == 404
                        ? BadRequest(new { message = "Payment card not found." })
                        : BadRequest(new { message = debitResult.ErrorMessage });
                }
            }
            else if (request.PaymentMethod == "stripe")
            {
                if (string.IsNullOrEmpty(request.SessionId))
                {
                    return BadRequest(new { message = "Session ID is required for Stripe payment." });
                }

                var service = new Stripe.Checkout.SessionService();
                var session = service.Get(request.SessionId);

                if (session.PaymentStatus != "paid")
                {
                    return BadRequest(new { message = "Payment not successful." });
                }
            }
        }


        var prefix = request.Network == "Visa" ? "4" : "5";
        var cardNumber = $"{prefix}{Random.Shared.Next(100, 1000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}";
        var cvv = Random.Shared.Next(100, 1000).ToString();
        var expiry = DateTime.UtcNow.AddYears(3).ToString("MM/yy");
        
        var randomIbanDigits = $"{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}";
        var iban = $"AZ12NEOB{randomIbanDigits}";

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var holderName = user != null ? $"{user.FirstName} {user.LastName}".ToUpper() : "CARD HOLDER";


        decimal initialBalance = 0.00m;

        var newCard = new NeoBank.Core.Entities.Card
        {
            UserId = userId,
            CardType = request.CardType,
            Network = request.Network,
            CardNumber = cardNumber,
            Cvv = cvv,
            ExpiryDate = expiry,
            HolderName = holderName,
            Balance = initialBalance,
            MonthlyFee = monthlyFee,
            Status = "Blocked",
            Iban = iban
        };

        _context.Cards.Add(newCard);
        await _context.SaveChangesAsync();

        return Ok(newCard);
    }

    public class ToggleBlockRequest
    {
        public string CardId { get; set; } = string.Empty;
    }

    [HttpPost("toggle-block")]
    public async Task<IActionResult> ToggleBlock([FromBody] ToggleBlockRequest request)
    {
        var userId = GetUserId();
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null)
        {
            return NotFound(new { message = "Card not found." });
        }

        if (!card.HasPin && card.Status == "Blocked")
        {
            return BadRequest(new { message = "Cannot unblock card without a PIN. Please set a PIN first." });
        }

        card.Status = card.Status == "Active" ? "Blocked" : "Active";
        await _context.SaveChangesAsync();

        return Ok(new { cardId = card.Id, status = card.Status });
    }

    public class ToggleCreditLimitRequest
    {
        public string CardId { get; set; } = string.Empty;
    }

    [HttpPost("toggle-credit-limit")]
    public async Task<IActionResult> ToggleCreditLimit([FromBody] ToggleCreditLimitRequest request)
    {
        var userId = GetUserId();
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null)
        {
            return NotFound(new { message = "Card not found." });
        }

        if (card.CreditLimitUpdatedAt.HasValue && (DateTime.UtcNow - card.CreditLimitUpdatedAt.Value).TotalDays < 30)
        {
            return BadRequest(new { message = "creditLimitCooldown" });
        }

        if (card.CreditLimit > 0)
        {
            card.CreditLimit = 0.00m;
        }
        else
        {
            var random = new Random();
            int amount = card.CardType switch
            {
                "Standard" => random.Next(1, 4) * 100,
                "Elite" => random.Next(5, 11) * 100,
                "Premium" => random.Next(10, 16) * 100,
                _ => 0
            };

            if (amount == 0)
            {
                 return BadRequest(new { message = "Credit limit not available for this card type." });
            }
            
            card.CreditLimit = amount;
        }

        card.CreditLimitUpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(card);
    }

    public class ChangePinRequest
    {
        public string CardId { get; set; } = string.Empty;
        public string? OldPin { get; set; }
        public string NewPin { get; set; } = string.Empty;
    }

    [HttpPost("change-pin")]
    public async Task<IActionResult> ChangePin([FromBody] ChangePinRequest request)
    {
        var userId = GetUserId();
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null)
        {
            return NotFound(new { message = "Card not found." });
        }

        if (card.HasPin)
        {
            if (string.IsNullOrEmpty(request.OldPin) || request.OldPin != card.Pin)
            {
                return BadRequest(new { message = "incorrectOldPin" });
            }
        }
        else
        {
            card.Status = "Active";
        }

        card.Pin = request.NewPin;
        await _context.SaveChangesAsync();

        return Ok(card);
    }

    public class StatementRequest
    {
        public string CardId { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }

    [HttpPost("statement")]
    public async Task<IActionResult> RequestStatement([FromBody] StatementRequest request)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null || string.IsNullOrEmpty(user.Email))
        {
            return NotFound(new { message = "User email not found." });
        }

        int periodMonths = int.TryParse(request.Period, out var p) ? p : 3;
        var fromDate = DateTime.UtcNow.AddMonths(-periodMonths);

        var transactionsQuery = _context.Transactions.Where(t => t.UserId == userId && t.CreatedAt >= fromDate);

        if (request.CardId != "all")
        {
            transactionsQuery = transactionsQuery.Where(t => t.CardId == request.CardId || t.RecipientAccount == request.CardId);
        }

        var transactions = await transactionsQuery.OrderByDescending(t => t.CreatedAt).ToListAsync();

        NeoBank.Core.Entities.Card? card = null;
        decimal currentBalance = 0m;

        if (request.CardId != "all")
        {
            card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId);
            currentBalance = card?.Balance ?? 0m;
        }
        else
        {
            currentBalance = await _context.Cards.Where(c => c.UserId == userId).SumAsync(c => c.Balance);
        }

        var totalInc = transactions.Where(t => t.Type == "Income").Sum(t => t.Amount);
        var totalExp = transactions.Where(t => t.Type != "Income").Sum(t => t.Amount);
        var netChange = totalInc - totalExp;
        
        var endBalance = currentBalance;
        var startBalance = endBalance - netChange;

        string title = request.Language switch
        {
            "en" => "Your Account Statement",
            "ru" => "Выписка по вашему счету",
            "az" => "Hesabdan Çıxarış",
            _ => "Your Account Statement"
        };

        string content = request.Language switch
        {
            "en" => $"Dear {user.FirstName},\n\nPlease find attached the statement for the period of {request.Period} months.",
            "ru" => $"Уважаемый(ая) {user.FirstName},\n\nВо вложении находится выписка за период {request.Period} месяцев.",
            "az" => $"Hörmətli {user.FirstName},\n\n{request.Period} aylıq çıxarışınız əlavə olunur.",
            _ => $"Dear {user.FirstName},\n\nPlease find attached the statement for the period of {request.Period} months."
        };

        var fileBytes = NeoBank.Api.Helpers.StatementPdfBuilder.Generate(
            user, 
            card, 
            transactions, 
            request.Language, 
            fromDate, 
            DateTime.UtcNow, 
            startBalance, 
            endBalance);

        await _emailService.SendCustomEmailAsync(
            toEmail: user.Email,
            firstName: user.FirstName,
            emailTitle: title,
            contentTitle: title,
            contentMessage: content,
            attachmentBytes: fileBytes,
            attachmentName: "Statement.pdf"
        );

        return Ok(new { message = "Statement sent to email." });
    }
}
