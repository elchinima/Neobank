using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;

namespace NeoBank.Infrastructure.Services;

public interface IStripeService
{
    Task<string?> CreatePaymentIntentAsync(decimal amount, string currency, string description, Dictionary<string, string>? metadata = null);
}

public class StripeService : IStripeService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeService> _logger;

    public StripeService(IConfiguration configuration, ILogger<StripeService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        var secretKey = _configuration["Stripe:SecretKey"] ?? _configuration["STRIPE_SECRET_KEY"];
        if (!string.IsNullOrEmpty(secretKey))
        {
            StripeConfiguration.ApiKey = secretKey;
        }
    }

    public async Task<string?> CreatePaymentIntentAsync(decimal amount, string currency, string description, Dictionary<string, string>? metadata = null)
    {
        var secretKey = _configuration["Stripe:SecretKey"] ?? _configuration["STRIPE_SECRET_KEY"];
        if (string.IsNullOrEmpty(secretKey))
        {
            _logger.LogWarning("Stripe Secret Key is not configured.");
            return null;
        }

        try
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(amount * 100),
                Currency = currency.ToLowerInvariant(),
                Description = description,
                PaymentMethodTypes = new List<string> { "card" },
                Metadata = metadata
            };

            var service = new PaymentIntentService();
            PaymentIntent intent = await service.CreateAsync(options);
            return intent.ClientSecret;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Stripe PaymentIntent");
            return null;
        }
    }
}
