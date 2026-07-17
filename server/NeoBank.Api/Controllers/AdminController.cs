using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using NeoBank.Application.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Developer,SuperAdmin,Admin")]
public class AdminController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IEmailService _emailService;

    public AdminController(
        IApplicationDbContext context,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _emailService = emailService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var usersCount = await _context.Users.CountAsync();
        var pagesCount = await _context.PublicPageSettings.CountAsync();

        var recentUsers = await _context.Users
            .Include(u => u.Session)
            .OrderByDescending(u => u.Session != null ? u.Session.CreatedAt : DateTime.MinValue)
            .Take(5)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                Role = u.Role.ToString(),
                CreatedAt = u.Session != null ? u.Session.CreatedAt : (DateTime?)null
            })
            .ToListAsync();

        return Ok(new
        {
            usersCount,
            pagesCount,
            recentUsers
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        var usersQuery = _context.Users.Include(u => u.Session).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            usersQuery = usersQuery.Where(u =>
                u.Id.ToLower().Contains(normalizedSearch) ||
                u.FirstName.ToLower().Contains(normalizedSearch) ||
                u.LastName.ToLower().Contains(normalizedSearch) ||
                u.Email.ToLower().Contains(normalizedSearch) ||
                u.Role.ToString().ToLower().Contains(normalizedSearch));
        }

        var users = await usersQuery
            .OrderByDescending(u => u.Session != null ? u.Session.CreatedAt : DateTime.MinValue)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                Role = u.Role.ToString(),
                CreatedAt = u.Session != null ? u.Session.CreatedAt : (DateTime?)null,
                u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{userId}/toggle-status")]
    public async Task<IActionResult> ToggleUserStatus(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, isActive = user.IsActive });
    }

    [HttpGet("users/{userId}/details")]
    public async Task<IActionResult> GetUserDetails(string userId)
    {
        var user = await _context.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found.");

        var cards = await _context.Cards
            .Where(c => c.UserId == userId)
            .Select(c => new { c.Id, c.CardNumber, c.Iban, c.Status, c.Balance, c.CreditLimit, c.Network, c.CardType })
            .ToListAsync();

        var deposits = await _context.Deposits
            .Where(d => d.UserId == userId && d.Status == "Active")
            .ToListAsync();

        var loans = await _context.Loans
            .Where(l => l.UserId == userId && l.Status == "Active")
            .ToListAsync();

        return Ok(new
        {
            user.AvatarUrl,
            user.FirstName,
            user.LastName,
            user.Id,
            Role = user.Role.ToString(),
            user.IsActive,
            RegistrationIp = user.Session?.RegistrationIp,
            LastIp = user.Session?.LastIp,
            CreatedAt = user.Session?.CreatedAt,
            LastLoginAt = user.Session?.LastLoginAt,
            user.Email,
            TwoFactorEnabled = user.Session?.TwoFactorEnabled ?? false,
            Note = user.Session?.Note,
            IsEmailVerified = user.Session?.IsEmailVerified ?? false,
            IsSubscribedToNewsletter = user.Session?.IsSubscribedToNewsletter ?? false,
            CashbackVariant = user.Session?.CashbackVariant,
            Cards = cards,
            Deposits = deposits,
            Loans = loans
        });
    }

    [HttpPut("cards/{cardId}/toggle-status")]
    public async Task<IActionResult> ToggleCardStatus(string cardId)
    {
        var card = await _context.Cards.FindAsync(cardId);
        if (card == null) return NotFound("Card not found.");

        card.Status = card.Status == "Active" ? "Blocked" : "Active";
        await _context.SaveChangesAsync();

        return Ok(new { success = true, status = card.Status });
    }

    public class UpdateNoteRequest
    {
        public string? Note { get; set; }
    }

    [HttpPut("users/{userId}/note")]
    public async Task<IActionResult> UpdateUserNote(string userId, [FromBody] UpdateNoteRequest request)
    {
        var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.UserId == userId);
        if (session == null) return NotFound("User not found.");

        if (request.Note != null && request.Note.Length > 1000)
        {
            return BadRequest("Note cannot exceed 1000 characters.");
        }

        session.Note = request.Note;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, note = session.Note });
    }

    [HttpPost("users/{userId}/unsubscribe")]
    public async Task<IActionResult> UnsubscribeUser(string userId, [FromServices] IEmailService emailService)
    {
        var user = await _context.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found.");

        if (user.Session == null || !user.Session.IsSubscribedToNewsletter)
            return BadRequest("User is not subscribed to the newsletter.");

        user.Session.IsSubscribedToNewsletter = false;
        await _context.SaveChangesAsync();

        await emailService.SendCustomEmailAsync(
            user.Email,
            user.FirstName,
            "Newsletter Subscription Disabled",
            "Subscription Update",
            "Your newsletter subscription has been disabled by an administrator."
        );

        return Ok(new { success = true });
    }

    [HttpPost("users/{userId}/reset-2fa")]
    public async Task<IActionResult> ResetUser2Fa(string userId, [FromServices] IEmailService emailService)
    {
        var user = await _context.Users
            .Include(u => u.Session)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found.");

        if (user.Session == null || !user.Session.TwoFactorEnabled)
            return BadRequest("User does not have 2FA enabled.");

        var activeCode = await _context.EmailVerificationCodes
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Purpose == "Disable2FA" && c.ExpiresAt > DateTime.UtcNow);

        if (activeCode != null)
        {
            var timeLeft = activeCode.ExpiresAt - DateTime.UtcNow;
            var timeString = timeLeft.TotalHours >= 1 
                ? $"{(int)timeLeft.TotalHours}h {timeLeft.Minutes}m" 
                : $"{timeLeft.Minutes}m {timeLeft.Seconds}s";
            
            return BadRequest($"An active 2FA reset link has already been sent. Please wait {timeString} before requesting a new one.");
        }

        // Clean up any old/expired Disable2FA codes
        var oldCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Purpose == "Disable2FA")
            .ToListAsync();
        
        _context.EmailVerificationCodes.RemoveRange(oldCodes);

        var token = Guid.NewGuid().ToString("N");
        var entry = new EmailVerificationCode
        {
            UserId = userId,
            Code = "LINK", // Not used for link-based reset
            Purpose = "Disable2FA",
            TempToken = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailVerificationCodes.Add(entry);
        await _context.SaveChangesAsync();

        var scheme = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? Request.Scheme;
        var host = Request.Headers["X-Forwarded-Host"].FirstOrDefault() ?? Request.Host.ToString();
        var dynamicBaseUrl = $"{scheme}://{host}{Request.PathBase}";
        
        var baseUrl = _configuration["ApiUrl"] ?? dynamicBaseUrl;
        // Call the backend API route directly from the email
        var resetLink = $"{baseUrl.TrimEnd('/')}/api/auth/confirm-disable-2fa?token={token}";

        await emailService.Send2FaResetEmailAsync(user.Email, user.FirstName, resetLink);

        return Ok(new { success = true });
    }

    public class SendCustomEmailRequest
    {
        public string EmailTitle { get; set; } = string.Empty;
        public string ContentTitle { get; set; } = string.Empty;
        public string ContentMessage { get; set; } = string.Empty;
        public IFormFile? Attachment { get; set; }
    }

    [HttpPost("users/{userId}/send-email")]
    public async Task<IActionResult> SendCustomEmail(string userId, [FromForm] SendCustomEmailRequest request, [FromServices] IEmailService emailService)
    {
        if (string.IsNullOrWhiteSpace(request.EmailTitle) || request.EmailTitle.Length > 100)
            return BadRequest("Email Title must be between 1 and 100 characters.");
        
        if (string.IsNullOrWhiteSpace(request.ContentTitle) || request.ContentTitle.Length > 100)
            return BadRequest("Content Title must be between 1 and 100 characters.");

        if (string.IsNullOrWhiteSpace(request.ContentMessage) || request.ContentMessage.Length > 1000)
            return BadRequest("Content Message must be between 1 and 1000 characters.");

        byte[]? attachmentBytes = null;
        string? attachmentName = null;

        if (request.Attachment != null)
        {
            if (request.Attachment.Length > 5 * 1024 * 1024)
                return BadRequest("File size exceeds 5 MB limit.");

            var ext = Path.GetExtension(request.Attachment.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".gif", ".webp", ".docx", ".pdf" };
            if (!allowedExtensions.Contains(ext))
                return BadRequest("Invalid file type. Only PNG, JPG, JPEG, GIF, WEBP, DOCX, and PDF are allowed.");

            attachmentName = request.Attachment.FileName;
            using var ms = new MemoryStream();
            await request.Attachment.CopyToAsync(ms);
            attachmentBytes = ms.ToArray();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        try
        {
            await emailService.SendCustomEmailAsync(user.Email, user.FirstName, request.EmailTitle, request.ContentTitle, request.ContentMessage, attachmentBytes, attachmentName);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Failed to send email: {ex.Message}");
        }
    }

    [HttpPost("users/send-newsletter")]
    public async Task<IActionResult> SendNewsletterToAllSubscribed([FromForm] SendCustomEmailRequest request, [FromServices] IEmailService emailService)
    {
        if (string.IsNullOrWhiteSpace(request.EmailTitle) || request.EmailTitle.Length > 100)
            return BadRequest("Email Title must be between 1 and 100 characters.");
        
        if (string.IsNullOrWhiteSpace(request.ContentTitle) || request.ContentTitle.Length > 100)
            return BadRequest("Content Title must be between 1 and 100 characters.");

        if (string.IsNullOrWhiteSpace(request.ContentMessage) || request.ContentMessage.Length > 1000)
            return BadRequest("Content Message must be between 1 and 1000 characters.");

        byte[]? attachmentBytes = null;
        string? attachmentName = null;

        if (request.Attachment != null)
        {
            if (request.Attachment.Length > 5 * 1024 * 1024)
                return BadRequest("File size exceeds 5 MB limit.");

            var ext = Path.GetExtension(request.Attachment.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".gif", ".webp", ".docx", ".pdf" };
            if (!allowedExtensions.Contains(ext))
                return BadRequest("Invalid file type. Only PNG, JPG, JPEG, GIF, WEBP, DOCX, and PDF are allowed.");

            attachmentName = request.Attachment.FileName;
            using var ms = new MemoryStream();
            await request.Attachment.CopyToAsync(ms);
            attachmentBytes = ms.ToArray();
        }

        var subscribedUsers = await _context.Users
            .Include(u => u.Session)
            .Where(u => u.Session != null && u.Session.IsSubscribedToNewsletter)
            .ToListAsync();
        if (!subscribedUsers.Any()) return BadRequest("No subscribed users found.");

        int successCount = 0;
        foreach (var user in subscribedUsers)
        {
            try
            {
                await emailService.SendCustomEmailAsync(user.Email, user.FirstName, request.EmailTitle, request.ContentTitle, request.ContentMessage, attachmentBytes, attachmentName);
                successCount++;
            }
            catch
            {
                // Optionally log the exception here
            }
        }

        return Ok(new { success = true, sentCount = successCount });
    }

    [HttpGet("public-content")]
    public async Task<IActionResult> GetEditablePublicContent()
    {
        var rawPages = await _context.PublicPageSettings.ToListAsync();

        var pages = rawPages
            .GroupBy(p => p.PageName)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                PageKey = g.Key,
                Translations = g.ToDictionary(
                    t => t.LanguageCode,
                    t => new { t.BannerImageUrl, t.MediaText, t.UpdatedAt }
                )
            });

        return Ok(new { pages });
    }

    [HttpPut("page-settings/{pageKey}")]
    public async Task<IActionResult> UpdatePageSetting(string pageKey, [FromBody] PageSettingRequest request)
    {
        var normalizedPageKey = pageKey.Trim().ToLower();
        var existingRecords = await _context.PublicPageSettings
            .Where(p => p.PageName == normalizedPageKey)
            .ToListAsync();

        if (request.Translations != null)
        {
            foreach (var kvp in request.Translations)
            {
                var lang = kvp.Key;
                var transReq = kvp.Value;

                var record = existingRecords.FirstOrDefault(r => r.LanguageCode == lang);
                if (record == null)
                {
                    record = new PublicPageSetting { PageName = normalizedPageKey, LanguageCode = lang };
                    _context.PublicPageSettings.Add(record);
                }

                record.BannerImageUrl = string.IsNullOrWhiteSpace(transReq.BannerImageUrl) ? string.Empty : transReq.BannerImageUrl.Trim();
                record.MediaText = transReq.MediaText?.Trim() ?? string.Empty;
                record.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        var updatedRecords = await _context.PublicPageSettings
            .Where(p => p.PageName == normalizedPageKey)
            .ToListAsync();

        return Ok(new
        {
            PageKey = normalizedPageKey,
            Translations = updatedRecords.ToDictionary(
                t => t.LanguageCode,
                t => new { t.BannerImageUrl, t.MediaText, t.UpdatedAt }
            )
        });
    }

    [HttpPost("page-settings/generate-ai-text")]
    public async Task<IActionResult> GenerateAIText([FromBody] AIGenerateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PageKey) || string.IsNullOrWhiteSpace(request.LanguageCode))
            return BadRequest("PageKey and LanguageCode are required.");

        var apiKey = _configuration["GEMINI_API_KEY"];
        var modelName = _configuration["GEMINI_MODEL"];

        if (string.IsNullOrEmpty(apiKey))
            return StatusCode(500, "Gemini API key is not configured.");

        try
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";
            var httpClient = _httpClientFactory.CreateClient();

            var langName = request.LanguageCode.ToLower() switch {
                "ru" => "Russian",
                "en" => "English",
                _ => "Azerbaijani"
            };

            var pagePath = $"https://neob.online/{request.PageKey}";
            var promptText = $"You are an AI assistant for Neobank. Language: {langName}. We have a banner image (provided) and the page path is {pagePath}. Based on the context of this page, write an engaging description for the page to be placed in 'Text below image'. The text MUST be in the selected language ({langName}) and BETWEEN 200 and 300 characters. Return ONLY the text, without any formatting or markdown.";

            var userParts = new List<object> { new { text = promptText } };

            if (!string.IsNullOrWhiteSpace(request.BannerImageUrl) && 
                (request.BannerImageUrl.StartsWith("http://") || request.BannerImageUrl.StartsWith("https://")))
            {
                try 
                {
                    var imageBytes = await httpClient.GetByteArrayAsync(request.BannerImageUrl);
                    var actualBase64 = Convert.ToBase64String(imageBytes);

                    var mimeType = "image/jpeg";
                    if (request.BannerImageUrl.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) mimeType = "image/png";
                    else if (request.BannerImageUrl.EndsWith(".webp", StringComparison.OrdinalIgnoreCase)) mimeType = "image/webp";

                    userParts.Add(new { inlineData = new { mimeType = mimeType, data = actualBase64 } });
                }
                catch (Exception ex)
                {
                    // Image download failed, continue without image
                }
            }

            var requestBody = new
            {
                contents = new[]
                {
                    new { role = "user", parts = userParts.ToArray() }
                }
            };

            var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(url, content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode(500, $"Gemini API error: {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(responseJson);
            
            var generatedText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (generatedText?.Length > 1000)
            {
                generatedText = generatedText.Substring(0, 1000);
            }

            return Ok(new { generatedText });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
    [HttpGet("database/images")]
    public async Task<IActionResult> GetDatabaseImages()
    {
        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["ADMIN_STORAGE_BUCKET_NAME"] ?? "neobank-admin";

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            return StatusCode(500, "Supabase configuration is missing");

        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var listUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/list/{bucketName}";
            
            var request = new HttpRequestMessage(HttpMethod.Post, listUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseKey);
            request.Headers.Add("apiKey", supabaseKey);
            
            var payload = new
            {
                prefix = "images",
                limit = 1000,
                offset = 0,
                sortBy = new { column = "created_at", order = "desc" }
            };
            request.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Failed to list images: {error}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var files = System.Text.Json.JsonDocument.Parse(content).RootElement;
            
            var resultList = new List<object>();
            foreach (var file in files.EnumerateArray())
            {
                var name = file.GetProperty("name").GetString();
                if (string.IsNullOrEmpty(name) || name == ".emptyFolderPlaceholder") continue;

                // Format: [id]___[custom_name].ext
                var parts = name.Split("___");
                var customName = name;
                var id = Guid.NewGuid().ToString();
                
                if (parts.Length > 1) 
                {
                    id = parts[0];
                    var nameWithExt = parts[1];
                    var lastDot = nameWithExt.LastIndexOf('.');
                    customName = lastDot > 0 ? nameWithExt.Substring(0, lastDot) : nameWithExt;
                }

                var createdAt = file.GetProperty("created_at").GetString();
                var publicUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/images/{name}";

                resultList.Add(new
                {
                    Id = id,
                    Name = customName,
                    UploadDate = createdAt,
                    Url = publicUrl,
                    FileName = name
                });
            }

            return Ok(resultList);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("database/images")]
    public async Task<IActionResult> UploadDatabaseImage([FromForm] IFormFile file, [FromForm] string name)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty.");
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name is required.");
        if (name.Length > 100) return BadRequest("Name cannot exceed 100 characters.");
        if (file.Length > 5 * 1024 * 1024) return BadRequest("File size exceeds 5 MB limit.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        if (!allowedExtensions.Contains(ext)) return BadRequest("Only PNG, JPG, JPEG, and WEBP images are allowed.");

        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["ADMIN_STORAGE_BUCKET_NAME"] ?? "neobank-admin";

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            return StatusCode(500, "Supabase configuration is missing");

        var httpClient = _httpClientFactory.CreateClient();

        try
        {
            var listUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/list/{bucketName}";
            var listReq = new HttpRequestMessage(HttpMethod.Post, listUrl);
            listReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseKey);
            listReq.Headers.Add("apiKey", supabaseKey);
            listReq.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(new { prefix = "images", limit = 1000 }), System.Text.Encoding.UTF8, "application/json");
            
            var listRes = await httpClient.SendAsync(listReq);
            if (listRes.IsSuccessStatusCode)
            {
                var content = await listRes.Content.ReadAsStringAsync();
                var files = System.Text.Json.JsonDocument.Parse(content).RootElement;
                foreach (var f in files.EnumerateArray())
                {
                    var fName = f.GetProperty("name").GetString();
                    if (fName != null && fName.Contains($"___{name}."))
                    {
                        return BadRequest("Image with this name already exists.");
                    }
                }
            }

            var sanitizedName = name.Replace(" ", "_").Replace("___", "_");

            var fileId = Guid.NewGuid().ToString();
            var fileName = $"{fileId}___{sanitizedName}{ext}";
            var objectPath = $"images/{fileName}";
            var uploadUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}/{objectPath}";

            var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseKey);
            request.Headers.Add("apiKey", supabaseKey);

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            request.Content = new ByteArrayContent(memoryStream.ToArray());
            var mimeType = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };
            request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);

            var response = await httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Failed to upload image: {error}");
            }

            var publicUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/{objectPath}";

            return Ok(new
            {
                Id = fileId,
                Name = name,
                UploadDate = DateTime.UtcNow.ToString("o"),
                Url = publicUrl,
                FileName = fileName
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpDelete("database/images")]
    public async Task<IActionResult> DeleteDatabaseImage([FromQuery] string fileName)
    {
        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["ADMIN_STORAGE_BUCKET_NAME"] ?? "neobank-admin";

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            return StatusCode(500, "Supabase configuration is missing");

        var httpClient = _httpClientFactory.CreateClient();

        try
        {
            var deleteUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}/images/{fileName}";
            var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseKey);
            request.Headers.Add("apiKey", supabaseKey);

            var response = await httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Failed to delete image: {error}");
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPut("database/images")]
    public async Task<IActionResult> RenameDatabaseImage([FromQuery] string fileName, [FromBody] RenameImageRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewName)) return BadRequest("New name is required.");
        var sanitizedNewName = req.NewName.Replace(" ", "_").Replace("___", "_");
        if (sanitizedNewName.Length > 100) return BadRequest("New name cannot exceed 100 characters.");

        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var supabaseKey = _configuration["Supabase:Key"] ?? _configuration["SUPABASE_KEY"] ?? _configuration["SUPABASE_SERVICE_ROLE_KEY"];
        var bucketName = _configuration["ADMIN_STORAGE_BUCKET_NAME"] ?? "neobank-admin";

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            return StatusCode(500, "Supabase configuration is missing");

        var httpClient = _httpClientFactory.CreateClient();

        try
        {
            var listUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/list/{bucketName}";
            var listReq = new HttpRequestMessage(HttpMethod.Post, listUrl);
            listReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseKey);
            listReq.Headers.Add("apiKey", supabaseKey);
            listReq.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(new { prefix = "images", limit = 1000 }), System.Text.Encoding.UTF8, "application/json");
            
            var listRes = await httpClient.SendAsync(listReq);
            if (listRes.IsSuccessStatusCode)
            {
                var content = await listRes.Content.ReadAsStringAsync();
                var files = System.Text.Json.JsonDocument.Parse(content).RootElement;
                foreach (var f in files.EnumerateArray())
                {
                    var fName = f.GetProperty("name").GetString();
                    if (fName != null && fName != fileName && fName.Contains($"___{req.NewName}."))
                    {
                        return BadRequest("Image with this name already exists.");
                    }
                }
            }

            var parts = fileName.Split("___");
            if (parts.Length < 2) return BadRequest("Invalid file name format.");
            var id = parts[0];
            var ext = Path.GetExtension(fileName);
            var newFileName = $"{id}___{sanitizedNewName}{ext}";

            var moveUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/move";
            var moveReq = new HttpRequestMessage(HttpMethod.Post, moveUrl);
            moveReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", supabaseKey);
            moveReq.Headers.Add("apiKey", supabaseKey);
            moveReq.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(new {
                bucketId = bucketName,
                sourceKey = $"images/{fileName}",
                destinationKey = $"images/{newFileName}"
            }), System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.SendAsync(moveReq);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Failed to rename image: {error}");
            }

            return Ok(new { success = true, newFileName });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("footer-settings")]
    public async Task<IActionResult> GetFooterSettings()
    {
        var settings = await _context.FooterSettings.ToListAsync();
        return Ok(settings);
    }

    [HttpPut("footer-settings")]
    public async Task<IActionResult> UpdateFooterSettings([FromBody] List<FooterSettingRequest> requests)
    {
        try
        {
            var existingSettings = await _context.FooterSettings.ToListAsync();

            foreach (var req in requests)
            {
                if (string.IsNullOrEmpty(req.Category) || string.IsNullOrEmpty(req.Key))
                    continue;

                var existing = existingSettings.FirstOrDefault(s => s.Category == req.Category && s.Key.ToLower() == req.Key.ToLower());
                if (existing != null)
                {
                    existing.Value = req.Value ?? string.Empty;
                    existing.Url = req.Url ?? string.Empty;
                    _context.FooterSettings.Update(existing);
                }
                else
                {
                    _context.FooterSettings.Add(new NeoBank.Core.Entities.FooterSetting
                    {
                        Category = req.Category,
                        Key = req.Key,
                        Value = req.Value ?? string.Empty,
                        Url = req.Url ?? string.Empty
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Footer settings updated successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
    [HttpGet("roles")]
    public IActionResult GetRoles()
    {
        var roles = Enum.GetValues<UserRole>()
            .Select(r => new
            {
                id = r.ToString(),
                name = r.ToDisplayName(),
                order = (int)r
            })
            .OrderBy(r => r.order)
            .ToList();
        return Ok(roles);
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> AssignRole(string id, [FromBody] AssignRoleDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound("User not found");

        if (!Enum.TryParse<UserRole>(dto.RoleId, ignoreCase: true, out var newRole))
            return BadRequest("Invalid role");

        user.Role = newRole;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Role assigned successfully", role = newRole.ToString() });
    }

    [HttpGet("cashbacks")]
    public async Task<IActionResult> GetCashbacks()
    {
        var cashbacks = await _context.CashbackCategories
            .Select(c => new
            {
                c.Id,
                c.TitleEn, c.TitleRu, c.TitleAz,
                c.TextEn, c.TextRu, c.TextAz,
                c.Rate,
                c.Limit,
                c.Variant,
                TotalEarned = _context.UserCashbacks.Where(uc => uc.CategoryId == c.Id).Sum(uc => (decimal?)uc.AmountEarned) ?? 0m,
                MccCodes = c.MccCodes
            })
            .OrderByDescending(c => c.Rate)
            .ToListAsync();
        return Ok(cashbacks);
    }

    [HttpPost("cashbacks")]
    public async Task<IActionResult> CreateCashback([FromBody] CashbackCategoryDto dto)
    {
        var category = new CashbackCategory
        {
            TitleEn = dto.TitleEn ?? "", TitleRu = dto.TitleRu ?? "", TitleAz = dto.TitleAz ?? "",
            TextEn = dto.TextEn ?? "", TextRu = dto.TextRu ?? "", TextAz = dto.TextAz ?? "",
            Rate = dto.Rate,
            Limit = dto.Limit < 1.00m ? 1.00m : dto.Limit,
            Variant = string.IsNullOrEmpty(dto.Variant) ? "A" : dto.Variant,
            MccCodes = dto.MccCodes ?? new List<string>()
        };
        _context.CashbackCategories.Add(category);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, id = category.Id });
    }

    [HttpPut("cashbacks/{id}")]
    public async Task<IActionResult> UpdateCashback(string id, [FromBody] CashbackCategoryDto dto)
    {
        var category = await _context.CashbackCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return NotFound("Cashback category not found");

        category.TitleEn = dto.TitleEn ?? ""; category.TitleRu = dto.TitleRu ?? ""; category.TitleAz = dto.TitleAz ?? "";
        category.TextEn = dto.TextEn ?? ""; category.TextRu = dto.TextRu ?? ""; category.TextAz = dto.TextAz ?? "";
        category.Rate = dto.Rate;
        category.Limit = dto.Limit < 1.00m ? 1.00m : dto.Limit;
        category.Variant = string.IsNullOrEmpty(dto.Variant) ? "A" : dto.Variant;
        category.MccCodes = dto.MccCodes ?? new List<string>();

        await _context.SaveChangesAsync();
        return Ok(new { success = true, id = category.Id });
    }

    [HttpDelete("cashbacks/{id}")]
    public async Task<IActionResult> DeleteCashback(string id)
    {
        var category = await _context.CashbackCategories.FindAsync(id);
        if (category == null) return NotFound("Cashback category not found");

        _context.CashbackCategories.Remove(category);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpGet("mccs")]
    public async Task<IActionResult> GetMccs()
    {
        var mccs = await _context.CashbackMccs
            .Select(m => new { m.Id, m.Code, m.Description })
            .ToListAsync();
        return Ok(mccs);
    }

    [HttpPost("mccs")]
    public async Task<IActionResult> CreateMcc([FromBody] MccDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code)) return BadRequest("Code is required");
        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Code, @"^\d{3,4}$"))
            return BadRequest("MCC Code must be a 3 or 4 digit number");

        if (await _context.CashbackMccs.AnyAsync(m => m.Code == dto.Code))
            return BadRequest("MCC with this code already exists");

        var mcc = new CashbackMcc
        {
            Code = dto.Code,
            Description = dto.Description ?? string.Empty
        };
        
        
        _context.CashbackMccs.Add(mcc);
        await _context.SaveChangesAsync();
        
        return Ok(new { success = true, id = mcc.Id });
    }

    [HttpPut("mccs/{id}")]
    public async Task<IActionResult> UpdateMcc(string id, [FromBody] MccDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code)) return BadRequest("Code is required");
        if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Code, @"^\d{3,4}$"))
            return BadRequest("MCC Code must be a 3 or 4 digit number");

        var mcc = await _context.CashbackMccs.FirstOrDefaultAsync(m => m.Id == id);
        if (mcc == null) return NotFound("MCC not found");

        // If the code is changing, check for conflicts
        if (mcc.Code != dto.Code && await _context.CashbackMccs.AnyAsync(m => m.Code == dto.Code))
            return BadRequest("MCC with this code already exists");

        mcc.Code = dto.Code;
        mcc.Description = dto.Description ?? string.Empty;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, id = mcc.Id });
    }

    [HttpDelete("mccs/{id}")]
    public async Task<IActionResult> DeleteMcc(string id)
    {
        var mcc = await _context.CashbackMccs.FindAsync(id);
        if (mcc == null) return NotFound("MCC not found");

        _context.CashbackMccs.Remove(mcc);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // --- LOAN MANAGEMENT ENDPOINTS ---

    [HttpGet("loans")]
    public async Task<IActionResult> GetLoans()
    {
        var loans = await _context.Loans
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id,
                l.UserId,
                UserFullName = _context.Users.Where(u => u.Id == l.UserId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault(),
                UserEmail = _context.Users.Where(u => u.Id == l.UserId).Select(u => u.Email).FirstOrDefault(),
                l.Amount,
                l.TermMonths,
                l.InterestRate,
                l.Status,
                l.CreatedAt,
                l.StatusHistory
            })
            .ToListAsync();

        return Ok(loans);
    }

    [HttpPost("loans/{id}/approve")]
    public async Task<IActionResult> ApproveLoan(string id)
    {
        var loan = await _context.Loans.FindAsync(id);
        if (loan == null) return NotFound(new { message = "Loan not found." });

        if (loan.Status != "Pending")
            return BadRequest(new { message = "Only pending loans can be approved." });

        var targetCard = await _context.Cards.FindAsync(loan.TargetCardId);
        if (targetCard == null)
            return NotFound(new { message = "Destination card not found." });

        var user = await _context.Users.FindAsync(loan.UserId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        loan.Status = "Active";
        targetCard.Balance += loan.Amount;

        var transaction = new Transaction
        {
            UserId = loan.UserId,
            CardId = targetCard.Id,
            Amount = loan.Amount,
            Type = "Credit",
            Category = "LoanPayout",
            Description = $"Loan disbursement ({loan.Amount} AZN for {loan.TermMonths} months)",
            Status = "Completed",
            BalanceAfter = targetCard.Balance
        };

        loan.StatusHistory.Add(new LoanStatusHistory
        {
            Status = "Active",
            ChangedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "Admin",
            Time = DateTime.UtcNow.ToString("o")
        });

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        await _emailService.SendCustomEmailAsync(
            user.Email,
            user.FirstName,
            "Loan Approved",
            "Loan Application Approved",
            $"Your loan application for {loan.Amount} AZN has been approved. The funds have been deposited to your card."
        );

        return Ok(new { message = "Loan approved successfully." });
    }

    [HttpPost("loans/{id}/reject")]
    public async Task<IActionResult> RejectLoan(string id, [FromBody] RejectLoanRequest request)
    {
        var loan = await _context.Loans.FindAsync(id);
        if (loan == null) return NotFound(new { message = "Loan not found." });

        if (loan.Status != "Pending")
            return BadRequest(new { message = "Only pending loans can be rejected." });

        var user = await _context.Users.FindAsync(loan.UserId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        loan.Status = "Rejected";

        loan.StatusHistory.Add(new LoanStatusHistory
        {
            Status = "Rejected",
            ChangedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "Admin",
            Time = DateTime.UtcNow.ToString("o"),
            Reason = request.Reason
        });

        await _context.SaveChangesAsync();

        var reasonText = !string.IsNullOrWhiteSpace(request.Reason) ? $"<br><br><b>Reason:</b> {request.Reason}" : "";

        await _emailService.SendCustomEmailAsync(
            user.Email,
            user.FirstName,
            "Loan Rejected",
            "Loan Application Rejected",
            $"Unfortunately, your loan application for {loan.Amount} AZN has been rejected.{reasonText}"
        );

        return Ok(new { message = "Loan rejected successfully." });
    }
}

public class RejectLoanRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class MccDto
{
    public string? Code { get; set; }
    public string? Description { get; set; }
}

public class CashbackCategoryDto
{
    public string? TitleEn { get; set; }
    public string? TitleRu { get; set; }
    public string? TitleAz { get; set; }
    public string? TextEn { get; set; }
    public string? TextRu { get; set; }
    public string? TextAz { get; set; }
    public decimal Rate { get; set; }
    public decimal Limit { get; set; }
    public string? Variant { get; set; }
    public List<string>? MccCodes { get; set; }
}

public class AssignRoleDto
{
    public string RoleId { get; set; } = string.Empty;
}

public class FooterSettingRequest
{
    public string? Category { get; set; }
    public string? Key { get; set; }
    public string? Value { get; set; }
    public string? Url { get; set; }
}

public class RenameImageRequest
{
    public string NewName { get; set; } = string.Empty;
}

public class PageSettingRequest
{
    public Dictionary<string, PageSettingTranslationRequest>? Translations { get; set; }
}

public class PageSettingTranslationRequest
{
    public string? BannerImageUrl { get; set; }
    public string? MediaText { get; set; }
}

public class AIGenerateRequest
{
    public string PageKey { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = string.Empty;
    public string? BannerImageUrl { get; set; }
}
