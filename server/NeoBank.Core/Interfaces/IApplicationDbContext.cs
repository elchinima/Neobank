using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;

namespace NeoBank.Core.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; set; }
    DbSet<Card> Cards { get; set; }
    DbSet<Transaction> Transactions { get; set; }
    DbSet<Loan> Loans { get; set; }
    DbSet<Deposit> Deposits { get; set; }
    DbSet<VatReceipt> VatReceipts { get; set; }
    DbSet<RefreshToken> RefreshTokens { get; set; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
