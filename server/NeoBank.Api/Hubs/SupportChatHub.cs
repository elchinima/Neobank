using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NeoBank.Application.Interfaces;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;

namespace NeoBank.Api.Hubs;

[Authorize]
public class SupportChatHub : Hub
{
    private readonly IApplicationDbContext _dbContext;
    private readonly ISupportAIService _supportAIService;
    private readonly ILogger<SupportChatHub> _logger;

    public SupportChatHub(IApplicationDbContext dbContext, ISupportAIService supportAIService, ILogger<SupportChatHub> logger)
    {
        _dbContext = dbContext;
        _supportAIService = supportAIService;
        _logger = logger;
    }

    public async Task JoinChat(string? initialMessage = null, string language = "az", string? agentName = null)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var activeChat = await _dbContext.SupportChats
            .Include(c => c.Chat)
            .OrderByDescending(c => c.Created)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");

        if (activeChat == null)
        {
            if (string.IsNullOrEmpty(initialMessage))
            {
                var closedChat = await _dbContext.SupportChats
                    .Include(c => c.Chat)
                    .Include(c => c.Review)
                    .OrderByDescending(c => c.Created)
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Closed");

                if (closedChat != null)
                {
                    await Clients.Caller.SendAsync("ChatJoined", new { agentName = closedChat.AgentName, language = closedChat.Language, status = "Closed", hasReview = closedChat.Review.Any() });
                    await Clients.Caller.SendAsync("ReceiveHistory", closedChat.Chat.Select(m => new
                    {
                        id = Guid.NewGuid().ToString(),
                        sender = m.Sender == "user" ? "user" : "agent",
                        text = m.Text,
                        imageBase64 = m.ImagePath,
                        time = m.Time
                    }).ToList());
                }
                else
                {
                    await Clients.Caller.SendAsync("ReceiveHistory", new List<object>());
                }
                return;
            }

            activeChat = new SupportChat
            {
                UserId = userId,
                AgentName = agentName ?? "Agent",
                Language = language ?? "az",
                Created = DateTime.UtcNow.AddHours(4)
            };

            var chatMessage = new SupportChatMessage
            {
                Sender = "user",
                Text = initialMessage,
                Time = DateTime.UtcNow.AddHours(4).ToString("HH:mm")
            };
            activeChat.Chat.Add(chatMessage);
            _dbContext.SupportChats.Add(activeChat);
            await _dbContext.SaveChangesAsync();

            await Clients.Caller.SendAsync("ChatJoined", new { agentName = activeChat.AgentName, language = activeChat.Language });
            await Clients.Caller.SendAsync("ReceiveHistory", activeChat.Chat.Select(m => new
            {
                id = Guid.NewGuid().ToString(),
                sender = m.Sender == "user" ? "user" : "agent",
                text = m.Text,
                imageBase64 = m.ImagePath,
                time = m.Time
            }).ToList());
            
            await ProcessAIResponse(activeChat, initialMessage, activeChat.Language, activeChat.AgentName, null);
        }
        else
        {
            await Clients.Caller.SendAsync("ChatJoined", new { agentName = activeChat.AgentName, language = activeChat.Language, status = "Active", hasReview = false });
            await Clients.Caller.SendAsync("ReceiveHistory", activeChat.Chat.Select(m => new
            {
                id = Guid.NewGuid().ToString(),
                sender = m.Sender == "user" ? "user" : "agent",
                text = m.Text,
                imageBase64 = m.ImagePath,
                time = m.Time
            }).ToList());
        }
    }

    public async Task SendMessage(string message, string? imageBase64 = null, string language = "az", string agentName = "Agent")
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var activeChat = await _dbContext.SupportChats
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");

        if (activeChat == null)
        {
            await Clients.Caller.SendAsync("ChatError", "Active chat not found.");
            return;
        }

        activeChat.Chat.Add(new SupportChatMessage
        {
            Sender = "user",
            Text = message,
            ImagePath = imageBase64,
            Time = DateTime.UtcNow.AddHours(4).ToString("HH:mm")
        });

        await _dbContext.SaveChangesAsync();
        await Clients.Caller.SendAsync("MessageConfirmed", new
        {
            id = Guid.NewGuid().ToString(),
            sender = "user",
            text = message,
            imageBase64 = imageBase64
        });

        await ProcessAIResponse(activeChat, message, activeChat.Language, activeChat.AgentName, imageBase64);
    }

    private async Task ProcessAIResponse(SupportChat activeChat, string userMessage, string language, string agentName, string? imageUrl)
    {
        try
        {
            var history = activeChat.Chat
                .Where(c => c.Sender == "user" || c.Sender == "model" || c.Sender == "AI")
                .Select(c => new ChatMessage { Role = c.Sender == "user" ? "user" : "model", Text = c.Text ?? "" })
                .ToList();

            var responseText = await _supportAIService.GetAIResponseAsync(userMessage, language, history, agentName, activeChat.UserId, imageUrl);

            var aiMessage = new SupportChatMessage
            {
                Sender = "AI",
                Text = responseText,
                Time = DateTime.UtcNow.AddHours(4).ToString("HH:mm")
            };

            activeChat.Chat.Add(aiMessage);
            await _dbContext.SaveChangesAsync();

            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                id = Guid.NewGuid().ToString(),
                sender = "agent",
                text = responseText,
                time = aiMessage.Time
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AI response");
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                id = Guid.NewGuid().ToString(),
                sender = "agent",
                text = "Извините, сейчас мы испытываем высокую нагрузку. Оставьте сообщение, и мы свяжемся с вами.",
                time = DateTime.UtcNow.AddHours(4).ToString("HH:mm")
            });
        }
    }

    public async Task CloseChat()
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var activeChat = await _dbContext.SupportChats
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");

        if (activeChat != null)
        {
            activeChat.Status = "Closed";
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task SubmitReview(int rating, string? comment)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        // The chat might be closed by the time they submit a review, so we get the most recent chat for this user.
        var latestChat = await _dbContext.SupportChats
            .OrderByDescending(c => c.Created)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (latestChat != null)
        {
            latestChat.Review.Add(new SupportChatReview
            {
                Rating = rating,
                Comment = comment
            });
            await _dbContext.SaveChangesAsync();
        }
    }
}
