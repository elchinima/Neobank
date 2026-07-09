using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using NeoBank.Application.Interfaces;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public AdminController(
        IApplicationDbContext context,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var usersCount = await _context.Users.CountAsync();
        var pagesCount = await _context.PublicPageSettings.CountAsync();

        var recentUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Role,
                u.CreatedAt
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
        var usersQuery = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            usersQuery = usersQuery.Where(u =>
                u.Id.ToLower().Contains(normalizedSearch) ||
                u.FirstName.ToLower().Contains(normalizedSearch) ||
                u.LastName.ToLower().Contains(normalizedSearch) ||
                u.Email.ToLower().Contains(normalizedSearch) ||
                u.Role.ToLower().Contains(normalizedSearch));
        }

        var users = await usersQuery
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.CreatedAt,
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
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        var cards = await _context.Cards
            .Where(c => c.UserId == userId)
            .Select(c => new { c.Id, c.CardNumber, c.Iban, c.Status, c.Balance, c.CreditLimit, c.Network })
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
            user.Role,
            user.IsActive,
            user.RegistrationIp,
            user.LastIp,
            user.CreatedAt,
            user.LastLoginAt,
            user.Email,
            user.TwoFactorEnabled,
            user.Note,
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
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        if (request.Note != null && request.Note.Length > 1000)
        {
            return BadRequest("Note cannot exceed 1000 characters.");
        }

        user.Note = request.Note;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, note = user.Note });
    }

    [HttpPost("users/{userId}/reset-2fa")]
    public async Task<IActionResult> ResetUser2Fa(string userId, [FromServices] IEmailService emailService)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        if (!user.TwoFactorEnabled)
            return BadRequest("User does not have 2FA enabled.");

        // Invalidate old Disable2FA codes
        var oldCodes = await _context.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.Purpose == "Disable2FA" && !c.IsUsed)
            .ToListAsync();
        
        foreach (var code in oldCodes)
        {
            code.IsUsed = true;
        }

        var token = Guid.NewGuid().ToString("N");
        var entry = new EmailVerificationCode
        {
            UserId = userId,
            Code = "LINK", // Not used for link-based reset
            Purpose = "Disable2FA",
            TempToken = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailVerificationCodes.Add(entry);
        await _context.SaveChangesAsync();

        var baseUrl = _configuration["ApiUrl"] ?? "http://localhost:5031";
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
