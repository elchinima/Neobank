using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using NeoBank.Api.Helpers;

namespace NeoBank.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public DocumentsController(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new UnauthorizedAccessException();

    public class OrderReferenceRequest
    {
        public string Type { get; set; } = string.Empty; // CreditLine, Debt, Deposits
        public string Language { get; set; } = "en"; // en, ru, az
        public string PaymentCardId { get; set; } = string.Empty;
    }

    [HttpPost("references")]
    public async Task<IActionResult> OrderReference([FromBody] OrderReferenceRequest req)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var paymentCard = await _context.Cards
            .FirstOrDefaultAsync(c => c.Id == req.PaymentCardId && c.UserId == userId);

        if (paymentCard == null) return BadRequest("Payment card not found.");
        
        decimal fee = 10.00m;
        if (paymentCard.Balance < fee) return BadRequest($"Insufficient funds for the certificate fee ({fee} AZN).");

        // Deduct fee
        paymentCard.Balance -= fee;

        var feeTxn = new Transaction
        {
            UserId = userId,
            Amount = fee,
            Type = "Debit",
            Category = "Banking Services",
            Description = "Fee for Certificate/Reference",
            CreatedAt = DateTime.UtcNow,
            CardId = paymentCard.Id
        };

        _context.Transactions.Add(feeTxn);
        
        List<Card>? creditLines = null;
        List<Loan>? loans = null;
        List<Deposit>? deposits = null;

        if (req.Type == "CreditLine")
        {
            creditLines = await _context.Cards
                .Where(c => c.UserId == userId && c.CreditLimit > 0 && c.Status == "Active")
                .ToListAsync();
        }
        else if (req.Type == "Debt")
        {
            loans = await _context.Loans
                .Where(l => l.UserId == userId)
                .ToListAsync();
        }
        else if (req.Type == "Deposits")
        {
            deposits = await _context.Deposits
                .Where(d => d.UserId == userId)
                .ToListAsync();
        }
        else
        {
            return BadRequest("Invalid reference type.");
        }

        var footerSettings = await _context.FooterSettings.ToListAsync();
        var address = footerSettings.FirstOrDefault(f => f.Category == "Contact" && f.Key == "Address")?.Value ?? "Baku, Azerbaijan";
        var phone = footerSettings.FirstOrDefault(f => f.Category == "Contact" && f.Key == "Phone")?.Value ?? "+994 12 555 45 45";

        var pdfBytes = ReferencePdfBuilder.Generate(
            user, req.Type, req.Language, address, phone, creditLines, loans, deposits
        );

        await _context.SaveChangesAsync();

        var subject = req.Language switch {
            "az" => "Bank arayışı",
            "ru" => "Банковская справка",
            _ => "Bank Certificate"
        };
        
        var body = req.Language switch {
            "az" => $"Hörmətli {user.FirstName},<br><br>Sifariş etdiyiniz arayış əlavədə təqdim olunur.",
            "ru" => $"Уважаемый(ая) {user.FirstName},<br><br>Заказанная вами справка находится во вложении.",
            _ => $"Dear {user.FirstName},<br><br>The certificate you ordered is attached."
        };

        var fileName = req.Type switch {
            "CreditLine" => "Credit_Line_Certificate.pdf",
            "Debt" => "Debt_Certificate.pdf",
            "Deposits" => "Deposits_Certificate.pdf",
            _ => "Certificate.pdf"
        };

        await _emailService.SendCustomEmailAsync(
            toEmail: user.Email ?? "",
            firstName: user.FirstName ?? "",
            emailTitle: subject,
            contentTitle: subject,
            contentMessage: body,
            attachmentBytes: pdfBytes,
            attachmentName: fileName
        );

        return Ok(new { message = "Certificate ordered successfully and sent to email." });
    }
}
