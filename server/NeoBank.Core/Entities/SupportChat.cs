using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NeoBank.Core.Entities;

public class SupportChat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    
    public string Status { get; set; } = "Active"; // "Active" or "Closed"
    
    public string AgentName { get; set; } = "Agent";

    public string Language { get; set; } = "az";

    public DateTime Created { get; set; } = DateTime.UtcNow.AddHours(4);

    public ICollection<SupportChatReview> Review { get; set; } = new List<SupportChatReview>();
    public ICollection<SupportChatMessage> Chat { get; set; } = new List<SupportChatMessage>();
}

public class SupportChatReview
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class SupportChatMessage
{
    public string Sender { get; set; } = string.Empty; // e.g., "User" or "AI"
    public string Text { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public string Time { get; set; } = string.Empty; // 24-hour format
}
