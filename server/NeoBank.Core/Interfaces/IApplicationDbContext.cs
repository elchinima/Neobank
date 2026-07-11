using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;

namespace NeoBank.Core.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; set; }
    DbSet<UserSession> UserSessions { get; set; }
    DbSet<Card> Cards { get; set; }
    DbSet<Transaction> Transactions { get; set; }
    DbSet<Loan> Loans { get; set; }
    DbSet<Deposit> Deposits { get; set; }
    DbSet<CashbackCategory> CashbackCategories { get; set; }
    DbSet<CashbackMcc> CashbackMccs { get; set; }
    DbSet<UserCashback> UserCashbacks { get; set; }
    DbSet<RefreshToken> RefreshTokens { get; set; }
    DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; }
    DbSet<PublicPageSetting> PublicPageSettings { get; set; }
    DbSet<FooterSetting> FooterSettings { get; set; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
