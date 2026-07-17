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
    public DbSet<UserSession> UserSessions { get; set; } = null!;
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
    public DbSet<FooterSetting> FooterSettings { get; set; } = null!;
    public DbSet<SupportChat> SupportChats { get; set; } = null!;

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

            // Store enum as integer in the database
            entity.Property(u => u.Role)
                  .HasConversion<int>()
                  .HasColumnName("Role")
                  .IsRequired();

            entity.HasOne(u => u.Session)
                  .WithOne(s => s.User)
                  .HasForeignKey<UserSession>(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserSession>(entity =>
        {
            entity.ToTable("UserSessions");
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.UserId).IsUnique();
            entity.Property(s => s.UserId).IsRequired();
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
            
            entity.OwnsMany(l => l.StatusHistory, h => 
            { 
                h.ToJson(); 
            });
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
            entity.Property(c => c.MccCodes).HasDefaultValueSql("'{}'::text[]");
        });

        builder.Entity<CashbackMcc>(entity =>
        {
            entity.ToTable("CashbackMccs");
            entity.HasKey(m => m.Id);
            entity.HasIndex(m => m.Code).IsUnique();
            entity.Property(m => m.Code).IsRequired();
            entity.Property(m => m.Description).HasMaxLength(100);
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
            entity.HasIndex(p => new { p.PageName, p.LanguageCode }).IsUnique();
            entity.Property(p => p.PageName).IsRequired();
            entity.Property(p => p.LanguageCode).IsRequired();
            entity.Property(p => p.MediaText).IsRequired(false);
        });

        builder.Entity<FooterSetting>(entity =>
        {
            entity.ToTable("FooterSettings");
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Category).IsRequired();
            entity.Property(f => f.Key).IsRequired();
            entity.Property(f => f.Value).IsRequired(false);
            entity.Property(f => f.Url).IsRequired(false);

            entity.HasData(
                new FooterSetting { Id = 1, Category = "Contact", Key = "Address", Value = "Baku, Azerbaijan", Url = "https://maps.google.com/?q=Baku%2C%20Azerbaijan" },
                new FooterSetting { Id = 2, Category = "Contact", Key = "Email", Value = "support@neobank.az", Url = "mailto:support@neobank.az" },
                new FooterSetting { Id = 3, Category = "Contact", Key = "Phone", Value = "+994 12 555 45 45", Url = "tel:+994125554545" },
                new FooterSetting { Id = 4, Category = "Social", Key = "Facebook", Value = "Facebook", Url = "https://www.facebook.com/" },
                new FooterSetting { Id = 5, Category = "Social", Key = "X", Value = "X", Url = "https://x.com/" },
                new FooterSetting { Id = 6, Category = "Social", Key = "LinkedIn", Value = "LinkedIn", Url = "https://www.linkedin.com/" },
                new FooterSetting { Id = 7, Category = "Social", Key = "Instagram", Value = "Instagram", Url = "https://www.instagram.com/" }
            );
        });

        builder.Entity<SupportChat>(entity =>
        {
            entity.ToTable("SupportChats");
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.UserId);

            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.OwnsMany(c => c.Review, r => 
            { 
                r.ToJson(); 
            });

            entity.OwnsMany(c => c.Chat, c => 
            { 
                c.ToJson(); 
            });
        });
    }
}
