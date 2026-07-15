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
                await Clients.Caller.SendAsync("ReceiveHistory", new List<object>());
                return;
            }

            activeChat = new SupportChat
            {
                UserId = userId,
                AgentName = agentName ?? "Agent",
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

            await Clients.Caller.SendAsync("ReceiveHistory", activeChat.Chat.Select(m => new
            {
                id = Guid.NewGuid().ToString(),
                sender = m.Sender == "user" ? "user" : "agent",
                text = m.Text,
                imageBase64 = m.ImagePath,
                time = m.Time
            }).ToList());

            await Clients.Caller.SendAsync("ChatJoined", activeChat.AgentName);
            await Clients.Caller.SendAsync("ReceiveHistory", activeChat.Chat.Select(m => new
            {
                id = Guid.NewGuid().ToString(),
                sender = m.Sender == "user" ? "user" : "agent",
                text = m.Text,
                imageBase64 = m.ImagePath,
                time = m.Time
            }).ToList());
            
            await ProcessAIResponse(activeChat, initialMessage, language, activeChat.AgentName, null);
        }
        else
        {
            await Clients.Caller.SendAsync("ChatJoined", activeChat.AgentName);
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

    public async Task SendMessage(string message, string? imageUrl, string language, string agentName)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var activeChat = await _dbContext.SupportChats
            .Include(c => c.Chat)
            .OrderByDescending(c => c.Created)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == "Active");

        if (activeChat == null)
        {
            await Clients.Caller.SendAsync("ChatError", "No active chat found.");
            return;
        }

        var chatMessage = new SupportChatMessage
        {
            Sender = "user",
            Text = message,
            ImagePath = imageUrl,
            Time = DateTime.UtcNow.AddHours(4).ToString("HH:mm")
        };

        activeChat.Chat.Add(chatMessage);
        await _dbContext.SaveChangesAsync();

        await Clients.Caller.SendAsync("MessageConfirmed", new
        {
            id = Guid.NewGuid().ToString(),
            sender = "user",
            text = message,
            imageBase64 = imageUrl,
            time = chatMessage.Time
        });

        await ProcessAIResponse(activeChat, message, language, agentName, imageUrl);
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
}
