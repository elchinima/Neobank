using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace NeoBank.Infrastructure.Services;

public interface IAvatarProcessingService
{
    Task<string> ProcessAndUploadAvatarAsync(string userId, IFormFile file);
}

public class AvatarProcessingService : IAvatarProcessingService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AvatarProcessingService> _logger;
    private readonly HttpClient _httpClient;

    public AvatarProcessingService(IConfiguration configuration, ILogger<AvatarProcessingService> logger, HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task<string> ProcessAndUploadAvatarAsync(string userId, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("File is empty.");
        }


        if (file.Length > 10 * 1024 * 1024)
        {
            throw new ArgumentException("File size exceeds 10 MB limit.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg" };
        if (!allowedExtensions.Contains(ext))
        {
            throw new ArgumentException("Only PNG, JPG, and JPEG images are allowed.");
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        using var image = await Image.LoadAsync(memoryStream);


        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(512, 512),
            Mode = ResizeMode.Crop
        }));


        using var webpStream = new MemoryStream();
        var encoder = new WebpEncoder
        {
            Quality = 50
        };
        await image.SaveAsync(webpStream, encoder);
        webpStream.Position = 0;

        var fileName = $"{userId}_{DateTime.UtcNow.Ticks}.webp";

        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["Supabase:Bucket"] ?? _configuration["STORAGE_BUCKET_NAME"] ?? "neobank-avatars";

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            try
            {
                var uploadUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}/{fileName}";
                var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", supabaseKey);
                request.Headers.Add("apiKey", supabaseKey);
                request.Content = new ByteArrayContent(webpStream.ToArray());
                request.Content.Headers.ContentType = new MediaTypeHeaderValue("image/webp");

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var publicUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/{fileName}";
                    return publicUrl;
                }
                else
                {
                    var err = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Supabase upload returned {response.StatusCode}: {err}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed uploading avatar to Supabase Storage");
            }
        }


        var localFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(localFolder);
        var localFilePath = Path.Combine(localFolder, fileName);
        await File.WriteAllBytesAsync(localFilePath, webpStream.ToArray());

        return $"/uploads/avatars/{fileName}";
    }
}
