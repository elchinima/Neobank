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

        if (oldChats.Count > 0)
        {
            dbContext.SupportChats.RemoveRange(oldChats);
            await dbContext.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Successfully cleaned up {Count} old support chats from database.", oldChats.Count);
        }

        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["SupportChatBucketName"] ?? _configuration["SUPPORT_CHAT_BUCKET_NAME"] ?? "neobank-files";

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            await SweepSupabaseStorageAsync(supabaseUrl, supabaseKey, bucketName, stoppingToken);
        }
    }

    private async Task SweepSupabaseStorageAsync(string supabaseUrl, string supabaseKey, string bucketName, CancellationToken stoppingToken)
    {
        try
        {
            // 1. List all folders in "files"
            var listUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/list/{bucketName}";
            
            var requestBody = new 
            {
                prefix = "files",
                limit = 1000,
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
                _logger.LogWarning("Failed to list root folders in Supabase. Status: {Status}", response.StatusCode);
                return;
            }

            var foldersJson = await response.Content.ReadAsStringAsync(stoppingToken);
            var folders = JsonDocument.Parse(foldersJson).RootElement;
            
            var thresholdDate = DateTime.UtcNow.AddHours(4).AddDays(-1);
            var filesToDelete = new List<string>();

            foreach (var item in folders.EnumerateArray())
            {
                if (item.TryGetProperty("name", out var nameProp))
                {
                    var itemName = nameProp.GetString();
                    if (string.IsNullOrEmpty(itemName) || itemName == ".emptyFolderPlaceholder") continue;
                    
                    // Check if it's a direct file
                    if (item.TryGetProperty("created_at", out var rootCreatedAtProp) && 
                        rootCreatedAtProp.ValueKind != JsonValueKind.Null && 
                        DateTime.TryParse(rootCreatedAtProp.GetString(), out var rootCreatedAt))
                    {
                        if (rootCreatedAt < thresholdDate)
                        {
                            filesToDelete.Add($"files/{itemName}");
                        }
                    }
                    else
                    {
                        // It's a folder, list its contents
                        var folderPrefix = $"files/{itemName}";
                        var fileReqBody = new 
                        {
                            prefix = folderPrefix,
                            limit = 100,
                            offset = 0,
                            sortBy = new { column = "name", order = "asc" }
                        };
                        
                        var fileReq = new HttpRequestMessage(HttpMethod.Post, listUrl);
                        fileReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
                        fileReq.Headers.Add("apiKey", supabaseKey);
                        fileReq.Content = new StringContent(JsonSerializer.Serialize(fileReqBody), Encoding.UTF8, "application/json");

                        var fileRes = await _httpClient.SendAsync(fileReq, stoppingToken);
                        if (fileRes.IsSuccessStatusCode)
                        {
                            var filesDataJson = await fileRes.Content.ReadAsStringAsync(stoppingToken);
                            var filesData = JsonDocument.Parse(filesDataJson).RootElement;

                            foreach (var file in filesData.EnumerateArray())
                            {
                                if (file.TryGetProperty("name", out var fNameProp) && file.TryGetProperty("created_at", out var createdAtProp))
                                {
                                    var fName = fNameProp.GetString();
                                    if (DateTime.TryParse(createdAtProp.GetString(), out var createdAt))
                                    {
                                        if (createdAt < thresholdDate)
                                        {
                                            filesToDelete.Add($"{folderPrefix}/{fName}");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. Delete old files
            if (filesToDelete.Count > 0)
            {
                // Delete in chunks of 50
                for (int i = 0; i < filesToDelete.Count; i += 50)
                {
                    var chunk = filesToDelete.Skip(i).Take(50).ToList();
                    var deleteUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}";
                    var deleteReqBody = new { prefixes = chunk };

                    var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
                    deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
                    deleteRequest.Headers.Add("apiKey", supabaseKey);
                    deleteRequest.Content = new StringContent(JsonSerializer.Serialize(deleteReqBody), Encoding.UTF8, "application/json");

                    var deleteResponse = await _httpClient.SendAsync(deleteRequest, stoppingToken);
                    if (!deleteResponse.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Failed to delete a chunk of files. Status: {Status}", deleteResponse.StatusCode);
                    }
                }
                
                _logger.LogInformation("Deleted {Count} old files from Supabase storage.", filesToDelete.Count);
            }
            else
            {
                _logger.LogInformation("No old files found in Supabase storage to delete.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sweeping Supabase storage");
        }
    }
}
