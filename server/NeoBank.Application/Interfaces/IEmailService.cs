namespace NeoBank.Application.Interfaces;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string firstName, string code, string purpose);
    Task SendCustomEmailAsync(string toEmail, string firstName, string emailTitle, string contentTitle, string contentMessage);
}
