using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Infrastructure.Data;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ApplicationUser> Users { get; set; } = null!;
    public DbSet<Card> Cards { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<Loan> Loans { get; set; } = null!;
    public DbSet<Deposit> Deposits { get; set; } = null!;
    public DbSet<CashbackCategory> CashbackCategories { get; set; } = null!;
    public DbSet<CashbackMcc> CashbackMccs { get; set; } = null!;
    public DbSet<UserCashback> UserCashbacks { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; } = null!;
    public DbSet<PublicPageSetting> PublicPageSettings { get; set; } = null!;
    public DbSet<PublicPageSettingTranslation> PublicPageSettingTranslations { get; set; } = null!;
    public DbSet<FooterLink> FooterLinks { get; set; } = null!;
    public DbSet<FooterContact> FooterContacts { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FirstName).IsRequired();
            entity.Property(u => u.LastName).IsRequired();
        });

        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Token).IsUnique();
            entity.HasIndex(r => r.UserId);
            entity.Property(r => r.Token).IsRequired();

            entity.HasOne(r => r.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<EmailVerificationCode>(entity =>
        {
            entity.ToTable("EmailVerificationCodes");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TempToken);
            entity.Property(e => e.Code).IsRequired();
            entity.Property(e => e.Purpose).IsRequired();

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Card>(entity =>
        {
            entity.ToTable("Cards");
            entity.HasKey(c => c.Id);

            entity.HasIndex(c => new { c.UserId, c.CardType }).IsUnique();
            entity.Property(c => c.CardNumber).IsRequired();
            entity.Property(c => c.CardType).IsRequired();
        });

        builder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.UserId);
        });

        builder.Entity<Loan>(entity =>
        {
            entity.ToTable("Loans");
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => l.UserId);
        });

        builder.Entity<Deposit>(entity =>
        {
            entity.ToTable("Deposits");
            entity.HasKey(d => d.Id);
            entity.HasIndex(d => d.UserId);
        });

        builder.Entity<CashbackCategory>(entity =>
        {
            entity.ToTable("CashbackCategories");
            entity.HasKey(c => c.Id);
        });

        builder.Entity<CashbackMcc>(entity =>
        {
            entity.ToTable("CashbackMccs");
            entity.HasKey(m => m.Id);
            entity.HasIndex(m => m.CategoryId);
            
            entity.HasOne(m => m.Category)
                  .WithMany(c => c.MccCodes)
                  .HasForeignKey(m => m.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserCashback>(entity =>
        {
            entity.ToTable("UserCashbacks");
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.UserId);
            entity.HasIndex(u => u.CategoryId);
            entity.HasIndex(u => new { u.UserId, u.CategoryId }).IsUnique();
            
            entity.HasOne(u => u.User)
                  .WithMany()
                  .HasForeignKey(u => u.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(u => u.Category)
                  .WithMany(c => c.UserCashbacks)
                  .HasForeignKey(u => u.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PublicPageSetting>(entity =>
        {
            entity.ToTable("PublicPageSettings");
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.PageKey).IsUnique();
            entity.Property(p => p.PageKey).IsRequired();
        });

        builder.Entity<PublicPageSettingTranslation>(entity =>
        {
            entity.ToTable("PublicPageSettingTranslations");
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => new { t.PublicPageSettingId, t.LanguageCode }).IsUnique();
            entity.Property(t => t.LanguageCode).IsRequired();
            entity.Property(t => t.MediaText).IsRequired();
            
            entity.HasOne(t => t.PublicPageSetting)
                  .WithMany(p => p.Translations)
                  .HasForeignKey(t => t.PublicPageSettingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<FooterLink>(entity =>
        {
            entity.ToTable("FooterLinks");
            entity.HasKey(f => f.Id);
            entity.HasIndex(f => new { f.Section, f.SortOrder });
            entity.Property(f => f.Section).IsRequired();
            entity.Property(f => f.Label).IsRequired();
            entity.Property(f => f.Url).IsRequired();
        });

        builder.Entity<FooterContact>(entity =>
        {
            entity.ToTable("FooterContacts");
            entity.HasKey(f => f.Id);
            entity.HasIndex(f => f.ContactKey).IsUnique();
            entity.Property(f => f.ContactKey).IsRequired();
            entity.Property(f => f.Label).IsRequired();
            entity.Property(f => f.Value).IsRequired();
            entity.Property(f => f.Url).IsRequired();
        });
    }
}
