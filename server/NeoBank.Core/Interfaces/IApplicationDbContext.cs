using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;

namespace NeoBank.Core.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; set; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
