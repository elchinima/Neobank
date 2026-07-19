using System.Collections.Concurrent;
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
    private static readonly ConcurrentDictionary<string, string> _lastSenders = new();
    
    private static readonly string[] AgentNames = new[]
    {
        "Tural", "Leyla", "Rəşad", "Aygün", "Aysel", "Kamil", 
        "Elvin", "Orxan", "Vüqar", "Anar", "Samir", "Ramin", 
        "Fərid", "İlkin", "Emin", "Nurlan", "Ruslan", "Zaur", 
        "Ceyhun", "Cavid", "Elşən", "Rüstəm", "Murad", "Taleh", 
        "Elgün", "Vüsal", "Elnur", "Tərlan", "Azər", "Günel", 
        "Sevinc", "Nərmin", "Aytən", "Vüsalə", "Fidan", "Aynur", 
        "Səbinə", "Nigar", "Gülnar", "Lalə", "Xəyalə", "Şəbnəm", 
        "Zəhra", "Zeynəb", "Aytac", "Nuranə", "Gülşən", "Türkan"
    };

    private string GetRandomAgentName()
    {
        return AgentNames[new Random().Next(AgentNames.Length)];
    }

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
                    await Clients.Caller.SendAsync("ChatJoined", new { agentName = closedChat.AgentName, language = closedChat.Language, status = "Closed", hasReview = closedChat.Review.Any(), chatId = closedChat.Id });
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
                AgentName = string.IsNullOrEmpty(agentName) ? GetRandomAgentName() : agentName,
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

            _lastSenders[userId] = "user";

            await Clients.Caller.SendAsync("ChatJoined", new { agentName = activeChat.AgentName, language = activeChat.Language, lastSender = _lastSenders.GetValueOrDefault(userId, "agent"), chatId = activeChat.Id });
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
            await Clients.Caller.SendAsync("ChatJoined", new { agentName = activeChat.AgentName, language = activeChat.Language, status = "Active", hasReview = false, lastSender = _lastSenders.GetValueOrDefault(userId, "agent"), chatId = activeChat.Id });
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
        _lastSenders[userId] = "user";
        
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
            var startTime = DateTime.UtcNow;

            var history = activeChat.Chat
                .Where(c => c.Sender == "user" || c.Sender == "model" || c.Sender == "AI")
                .Select(c => new ChatMessage { Role = c.Sender == "user" ? "user" : "model", Text = c.Text ?? "" })
                .ToList();

            var responseText = await _supportAIService.GetAIResponseAsync(userMessage, language, history, agentName, activeChat.UserId, imageUrl);

            bool shouldClose = false;
            if (responseText.Contains("[CLOSE_CHAT]"))
            {
                shouldClose = true;
                responseText = responseText.Replace("[CLOSE_CHAT]", "").Trim();
            }

            var elapsed = DateTime.UtcNow - startTime;
            if (elapsed.TotalSeconds < 20)
            {
                await Task.Delay(TimeSpan.FromSeconds(20) - elapsed);
            }

            var aiMessage = new SupportChatMessage
            {
                Sender = "AI",
                Text = responseText,
                Time = DateTime.UtcNow.AddHours(4).ToString("HH:mm")
            };

            activeChat.Chat.Add(aiMessage);
            
            if (shouldClose)
            {
                activeChat.Status = "Closed";
            }
            
            await _dbContext.SaveChangesAsync();
            _lastSenders.TryRemove(activeChat.UserId, out _);

            await Clients.User(activeChat.UserId).SendAsync("ReceiveMessage", new
            {
                id = Guid.NewGuid().ToString(),
                sender = "agent",
                text = responseText,
                time = aiMessage.Time,
                shouldClose = shouldClose
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AI response");
            _lastSenders.TryRemove(activeChat.UserId, out _);
            await Clients.User(activeChat.UserId).SendAsync("ReceiveMessage", new
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
            _lastSenders.TryRemove(userId, out _);
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
