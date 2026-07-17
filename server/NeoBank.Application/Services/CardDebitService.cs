using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.CardDebit;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Application.Services;

public class CardDebitService : ICardDebitService
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public CardDebitService(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<CardDebitResult> DebitCardAsync(CardDebitRequest request)
    {
        if (request.Amount <= 0)
        {
            return CardDebitResult.Fail("The payment amount must be greater than 0.");
        }

        var card = await _context.Cards
            .FirstOrDefaultAsync(c => c.Id == request.CardId && c.UserId == request.UserId);

        if (card == null)
        {
            return CardDebitResult.Fail("Card not found.", 404);
        }

        if (card.Status != "Active")
        {
            return CardDebitResult.Fail("The card is blocked.");
        }

        if ((card.Balance + card.CreditLimit) < request.Amount)
        {
            return CardDebitResult.Fail("Insufficient funds on the card.");
        }

        var previousBalance = card.Balance;
        card.Balance -= request.Amount;
        var newBalance = card.Balance;

        // Check low balance triggers
        if (previousBalance >= 5 && newBalance < 5 && newBalance >= 0)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
            if (user != null)
            {
                var cardLast4 = card.CardNumber.Length >= 4 ? card.CardNumber.Substring(card.CardNumber.Length - 4) : card.CardNumber;
                await _emailService.SendCustomEmailAsync(
                    user.Email,
                    user.FirstName,
                    "Low Balance Alert",
                    $"Card ending in {cardLast4} has low balance",
                    $"Your card balance has dropped below 5 AZN. Current balance is {newBalance:F2} AZN. Please top up your card to avoid payment failures."
                );
            }
        }
        else if (previousBalance >= 0 && newBalance < 0)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
            if (user != null)
            {
                var cardLast4 = card.CardNumber.Length >= 4 ? card.CardNumber.Substring(card.CardNumber.Length - 4) : card.CardNumber;
                await _emailService.SendCustomEmailAsync(
                    user.Email,
                    user.FirstName,
                    "Low Balance & Credit Line Activated",
                    $"Card ending in {cardLast4} is using credit funds",
                    $"Your card balance has dropped below 0 AZN. Current balance is {newBalance:F2} AZN. You are now using your credit limit."
                );
            }
        }

        var transaction = new Transaction
        {
            UserId = request.UserId,
            CardId = card.Id,
            Amount = request.Amount,
            Type = "Debit",
            Category = request.Category,
            Description = request.Description,
            RecipientAccount = request.RecipientAccount ?? string.Empty,
            Status = "Completed",
            BalanceAfter = card.Balance
        };

        _context.Transactions.Add(transaction);

        return CardDebitResult.Ok(card, transaction);
    }
}
