using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NeoBank.Infrastructure.Data;

namespace NeoBank.Infrastructure.Services;

public class SupportChatCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SupportChatCleanupService> _logger;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public SupportChatCleanupService(
        IServiceProvider serviceProvider, 
        ILogger<SupportChatCleanupService> logger, 
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("SupportChatCleanupService running.");
            
            try
            {
                await CleanupChatsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while cleaning up support chats.");
            }

            // Run the cleanup every hour
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task CleanupChatsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // 1 day
        var thresholdDate = DateTime.UtcNow.AddHours(4).AddDays(-1);

        var oldChats = await dbContext.SupportChats
            .Where(c => c.Created < thresholdDate)
            .ToListAsync(stoppingToken);

        if (oldChats.Count == 0)
        {
            return;
        }

        _logger.LogInformation("Found {Count} old support chats to clean up.", oldChats.Count);

        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["SupportChatBucketName"] ?? _configuration["SUPPORT_CHAT_BUCKET_NAME"] ?? "neobank-files";

        foreach (var chat in oldChats)
        {
            // Delete folder from Supabase Storage
            if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
            {
                await DeleteSupabaseFolderAsync(supabaseUrl, supabaseKey, bucketName, $"files/{chat.Id}", stoppingToken);
            }

            dbContext.SupportChats.Remove(chat);
        }

        await dbContext.SaveChangesAsync(stoppingToken);
        
        _logger.LogInformation("Successfully cleaned up {Count} old support chats.", oldChats.Count);
    }

    private async Task DeleteSupabaseFolderAsync(string supabaseUrl, string supabaseKey, string bucketName, string folderPrefix, CancellationToken stoppingToken)
    {
        try
        {
            // 1. List files in the folder prefix
            var listUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/list/{bucketName}";
            
            var requestBody = new 
            {
                prefix = folderPrefix,
                limit = 100,
                offset = 0,
                sortBy = new { column = "name", order = "asc" }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, listUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
            request.Headers.Add("apiKey", supabaseKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, stoppingToken);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(stoppingToken);
                _logger.LogWarning("Failed to list files in folder {FolderPrefix}. Status: {Status}, Error: {Error}", folderPrefix, response.StatusCode, err);
                return;
            }

            var filesJson = await response.Content.ReadAsStringAsync(stoppingToken);
            var files = JsonDocument.Parse(filesJson).RootElement;
            
            var filesToDelete = new List<string>();
            foreach (var file in files.EnumerateArray())
            {
                if (file.TryGetProperty("name", out var nameProp))
                {
                    var fileName = nameProp.GetString();
                    if (!string.IsNullOrEmpty(fileName) && fileName != ".emptyFolderPlaceholder") // Ignore placeholders if any
                    {
                        filesToDelete.Add($"{folderPrefix}/{fileName}");
                    }
                }
            }

            if (filesToDelete.Count > 0)
            {
                // 2. Delete the files
                var deleteUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}";
                var deleteReqBody = new { prefixes = filesToDelete };

                var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
                deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
                deleteRequest.Headers.Add("apiKey", supabaseKey);
                deleteRequest.Content = new StringContent(JsonSerializer.Serialize(deleteReqBody), Encoding.UTF8, "application/json");

                var deleteResponse = await _httpClient.SendAsync(deleteRequest, stoppingToken);
                if (!deleteResponse.IsSuccessStatusCode)
                {
                    var err = await deleteResponse.Content.ReadAsStringAsync(stoppingToken);
                    _logger.LogWarning("Failed to delete files in folder {FolderPrefix}. Status: {Status}, Error: {Error}", folderPrefix, deleteResponse.StatusCode, err);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Supabase folder {FolderPrefix} in bucket {BucketName}", folderPrefix, bucketName);
        }
    }
}
