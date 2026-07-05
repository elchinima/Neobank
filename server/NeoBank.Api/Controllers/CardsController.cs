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
public class CardsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CardsController(IApplicationDbContext context)
    {
        _context = context;
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

    public class AcquireCardRequest
    {
        public string CardType { get; set; } = "Standard";
        public string Network { get; set; } = "Visa";
        public string PaymentMethod { get; set; } = "free";
        public string? SourceCardId { get; set; }
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

                var sourceCard = await _context.Cards
                    .FirstOrDefaultAsync(c => c.Id == request.SourceCardId && c.UserId == userId);

                if (sourceCard == null)
                {
                    return BadRequest(new { message = "Payment card not found." });
                }

                if (sourceCard.Status != "Active")
                {
                    return BadRequest(new { message = "This card is blocked and cannot be used for payment." });
                }

                if (sourceCard.Balance < monthlyFee)
                {
                    return BadRequest(new { message = $"Insufficient funds on the card. {monthlyFee} AZN required." });
                }


                sourceCard.Balance -= monthlyFee;


                var feeTransaction = new Transaction
                {
                    UserId = userId,
                    CardId = sourceCard.Id,
                    Amount = monthlyFee,
                    Type = "Debit",
                    Category = "CardFee",
                    Description = $"Payment for the 1st month of {request.CardType} card",
                    Status = "Completed"
                };
                _context.Transactions.Add(feeTransaction);
            }
            else if (request.PaymentMethod == "stripe")
            {

            }
        }


        var random = new Random();
        var prefix = request.Network == "Visa" ? "4" : "5";
        var cardNumber = $"{prefix}{random.Next(100, 999)} {random.Next(1000, 9999)} {random.Next(1000, 9999)} {random.Next(1000, 9999)}";
        var cvv = random.Next(100, 999).ToString();
        var expiry = DateTime.UtcNow.AddYears(3).ToString("MM/yy");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var holderName = user != null ? $"{user.FirstName} {user.LastName}".ToUpper() : "CARD HOLDER";


        decimal initialBalance = 0.00m;

        var newCard = new Card
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
            Status = "Active"
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

        card.Status = card.Status == "Active" ? "Blocked" : "Active";
        await _context.SaveChangesAsync();

        return Ok(new { cardId = card.Id, status = card.Status });
    }
}
