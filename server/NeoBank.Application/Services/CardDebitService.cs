using Microsoft.EntityFrameworkCore;
using NeoBank.Application.DTOs.CardDebit;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Application.Services;

public class CardDebitService : ICardDebitService
{
    private readonly IApplicationDbContext _context;

    public CardDebitService(IApplicationDbContext context)
    {
        _context = context;
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

        card.Balance -= request.Amount;

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
