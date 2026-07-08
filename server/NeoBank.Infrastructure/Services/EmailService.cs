using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using NeoBank.Application.Interfaces;

namespace NeoBank.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClient = httpClientFactory.CreateClient("brevo");
        _apiKey = config["Brevo:ApiKey"] ?? throw new InvalidOperationException("Brevo:ApiKey is not configured.");
        _fromEmail = config["Brevo:FromEmail"] ?? throw new InvalidOperationException("Brevo:FromEmail is not configured.");
        _fromName = config["Brevo:FromName"] ?? "NeoBank";
    }

    public async Task SendVerificationCodeAsync(string toEmail, string firstName, string code, string purpose)
    {
        var isTwoFactor = purpose == "TwoFactor";

        var subject = isTwoFactor
            ? "NeoBank — Your 2FA Login Code"
            : "NeoBank — Confirm Your Email Address";

        var purposeTitle = isTwoFactor
            ? "Two-Factor Authentication"
            : "Email Verification";

        var purposeDesc = isTwoFactor
            ? "A sign-in attempt was made to your account. Enter this code to complete your login."
            : "Welcome to NeoBank! Please confirm your email address by entering the code below.";

        var html = BuildEmailHtml(firstName, code, purposeTitle, purposeDesc);

        var payload = new
        {
            sender = new { email = _fromEmail, name = _fromName },
            to = new[] { new { email = toEmail, name = firstName } },
            subject,
            htmlContent = html
        };

        var json = JsonSerializer.Serialize(payload);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("api-key", _apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Brevo API error ({response.StatusCode}): {error}");
        }
    }

    public async Task SendCustomEmailAsync(string toEmail, string firstName, string emailTitle, string contentTitle, string contentMessage)
    {
        var html = BuildCustomEmailHtml(firstName, emailTitle, contentTitle, contentMessage);

        var payload = new
        {
            sender = new { email = _fromEmail, name = _fromName },
            to = new[] { new { email = toEmail, name = firstName } },
            subject = emailTitle,
            htmlContent = html
        };

        var json = JsonSerializer.Serialize(payload);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("api-key", _apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Brevo API error ({response.StatusCode}): {error}");
        }
    }

    private static string BuildEmailHtml(string firstName, string code, string purposeTitle, string purposeDesc)
    {
        // Format code as 4 + 3 for readability
        var codeFormatted = code.Length == 7
            ? $"{code[..4]}&thinsp;{code[4..]}"
            : code;

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>NeoBank Verification</title>
</head>
<body style=""background-color:#0a080e; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased;"">

  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px; margin:0 auto;"">

    <!-- Header -->
    <tr>
      <td style=""text-align:center; padding-bottom: 32px;"">
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto;"">
          <tr>
            <td style=""background: linear-gradient(145deg, #211a2a, #17121f 58%, #14101b); border: 1px solid rgba(255, 226, 138, 0.22); border-radius: 16px; padding: 12px 28px;"">
              <span style=""font-size:22px; font-weight:700; color:#F3C24A; letter-spacing:-0.5px;"">NeoBank</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Card -->
    <tr>
      <td style=""background: linear-gradient(145deg, #1f1826 0%, #15101a 100%); border: 1px solid rgba(255, 226, 138, 0.22); border-radius: 24px; padding: 48px 40px; box-shadow: 0 25px 60px rgba(0,0,0,0.5);"">

        <!-- Icon -->
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto 28px auto;"">
          <tr>
            <td style=""background: rgba(160, 32, 240, 0.15); border: 1px solid rgba(160, 32, 240, 0.3); border-radius: 50%; width: 72px; height: 72px; text-align: center; vertical-align: middle; font-size: 32px;"">🔐</td>
          </tr>
        </table>

        <!-- Title -->
        <h1 style=""text-align:center; font-size:26px; font-weight:700; color:#f1f5f9; margin:0 0 12px 0; letter-spacing:-0.5px;"">{purposeTitle}</h1>

        <!-- Greeting -->
        <p style=""text-align:center; color:#a092b1; font-size:15px; line-height:1.6; margin:0 0 6px 0;"">Hello, <strong style=""color:#F3C24A;"">{firstName}</strong>.</p>
        <p style=""text-align:center; color:#a092b1; font-size:15px; line-height:1.6; margin:0 0 36px 0;"">{purposeDesc}</p>

        <!-- Code Block -->
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto 36px auto;"">
          <tr>
            <td style=""background: rgba(160, 32, 240, 0.12); border: 1.5px solid rgba(243, 194, 74, 0.3); border-radius: 16px; padding: 20px 48px; text-align: center;"">
              <span style=""font-size: 44px; font-weight: 700; color: #F3C24A; letter-spacing: 10px;"">{codeFormatted}</span>
            </td>
          </tr>
        </table>

        <!-- Expiry Notice -->
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto 28px auto; max-width: 400px;"">
          <tr>
            <td style=""background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 10px; padding: 12px 20px; text-align: center;"">
              <span style=""font-size:13px; color:#fbbf24;"">⏱ This code expires in <strong>15 minutes</strong></span>
            </td>
          </tr>
        </table>

        <!-- Security note -->
        <p style=""text-align:center; color:#78698a; font-size:13px; line-height:1.6; margin:0;"">If you didn't request this code, please ignore this email. Your account remains secure.<br>Do not share this code with anyone — NeoBank will never ask for it.</p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style=""text-align:center; padding-top:28px;"">
        <p style=""color:#334155; font-size:12px; line-height:1.8; margin:0;"">
          © {DateTime.UtcNow.Year} NeoBank. All rights reserved.<br>
          This is an automated message — please do not reply.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>";
    }

    private static string BuildCustomEmailHtml(string firstName, string emailTitle, string contentTitle, string contentMessage)
    {
        // Replace newlines with <br> to preserve formatting in HTML
        var formattedMessage = contentMessage.Replace("\n", "<br>");

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{emailTitle}</title>
  <style>
    @media screen and (max-width: 600px) {{
      .email-card {{
        padding: 32px 20px !important;
      }}
      .email-content-box {{
        padding: 16px 20px !important;
      }}
      .email-title {{
        font-size: 22px !important;
      }}
    }}
  </style>
</head>
<body style=""background-color:#0a080e; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased;"">

  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px; margin:0 auto;"">

    <!-- Header -->
    <tr>
      <td style=""text-align:center; padding-bottom: 32px;"">
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto;"">
          <tr>
            <td style=""background: linear-gradient(145deg, #211a2a, #17121f 58%, #14101b); border: 1px solid rgba(255, 226, 138, 0.22); border-radius: 16px; padding: 12px 28px;"">
              <span style=""font-size:22px; font-weight:700; color:#F3C24A; letter-spacing:-0.5px;"">NeoBank</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Card -->
    <tr>
      <td class=""email-card"" style=""background: linear-gradient(145deg, #1f1826 0%, #15101a 100%); border: 1px solid rgba(255, 226, 138, 0.22); border-radius: 24px; padding: 48px 40px; box-shadow: 0 25px 60px rgba(0,0,0,0.5);"">

        <!-- Icon -->
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto 28px auto;"">
          <tr>
            <td style=""background: rgba(243, 194, 74, 0.15); border: 1px solid rgba(243, 194, 74, 0.3); border-radius: 50%; width: 72px; height: 72px; text-align: center; vertical-align: middle; font-size: 32px;"">✉️</td>
          </tr>
        </table>

        <!-- Title -->
        <h1 class=""email-title"" style=""text-align:center; font-size:26px; font-weight:700; color:#f1f5f9; margin:0 0 12px 0; letter-spacing:-0.5px;"">{contentTitle}</h1>

        <!-- Greeting -->
        <p style=""text-align:center; color:#a092b1; font-size:15px; line-height:1.6; margin:0 0 24px 0;"">Hello, <strong style=""color:#F3C24A;"">{firstName}</strong>.</p>
        
        <!-- Content Block -->
        <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin: 0 auto 36px auto; width: 100%;"">
          <tr>
            <td class=""email-content-box"" style=""background: rgba(255, 255, 255, 0.03); border: 1.5px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px 32px; text-align: left;"">
              <p style=""font-size: 15px; color: #f1f5f9; line-height: 1.7; margin: 0;"">{formattedMessage}</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style=""text-align:center; padding-top:28px;"">
        <p style=""color:#334155; font-size:12px; line-height:1.8; margin:0;"">
          © {DateTime.UtcNow.Year} NeoBank. All rights reserved.<br>
          This is an automated message — please do not reply.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>";
    }
}
