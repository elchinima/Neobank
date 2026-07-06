using NeoBank.Core.Entities;

namespace NeoBank.Application.DTOs.CardDebit;

public class CardDebitResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? HttpStatusCode { get; set; }
    public decimal NewBalance { get; set; }
    public Card? Card { get; set; }
    public Transaction? Transaction { get; set; }

    public static CardDebitResult Fail(string message, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        HttpStatusCode = statusCode
    };

    public static CardDebitResult Ok(Card card, Transaction transaction) => new()
    {
        Success = true,
        NewBalance = card.Balance,
        Card = card,
        Transaction = transaction
    };
}
