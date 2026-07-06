using NeoBank.Application.DTOs.CardDebit;

namespace NeoBank.Application.Interfaces;

public interface ICardDebitService
{
    /// <summary>
    /// Единая точка списания средств с карты.
    /// Выполняет все проверки: существование карты, принадлежность пользователю,
    /// активность карты, достаточность средств (баланс + кредитная линия).
    /// Списывает средства и создаёт транзакцию.
    /// НЕ вызывает SaveChangesAsync — это ответственность вызывающего кода.
    /// </summary>
    Task<CardDebitResult> DebitCardAsync(CardDebitRequest request);
}
