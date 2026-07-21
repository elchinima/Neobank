using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.CardDebit;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using NeoBank.Infrastructure.Services;
using NeoBank.Api.Helpers;
using Stripe;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/user")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICardDebitService _cardDebitService;
    private readonly IEmailService _emailService;
    private readonly IStripeService _stripeService;
    private readonly IAvatarProcessingService _avatarProcessingService;

    public UserController(
        IApplicationDbContext context,
        ICardDebitService cardDebitService,
        IEmailService emailService,
        IStripeService stripeService,
        IAvatarProcessingService avatarProcessingService)
    {
        _context = context;
        _cardDebitService = cardDebitService;
        _emailService = emailService;
        _stripeService = stripeService;
        _avatarProcessingService = avatarProcessingService;
        StripeConfiguration.ApiKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    // ─────────────────────────────────────────────
    // CARDS  (бывший CardsController)
    // ─────────────────────────────────────────────

    [HttpGet("cards")]
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
        public string Network  { get; set; } = "Visa";
    }

    [HttpPost("cards/create-checkout-session")]
    public IActionResult CreateCheckoutSession([FromBody] CreateCheckoutSessionRequest request)
    {
        long amount = request.CardType switch
        {
            "Premium" => 1900,
            "Elite"   => 900,
            _         => 0
        };

        if (amount == 0) return BadRequest(new { message = "Invalid card type or free card." });

        var origin = Request.Headers["Origin"].ToString();
        if (string.IsNullOrEmpty(origin)) origin = "http://localhost:5173";

        try
        {
            if (string.IsNullOrEmpty(StripeConfiguration.ApiKey))
                return BadRequest(new { message = "Stripe API key is not configured on the server." });

            var options = new Stripe.Checkout.SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<Stripe.Checkout.SessionLineItemOptions>
                {
                    new Stripe.Checkout.SessionLineItemOptions
                    {
                        PriceData = new Stripe.Checkout.SessionLineItemPriceDataOptions
                        {
                            UnitAmount  = amount,
                            Currency    = "azn",
                            ProductData = new Stripe.Checkout.SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"{request.CardType} Card Subscription",
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode       = "payment",
                SuccessUrl = $"{origin}/user/cards?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl  = $"{origin}/user/cards?canceled=true",
                Metadata   = new Dictionary<string, string>
                {
                    { "cardType", request.CardType },
                    { "network",  request.Network  }
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
        public string  CardType      { get; set; } = "Standard";
        public string  Network       { get; set; } = "Visa";
        public string  PaymentMethod { get; set; } = "free";
        public string? SourceCardId  { get; set; }
        public string? SessionId     { get; set; }
    }

    [HttpPost("cards/acquire")]
    public async Task<IActionResult> AcquireCard([FromBody] AcquireCardRequest request)
    {
        var userId = GetUserId();

        var existingCard = await _context.Cards
            .FirstOrDefaultAsync(c => c.UserId == userId && c.CardType == request.CardType);

        if (existingCard != null)
            return BadRequest(new { message = $"You already own a {request.CardType} card. Only 1 card per type is allowed." });

        decimal monthlyFee = request.CardType switch
        {
            "Premium" => 19.00m,
            "Elite"   => 9.00m,
            _         => 0.00m
        };

        if (monthlyFee > 0)
        {
            if (request.PaymentMethod == "balance")
            {
                if (string.IsNullOrEmpty(request.SourceCardId))
                    return BadRequest(new { message = "Please select a card to pay for the first month's subscription." });

                var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
                {
                    CardId      = request.SourceCardId,
                    UserId      = userId,
                    Amount      = monthlyFee,
                    Category    = "CardFee",
                    Description = $"Payment for the 1st month of {request.CardType} card"
                });

                if (!debitResult.Success)
                    return debitResult.HttpStatusCode == 404
                        ? BadRequest(new { message = "Payment card not found." })
                        : BadRequest(new { message = debitResult.ErrorMessage });
            }
            else if (request.PaymentMethod == "stripe")
            {
                if (string.IsNullOrEmpty(request.SessionId))
                    return BadRequest(new { message = "Session ID is required for Stripe payment." });

                var service = new Stripe.Checkout.SessionService();
                var session = service.Get(request.SessionId);

                if (session.PaymentStatus != "paid")
                    return BadRequest(new { message = "Payment not successful." });
            }
        }

        var prefix       = request.Network == "Visa" ? "4" : "5";
        var cardNumber   = $"{prefix}{Random.Shared.Next(100, 1000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}";
        var cvv          = Random.Shared.Next(100, 1000).ToString();
        var expiry       = DateTime.UtcNow.AddYears(3).ToString("MM/yy");
        var randomDigits = $"{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}{Random.Shared.Next(1000, 10000)}";
        var iban         = $"AZ12NEOB{randomDigits}";

        var user       = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var holderName = user != null ? $"{user.FirstName} {user.LastName}".ToUpper() : "CARD HOLDER";

        var newCard = new NeoBank.Core.Entities.Card
        {
            UserId    = userId,
            CardType  = request.CardType,
            Network   = request.Network,
            CardNumber= cardNumber,
            Cvv       = cvv,
            ExpiryDate= expiry,
            HolderName= holderName,
            Balance   = 0.00m,
            MonthlyFee= monthlyFee,
            Status    = "Blocked",
            Iban      = iban
        };

        _context.Cards.Add(newCard);
        await _context.SaveChangesAsync();

        return Ok(newCard);
    }

    public class ToggleBlockRequest
    {
        public string CardId { get; set; } = string.Empty;
    }

    [HttpPost("cards/toggle-block")]
    public async Task<IActionResult> ToggleBlock([FromBody] ToggleBlockRequest request)
    {
        var userId = GetUserId();
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null) return NotFound(new { message = "Card not found." });

        if (!card.HasPin && card.Status == "Blocked")
            return BadRequest(new { message = "Cannot unblock card without a PIN. Please set a PIN first." });

        card.Status = card.Status == "Active" ? "Blocked" : "Active";
        await _context.SaveChangesAsync();

        return Ok(new { cardId = card.Id, status = card.Status });
    }

    public class ToggleCreditLimitRequest
    {
        public string CardId { get; set; } = string.Empty;
    }

    [HttpPost("cards/toggle-credit-limit")]
    public async Task<IActionResult> ToggleCreditLimit([FromBody] ToggleCreditLimitRequest request)
    {
        var userId = GetUserId();
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null) return NotFound(new { message = "Card not found." });

        if (card.CreditLimitUpdatedAt.HasValue && (DateTime.UtcNow - card.CreditLimitUpdatedAt.Value).TotalDays < 30)
            return BadRequest(new { message = "creditLimitCooldown" });

        if (card.CreditLimit > 0)
        {
            card.CreditLimit = 0.00m;
        }
        else
        {
            var random = new Random();
            int amount = card.CardType switch
            {
                "Standard" => random.Next(1, 4)   * 100,
                "Elite"    => random.Next(5, 11)  * 100,
                "Premium"  => random.Next(10, 16) * 100,
                _          => 0
            };

            if (amount == 0) return BadRequest(new { message = "Credit limit not available for this card type." });

            card.CreditLimit = amount;
        }

        card.CreditLimitUpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(card);
    }

    public class ChangePinRequest
    {
        public string  CardId { get; set; } = string.Empty;
        public string? OldPin { get; set; }
        public string  NewPin { get; set; } = string.Empty;
    }

    [HttpPost("cards/change-pin")]
    public async Task<IActionResult> ChangePin([FromBody] ChangePinRequest request)
    {
        var userId = GetUserId();
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == userId);

        if (card == null) return NotFound(new { message = "Card not found." });

        if (card.HasPin)
        {
            if (string.IsNullOrEmpty(request.OldPin) || request.OldPin != card.Pin)
                return BadRequest(new { message = "incorrectOldPin" });
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
        public string CardId   { get; set; } = string.Empty;
        public string Period   { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }

    [HttpPost("cards/statement")]
    public async Task<IActionResult> RequestStatement([FromBody] StatementRequest request)
    {
        var userId = GetUserId();
        var user   = await _context.Users.FindAsync(userId);

        if (user == null || string.IsNullOrEmpty(user.Email))
            return NotFound(new { message = "User email not found." });

        int periodMonths = int.TryParse(request.Period, out var p) ? p : 3;
        var fromDate     = DateTime.UtcNow.AddMonths(-periodMonths);

        var transactionsQuery = _context.Transactions.Where(t => t.UserId == userId && t.CreatedAt >= fromDate);

        if (request.CardId != "all")
            transactionsQuery = transactionsQuery.Where(t => t.CardId == request.CardId || t.RecipientAccount == request.CardId);

        var transactions = await transactionsQuery.OrderByDescending(t => t.CreatedAt).ToListAsync();

        NeoBank.Core.Entities.Card? card = null;
        decimal currentBalance    = 0m;
        decimal totalCreditLimit  = 0m;
        decimal totalDebt         = 0m;

        if (request.CardId != "all")
        {
            card              = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.CardId);
            currentBalance    = card?.Balance ?? 0m;
            totalCreditLimit  = card?.CreditLimit ?? 0m;
            totalDebt         = card != null && card.Balance < 0 ? Math.Abs(card.Balance) : 0m;
        }
        else
        {
            var allCards     = await _context.Cards.Where(c => c.UserId == userId).ToListAsync();
            currentBalance   = allCards.Sum(c => c.Balance);
            totalCreditLimit = allCards.Sum(c => c.CreditLimit);
            totalDebt        = allCards.Where(c => c.Balance < 0).Sum(c => Math.Abs(c.Balance));
        }

        var totalInc   = transactions.Where(t => t.Type == "Income").Sum(t => t.Amount);
        var totalExp   = transactions.Where(t => t.Type != "Income").Sum(t => t.Amount);
        var netChange  = totalInc - totalExp;
        var endBalance = currentBalance;
        var startBalance = endBalance - netChange;

        string title = request.Language switch
        {
            "en" => "Your Account Statement",
            "ru" => "Выписка по вашему счету",
            "az" => "Hesabdan Çıxarış",
            _    => "Your Account Statement"
        };

        string content = request.Language switch
        {
            "en" => $"Dear {user.FirstName},\n\nPlease find attached the statement for the period of {request.Period} months.",
            "ru" => $"Уважаемый(ая) {user.FirstName},\n\nВо вложении находится выписка за период {request.Period} месяцев.",
            "az" => $"Hörmətli {user.FirstName},\n\n{request.Period} aylıq çıxarışınız əlavə olunur.",
            _    => $"Dear {user.FirstName},\n\nPlease find attached the statement for the period of {request.Period} months."
        };

        var contacts = await _context.FooterSettings.Where(f => f.Category == "Contact").ToListAsync();
        var address  = contacts.FirstOrDefault(c => c.Key.Equals("address", StringComparison.OrdinalIgnoreCase))?.Value ?? "Baku, Azerbaijan";
        var phone    = contacts.FirstOrDefault(c => c.Key.Equals("phone",   StringComparison.OrdinalIgnoreCase))?.Value ?? "+994 12 555 45 45";

        var fileBytes = NeoBank.Api.Helpers.StatementPdfBuilder.Generate(
            user, card, transactions, request.Language,
            fromDate, DateTime.UtcNow,
            startBalance, endBalance, address, phone, totalCreditLimit, totalDebt);

        await _emailService.SendCustomEmailAsync(
            toEmail:        user.Email,
            firstName:      user.FirstName,
            emailTitle:     title,
            contentTitle:   title,
            contentMessage: content,
            attachmentBytes:fileBytes,
            attachmentName: "Statement.pdf");

        return Ok(new { message = "Statement sent to email." });
    }

    // ─────────────────────────────────────────────
    // CASHBACK  (бывший CashbackController)
    // ─────────────────────────────────────────────

    [HttpGet("cashback")]
    public async Task<IActionResult> GetCashbackData()
    {
        var userId  = GetUserId();
        var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.UserId == userId);

        if (session == null) return NotFound(new { message = "Session not found" });

        if (string.IsNullOrEmpty(session.CashbackVariant))
        {
            var allCategories = await _context.CashbackCategories.OrderByDescending(c => c.Rate).ToListAsync();

            var variantAPreview = allCategories.Where(c => c.Variant == "A")
                .Select(c => new { c.Id, c.TitleEn, c.TitleRu, c.TitleAz, c.TextEn, c.TextRu, c.TextAz, c.Rate, c.Limit }).ToList();

            var variantBPreview = allCategories.Where(c => c.Variant == "B")
                .Select(c => new { c.Id, c.TitleEn, c.TitleRu, c.TitleAz, c.TextEn, c.TextRu, c.TextAz, c.Rate, c.Limit }).ToList();

            return Ok(new { VariantSelected = false, CanChange = true, VariantACategories = variantAPreview, VariantBCategories = variantBPreview });
        }

        var categories    = await _context.CashbackCategories.Where(c => c.Variant == session.CashbackVariant).OrderByDescending(c => c.Rate).ToListAsync();
        var userCashbacks = await _context.UserCashbacks.Where(uc => uc.UserId == userId).ToListAsync();

        var result = categories.Select(c =>
        {
            var uc = userCashbacks.FirstOrDefault(x => x.CategoryId == c.Id);
            return new { c.Id, c.TitleEn, c.TitleRu, c.TitleAz, c.TextEn, c.TextRu, c.TextAz, c.Rate, c.Limit, c.Variant, Earned = uc?.AmountEarned ?? 0m, c.MccCodes };
        }).ToList();

        return Ok(new { VariantSelected = true, SelectedVariant = session.CashbackVariant, CanChange = false, TotalEarned = result.Sum(r => r.Earned), Categories = result });
    }

    public class SelectVariantRequest
    {
        public string Variant { get; set; } = string.Empty;
    }

    [HttpPost("cashback/select-variant")]
    public async Task<IActionResult> SelectVariant([FromBody] SelectVariantRequest request)
    {
        if (request.Variant != "A" && request.Variant != "B")
            return BadRequest(new { message = "Variant must be 'A' or 'B'" });

        var userId  = GetUserId();
        var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.UserId == userId);

        if (session == null) return NotFound(new { message = "Session not found" });

        if (!string.IsNullOrEmpty(session.CashbackVariant))
            return BadRequest(new { message = "variantAlreadySelected" });

        session.CashbackVariant = request.Variant;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Variant selected successfully", variant = request.Variant });
    }

    // ─────────────────────────────────────────────
    // DASHBOARD  (бывший DashboardController)
    // ─────────────────────────────────────────────

    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string period = "7d")
    {
        var userId = GetUserId();
        var cards  = await _context.Cards.Where(c => c.UserId == userId).ToListAsync();

        decimal totalBalance = cards.Sum(c => c.Balance);

        var startDate = period switch
        {
            "24h"   => DateTime.UtcNow.AddHours(-24),
            "month" => DateTime.UtcNow.AddDays(-30),
            _       => DateTime.UtcNow.AddDays(-7)
        };

        var transactions    = await _context.Transactions.Where(t => t.UserId == userId && t.CreatedAt >= startDate).ToListAsync();
        decimal totalIncome  = transactions.Where(t => t.Type == "Credit").Sum(t => t.Amount);
        decimal totalExpenses= transactions.Where(t => t.Type == "Debit").Sum(t => t.Amount);

        decimal cashbackEarned = Math.Round(await _context.UserCashbacks.Where(u => u.UserId == userId).SumAsync(u => u.AmountEarned), 2);

        var categories = transactions.Where(t => t.Type == "Debit")
            .GroupBy(t => t.Category)
            .Select(g => new { name = g.Key, value = g.Sum(t => t.Amount) })
            .ToList();

        return Ok(new { totalBalance, totalIncome, totalExpenses, bonuses = new { cashback = cashbackEarned, vat = 0m, total = cashbackEarned }, categories });
    }

    // ─────────────────────────────────────────────
    // DEPOSITS  (бывший DepositsController)
    // ─────────────────────────────────────────────

    [HttpGet("deposits")]
    public async Task<IActionResult> GetDeposits()
    {
        var userId   = GetUserId();
        var deposits = await _context.Deposits.Where(d => d.UserId == userId).OrderByDescending(d => d.CreatedAt).ToListAsync();
        return Ok(deposits);
    }

    public class OpenDepositRequest
    {
        public decimal Amount       { get; set; }
        public int     TermMonths   { get; set; }
        public string  SourceCardId { get; set; } = string.Empty;
    }

    [HttpPost("deposits/open")]
    public async Task<IActionResult> OpenDeposit([FromBody] OpenDepositRequest request)
    {
        var userId = GetUserId();

        if (request.Amount < 100) return BadRequest(new { message = "The minimum deposit amount is 100 AZN." });

        var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
        {
            CardId      = request.SourceCardId,
            UserId      = userId,
            Amount      = request.Amount,
            Category    = "DepositFunding",
            Description = $"Deposit opening ({request.Amount} AZN for {request.TermMonths} months)"
        });

        if (!debitResult.Success)
            return debitResult.HttpStatusCode == 404
                ? NotFound(new { message = "Source card not found." })
                : BadRequest(new { message = debitResult.ErrorMessage });

        decimal rate        = 12.0m;
        decimal totalIncome = Math.Round(request.Amount * (rate / 100m) * (request.TermMonths / 12.0m), 2);

        var deposit = new Deposit
        {
            UserId       = userId,
            SourceCardId = debitResult.Card!.Id,
            Amount       = request.Amount,
            TermMonths   = request.TermMonths,
            InterestRate = rate,
            TotalIncome  = totalIncome,
            Status       = "Active"
        };

        _context.Deposits.Add(deposit);
        await _context.SaveChangesAsync();

        return Ok(new { deposit, newBalance = debitResult.NewBalance, message = "Deposit successfully opened." });
    }

    public class WithdrawDepositRequest
    {
        public string TargetCardId { get; set; } = string.Empty;
    }

    [HttpPost("deposits/{id}/withdraw")]
    public async Task<IActionResult> WithdrawDeposit(string id, [FromBody] WithdrawDepositRequest request)
    {
        var userId  = GetUserId();
        var deposit = await _context.Deposits.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);

        if (deposit == null)          return NotFound(new { message = "Deposit not found." });
        if (deposit.Status != "Active") return BadRequest(new { message = "Deposit is not active." });

        var targetCard = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.TargetCardId && c.UserId == userId);
        if (targetCard == null) return NotFound(new { message = "Target card not found." });

        var termExpired     = deposit.CreatedAt.AddMonths(deposit.TermMonths) <= DateTime.UtcNow;
        decimal amountToReturn = termExpired ? deposit.Amount + deposit.TotalIncome : deposit.Amount * 0.9m;

        targetCard.Balance += amountToReturn;
        deposit.Status      = "Closed";

        _context.Transactions.Add(new Transaction
        {
            UserId      = userId,
            CardId      = targetCard.Id,
            Amount      = amountToReturn,
            Type        = "Credit",
            Category    = "DepositWithdrawal",
            Description = termExpired ? $"Deposit withdrawal ({deposit.Amount} AZN + Interest)" : $"Early deposit withdrawal ({deposit.Amount} AZN with penalty)",
            Status      = "Completed",
            BalanceAfter= targetCard.Balance
        });

        await _context.SaveChangesAsync();

        return Ok(new { deposit, newBalance = targetCard.Balance, message = termExpired ? "Deposit successfully withdrawn." : "Deposit successfully withdrawn early." });
    }

    // ─────────────────────────────────────────────
    // DOCUMENTS  (бывший DocumentsController)
    // ─────────────────────────────────────────────

    public class OrderReferenceRequest
    {
        public string Type          { get; set; } = string.Empty;
        public string Language      { get; set; } = "en";
        public string PaymentCardId { get; set; } = string.Empty;
    }

    [HttpPost("documents/references")]
    public async Task<IActionResult> OrderReference([FromBody] OrderReferenceRequest req)
    {
        var userId = GetUserId();
        var user   = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var paymentCard = await _context.Cards.FirstOrDefaultAsync(c => c.Id == req.PaymentCardId && c.UserId == userId);
        if (paymentCard == null) return BadRequest("Payment card not found.");

        decimal fee = 10.00m;
        if (paymentCard.Balance < fee) return BadRequest($"Insufficient funds for the certificate fee ({fee} AZN).");

        paymentCard.Balance -= fee;

        _context.Transactions.Add(new Transaction
        {
            UserId      = userId,
            Amount      = fee,
            Type        = "Debit",
            Category    = "Banking Services",
            Description = "Fee for Certificate/Reference",
            CreatedAt   = DateTime.UtcNow,
            CardId      = paymentCard.Id,
            BalanceAfter= paymentCard.Balance
        });

        List<NeoBank.Core.Entities.Card>? creditLines = null;
        List<Loan>?    loans    = null;
        List<Deposit>? deposits = null;

        if      (req.Type == "CreditLine") creditLines = await _context.Cards.Where(c => c.UserId == userId && c.CreditLimit > 0 && c.Status == "Active").ToListAsync();
        else if (req.Type == "Debt")       loans       = await _context.Loans.Where(l => l.UserId == userId).ToListAsync();
        else if (req.Type == "Deposits")   deposits    = await _context.Deposits.Where(d => d.UserId == userId).ToListAsync();
        else return BadRequest("Invalid reference type.");

        var footerSettings = await _context.FooterSettings.ToListAsync();
        var address = footerSettings.FirstOrDefault(f => f.Category == "Contact" && f.Key == "Address")?.Value ?? "Baku, Azerbaijan";
        var phone   = footerSettings.FirstOrDefault(f => f.Category == "Contact" && f.Key == "Phone")?.Value   ?? "+994 12 555 45 45";

        var pdfBytes = ReferencePdfBuilder.Generate(user, req.Type, req.Language, address, phone, creditLines, loans, deposits);

        await _context.SaveChangesAsync();

        var subject = req.Language switch { "az" => "Bank arayışı", "ru" => "Банковская справка", _ => "Bank Certificate" };
        var body    = req.Language switch
        {
            "az" => $"Hörmətli {user.FirstName},<br><br>Sifariş etdiyiniz arayış əlavədə təqdim olunur.",
            "ru" => $"Уважаемый(ая) {user.FirstName},<br><br>Заказанная вами справка находится во вложении.",
            _    => $"Dear {user.FirstName},<br><br>The certificate you ordered is attached."
        };
        var fileName = req.Type switch { "CreditLine" => "Credit_Line_Certificate.pdf", "Debt" => "Debt_Certificate.pdf", "Deposits" => "Deposits_Certificate.pdf", _ => "Certificate.pdf" };

        await _emailService.SendCustomEmailAsync(user.Email ?? "", user.FirstName ?? "", subject, subject, body, pdfBytes, fileName);

        return Ok(new { message = "Certificate ordered successfully and sent to email." });
    }

    // ─────────────────────────────────────────────
    // HISTORY  (бывший HistoryController)
    // ─────────────────────────────────────────────

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId       = GetUserId();
        var transactions = await _context.Transactions.Where(t => t.UserId == userId).OrderByDescending(t => t.CreatedAt).ToListAsync();

        var cardIds = transactions.Select(t => t.CardId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
        var cards   = await _context.Cards.Where(c => cardIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id);

        var result = transactions.Select(t =>
        {
            cards.TryGetValue(t.CardId, out var card);
            return new
            {
                t.Id, t.UserId, t.CardId, t.Amount, t.Type, t.Category,
                t.Description, t.RecipientAccount, t.Status, t.CreatedAt, t.BalanceAfter,
                CardType     = card?.CardType,
                CardLastFour = card != null && card.CardNumber.Length >= 4 ? card.CardNumber[^4..] : (string?)null
            };
        });

        return Ok(result);
    }

    // ─────────────────────────────────────────────
    // LOANS  (бывший LoansController)
    // ─────────────────────────────────────────────

    [HttpGet("loans")]
    public async Task<IActionResult> GetLoans()
    {
        var userId = GetUserId();
        var loans  = await _context.Loans.Where(l => l.UserId == userId).OrderByDescending(l => l.CreatedAt).ToListAsync();
        return Ok(loans);
    }

    public class ApplyLoanRequest
    {
        public decimal Amount       { get; set; }
        public int     TermMonths   { get; set; }
        public string  TargetCardId { get; set; } = string.Empty;
    }

    [HttpPost("loans/apply")]
    public async Task<IActionResult> ApplyLoan([FromBody] ApplyLoanRequest request)
    {
        var userId = GetUserId();

        if (request.Amount < 500 || request.Amount > 100000)
            return BadRequest(new { message = "The loan amount must be between 500 and 100,000 AZN." });

        if (request.TermMonths < 3 || request.TermMonths > 84)
            return BadRequest(new { message = "The loan term must be between 3 and 84 months." });

        var targetCard = await _context.Cards.FirstOrDefaultAsync(c => c.Id == request.TargetCardId && c.UserId == userId);
        if (targetCard == null) return NotFound(new { message = "Destination card not found." });

        decimal baseRate      = 9.9m;
        decimal rate          = Math.Round(baseRate + ((decimal)Math.Ceiling(request.TermMonths / 12.0) - 1) * 2m, 1);
        decimal years         = (decimal)request.TermMonths / 12m;
        decimal totalInterest = request.Amount * (rate / 100m) * years;
        decimal totalAmount   = request.Amount + totalInterest;
        decimal monthlyPayment= Math.Round(totalAmount / request.TermMonths, 2);

        var loan = new Loan
        {
            UserId         = userId,
            TargetCardId   = targetCard.Id,
            Amount         = request.Amount,
            TermMonths     = request.TermMonths,
            InterestRate   = rate,
            MonthlyPayment = monthlyPayment,
            RemainingBalance = Math.Round(monthlyPayment * request.TermMonths, 2),
            Status         = "Pending"
        };

        loan.StatusHistory.Add(new LoanStatusHistory { Status = "Pending", ChangedBy = "User", Time = DateTime.UtcNow.ToString("o") });

        _context.Loans.Add(loan);
        await _context.SaveChangesAsync();

        return Ok(new { loan, newBalance = targetCard.Balance, message = "Your loan application has been submitted and is pending administrator approval." });
    }

    public class PayLoanRequest
    {
        public string? SourceCardId { get; set; }
    }

    [HttpPost("loans/{id}/pay")]
    public async Task<IActionResult> PayLoan(string id, [FromBody] PayLoanRequest? request = null)
    {
        var userId = GetUserId();
        var loan   = await _context.Loans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (loan == null)            return NotFound(new { message = "Loan not found." });
        if (loan.Status != "Active") return BadRequest(new { message = "This loan is not active." });

        string cardIdToCharge = !string.IsNullOrEmpty(request?.SourceCardId) ? request.SourceCardId : loan.TargetCardId;

        var debitResult = await _cardDebitService.DebitCardAsync(new CardDebitRequest
        {
            CardId      = cardIdToCharge,
            UserId      = userId,
            Amount      = loan.MonthlyPayment,
            Category    = "LoanPayment",
            Description = $"Monthly payment for loan {loan.Id.Substring(0, 8)}"
        });

        if (!debitResult.Success)
            return debitResult.HttpStatusCode == 404
                ? BadRequest(new { message = "The selected card is not available or blocked." })
                : BadRequest(new { message = debitResult.ErrorMessage });

        loan.RemainingBalance -= loan.MonthlyPayment;
        if (loan.RemainingBalance <= 0)
        {
            loan.RemainingBalance = 0;
            loan.Status = "Paid";
        }
        else
        {
            loan.NextPaymentDate = loan.NextPaymentDate.Year < 2000 ? DateTime.UtcNow.AddMonths(1) : loan.NextPaymentDate.AddMonths(1);
        }

        loan.PaidAmount += loan.MonthlyPayment;
        await _context.SaveChangesAsync();

        return Ok(new { loan, newBalance = debitResult.NewBalance, message = "Loan payment successful." });
    }

    // ─────────────────────────────────────────────
    // PAYMENTS  (бывший PaymentsController)
    // ─────────────────────────────────────────────

    public class ProcessPaymentRequest
    {
        public string  CardId           { get; set; } = string.Empty;
        public string  ProviderName     { get; set; } = string.Empty;
        public string  CategoryName     { get; set; } = "Utilities";
        public string  RecipientAccount { get; set; } = string.Empty;
        public decimal Amount           { get; set; }
    }

    [HttpPost("payments/process")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequest request)
    {
        try
        {
            var userId     = GetUserId();
            var debitResult= await _cardDebitService.DebitCardAsync(new CardDebitRequest
            {
                CardId           = request.CardId,
                UserId           = userId,
                Amount           = request.Amount,
                Category         = request.CategoryName,
                Description      = $"Payment for {request.ProviderName} ({request.RecipientAccount})",
                RecipientAccount = request.RecipientAccount
            });

            if (!debitResult.Success)
                return debitResult.HttpStatusCode == 404
                    ? NotFound(new { message = debitResult.ErrorMessage })
                    : BadRequest(new { message = debitResult.ErrorMessage });

            if (request.CategoryName == "Transfer" &&
                (request.ProviderName == "Internal Transfer" || request.ProviderName == "NeoBank Transfer" || request.ProviderName == "IBAN Transfer"))
            {
                NeoBank.Core.Entities.Card? destCard = null;
                if (request.ProviderName == "IBAN Transfer")
                {
                    request.RecipientAccount = request.RecipientAccount.Replace(" ", "").ToUpper();
                    if (!System.Text.RegularExpressions.Regex.IsMatch(request.RecipientAccount, @"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$"))
                        return BadRequest(new { message = "Invalid IBAN format." });

                    destCard = await _context.Cards.FirstOrDefaultAsync(c => c.Iban == request.RecipientAccount);
                }
                else
                {
                    destCard = await _context.Cards.FirstOrDefaultAsync(c => c.CardNumber == request.RecipientAccount);
                }

                if (destCard != null)
                {
                    destCard.Balance += request.Amount;
                    _context.Transactions.Add(new Transaction
                    {
                        UserId           = destCard.UserId,
                        CardId           = destCard.Id,
                        Amount           = request.Amount,
                        Type             = "Credit",
                        Category         = "Transfer",
                        Description      = request.ProviderName == "IBAN Transfer"
                            ? $"Transfer via IBAN from {debitResult.Card!.Iban}"
                            : $"Transfer from {debitResult.Card!.CardNumber}",
                        RecipientAccount = request.ProviderName == "IBAN Transfer" ? debitResult.Card!.Iban : debitResult.Card!.CardNumber,
                        Status           = "Completed",
                        BalanceAfter     = destCard.Balance
                    });
                }
                else if (request.ProviderName != "IBAN Transfer")
                {
                    return BadRequest(new { message = "Recipient card not found." });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, transactionId = debitResult.Transaction!.Id, newBalance = debitResult.NewBalance, message = "Payment successfully completed." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Payment processing error.", details = ex.Message });
        }
    }

    public class StripeIntentRequest
    {
        public decimal Amount      { get; set; }
        public string  Description { get; set; } = "Payment via Stripe";
    }

    [HttpPost("payments/stripe/intent")]
    public async Task<IActionResult> CreateStripeIntent([FromBody] StripeIntentRequest request)
    {
        var clientSecret = await _stripeService.CreatePaymentIntentAsync(request.Amount, "azn", request.Description);
        if (string.IsNullOrEmpty(clientSecret))
            return BadRequest(new { message = "Failed to initialize Stripe payment." });

        return Ok(new { clientSecret });
    }

    // ─────────────────────────────────────────────
    // PROFILE / AVATAR  (бывший UsersController)
    // ─────────────────────────────────────────────

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        var userId = GetUserId();
        try
        {
            var avatarUrl = await _avatarProcessingService.ProcessAndUploadAvatarAsync(userId, file);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.AvatarUrl = avatarUrl;
                await _context.SaveChangesAsync();
            }

            return Ok(new { avatarUrl, message = "Avatar successfully uploaded and processed (512x512, WebP, 50% compression)." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error processing image: " + ex.Message });
        }
    }
}
