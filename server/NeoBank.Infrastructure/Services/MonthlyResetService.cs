using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NeoBank.Infrastructure.Data;

namespace NeoBank.Infrastructure.Services;

public class MonthlyResetService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MonthlyResetService> _logger;

    public MonthlyResetService(IServiceProvider serviceProvider, ILogger<MonthlyResetService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var bakuOffset = TimeSpan.FromHours(4);
            var now = DateTimeOffset.UtcNow.ToOffset(bakuOffset);
            
            // Calculate time until next 1st of the month at 00:00:00 Baku Time (UTC+4)
            var nextMonth = now.Month == 12 ? 1 : now.Month + 1;
            var nextYear = now.Month == 12 ? now.Year + 1 : now.Year;
            var nextResetDate = new DateTimeOffset(nextYear, nextMonth, 1, 0, 0, 0, bakuOffset);
            
            var delay = nextResetDate - now;

            _logger.LogInformation("MonthlyResetService scheduled to run at {NextResetDate} (in {Delay})", nextResetDate, delay);

            try
            {
                // Sleep until the target date
                await Task.Delay(delay, stoppingToken);

                // Run the reset logic
                await ResetCashbackDataAsync(stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Service is stopping
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while resetting cashback data. Retrying in 1 hour.");
                // Wait an hour and try again if it failed, so we don't spam errors
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    private async Task ResetCashbackDataAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        _logger.LogInformation("Starting monthly cashback reset process...");

        // Reset the chosen variant for all sessions
        await dbContext.Database.ExecuteSqlRawAsync(
            "UPDATE \"UserSessions\" SET \"CashbackVariant\" = NULL;", 
            stoppingToken);

        // Reset the earned cashback amount for all users so the limits start fresh
        await dbContext.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"UserCashbacks\";", 
            stoppingToken);

        _logger.LogInformation("Monthly cashback reset process completed successfully.");
    }
}
