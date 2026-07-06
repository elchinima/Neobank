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


builder.Services.AddControllers();


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=neobank_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());


builder.Services.AddHttpClient();
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, PasswordHasher<ApplicationUser>>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddScoped<ICardDebitService, CardDebitService>();
builder.Services.AddScoped<IAvatarProcessingService, AvatarProcessingService>();


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
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174")
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

        if (!dbContext.CashbackCategories.Any())
        {
            var categories = new List<CashbackCategory>
            {
                new CashbackCategory { TitleKey = "catMetroTitle", TextKey = "catMetroText", Rate = 100m },
                new CashbackCategory { TitleKey = "catSuperTitle", TextKey = "catSuperText", Rate = 5m },
                new CashbackCategory { TitleKey = "catPharmTitle", TextKey = "catPharmText", Rate = 3m },
                new CashbackCategory { TitleKey = "catFuelTitle", TextKey = "catFuelText", Rate = 3m },
                new CashbackCategory { TitleKey = "catRestTitle", TextKey = "catRestText", Rate = 2m },
                new CashbackCategory { TitleKey = "catClothTitle", TextKey = "catClothText", Rate = 2m },
                new CashbackCategory { TitleKey = "catTrendTitle", TextKey = "catTrendText", Rate = 1m },
                new CashbackCategory { TitleKey = "catOtherTitle", TextKey = "catOtherText", Rate = 0.1m }
            };
            dbContext.CashbackCategories.AddRange(categories);
            dbContext.SaveChanges();

            var mccCodes = new List<CashbackMcc>();
            int codeCounter = 1;
            foreach(var cat in categories)
            {
                mccCodes.Add(new CashbackMcc { Code = codeCounter.ToString("D3"), CategoryId = cat.Id });
                codeCounter++;
            }
            dbContext.CashbackMccs.AddRange(mccCodes);
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
