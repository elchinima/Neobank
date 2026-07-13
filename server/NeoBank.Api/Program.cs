using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NeoBank.Application.Interfaces;
using NeoBank.Application.Services;
using NeoBank.Core.Entities;
using NeoBank.Core.Interfaces;
using NeoBank.Infrastructure.Data;
using NeoBank.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Load .env if present
var root = Directory.GetCurrentDirectory();
var dotenvPath = Path.Combine(root, "..", "..", "secret", ".env");
if (!File.Exists(dotenvPath))
{
    dotenvPath = Path.Combine(root, "..", "secret", ".env");
}

if (File.Exists(dotenvPath))
{
    foreach (var line in File.ReadAllLines(dotenvPath))
    {
        var parts = line.Split('=', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0], parts[1]);
        }
    }
}
// Manually override config from env
builder.Configuration.AddEnvironmentVariables();



builder.Services.AddControllers();


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=neobank_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

builder.Services.AddHttpClient();
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, PasswordHasher<ApplicationUser>>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddScoped<ICardDebitService, CardDebitService>();
builder.Services.AddScoped<IAvatarProcessingService, AvatarProcessingService>();
builder.Services.AddScoped<ISupportAIService, SupportAIService>();

builder.Services.AddHostedService<MonthlyResetService>();


var secretKey = builder.Configuration["Jwt:Secret"] ?? "SuperSecretKeyForNeoBankJwtToken2026!#SecureKey_Minimum32Chars";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "NeoBankApi",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NeoBankClient",
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<IApplicationDbContext>();
            var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
            {
                var user = await dbContext.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    context.Fail("User account is disabled.");
                }
            }
        }
    };
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "https://neob.online", "http://neob.online")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "NeoBank API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token **_only_**",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition(securityScheme.Reference.Id, securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();


        try
        {
            dbContext.Database.ExecuteSqlRaw(@"
                DROP TABLE IF EXISTS ""AspNetRoles"", ""AspNetUserClaims"", ""AspNetUserLogins"", ""AspNetUserRoles"", ""AspNetUserTokens"", ""AspNetRoleClaims"" CASCADE;

                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='NormalizedEmail') THEN
                        DROP TABLE ""Users"" CASCADE;
                    END IF;
                END $$;
            ");
        }
        catch { }

        try
        {
            dbContext.Database.Migrate();
        }
        catch
        {
            dbContext.Database.EnsureCreated();
        }


        if (!dbContext.PublicPageSettings.Any())
        {
            dbContext.PublicPageSettings.AddRange(
                new PublicPageSetting { PageName = "cards", LanguageCode = "en", MediaText = "Choose a card line that fits your daily spending, travel and long-term plans." },
                new PublicPageSetting { PageName = "cards", LanguageCode = "ru", MediaText = "Выберите карту, подходящую для ваших ежедневных расходов, путешествий и долгосрочных планов." },
                new PublicPageSetting { PageName = "cards", LanguageCode = "az", MediaText = "Gündəlik xərclərinizə, səyahətlərinizə və uzunmüddətli planlarınıza uyğun kart seçin." },

                new PublicPageSetting { PageName = "loans", LanguageCode = "en", MediaText = "Plan the next move with a calmer calculator and transparent monthly payments." },
                new PublicPageSetting { PageName = "loans", LanguageCode = "ru", MediaText = "Планируйте следующий шаг с прозрачными ежемесячными платежами." },
                new PublicPageSetting { PageName = "loans", LanguageCode = "az", MediaText = "Növbəti addımınızı daha şəffaf aylıq ödənişlərlə planlaşdırın." },

                new PublicPageSetting { PageName = "deposits", LanguageCode = "en", MediaText = "Grow savings with flexible terms, clear yield and full control from NeoBank." },
                new PublicPageSetting { PageName = "deposits", LanguageCode = "ru", MediaText = "Увеличивайте сбережения на гибких условиях с полным контролем от NeoBank." },
                new PublicPageSetting { PageName = "deposits", LanguageCode = "az", MediaText = "NeoBank-dan tam nəzarət və çevik şərtlərlə əmanətlərinizi artırın." },

                new PublicPageSetting { PageName = "support", LanguageCode = "en", MediaText = "Get help from NeoBank support through tickets, guided answers or live chat." },
                new PublicPageSetting { PageName = "support", LanguageCode = "ru", MediaText = "Получите помощь от службы поддержки NeoBank через тикеты или живой чат." },
                new PublicPageSetting { PageName = "support", LanguageCode = "az", MediaText = "NeoBank dəstək xidmətindən canlı çat vasitəsilə kömək alın." },

                new PublicPageSetting { PageName = "cashback", LanguageCode = "en", MediaText = "Earn more value from everyday categories and track every reward in one place." },
                new PublicPageSetting { PageName = "cashback", LanguageCode = "ru", MediaText = "Получайте больше выгоды от повседневных покупок и отслеживайте кешбэк." },
                new PublicPageSetting { PageName = "cashback", LanguageCode = "az", MediaText = "Gündəlik kateqoriyalardan daha çox qazanın və keşbekləri izləyin." }
            );
            dbContext.SaveChanges();
        }


    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "An error occurred while creating/migrating the database.");
    }
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
