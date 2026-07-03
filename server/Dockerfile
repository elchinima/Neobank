# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for caching dotnet restore
COPY ["NeoBank.Api/NeoBank.Api.csproj", "NeoBank.Api/"]
COPY ["NeoBank.Application/NeoBank.Application.csproj", "NeoBank.Application/"]
COPY ["NeoBank.Core/NeoBank.Core.csproj", "NeoBank.Core/"]
COPY ["NeoBank.Infrastructure/NeoBank.Infrastructure.csproj", "NeoBank.Infrastructure/"]

RUN dotnet restore "NeoBank.Api/NeoBank.Api.csproj"

# Copy full source and build Release
COPY . .
WORKDIR "/src/NeoBank.Api"
RUN dotnet publish "NeoBank.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "NeoBank.Api.dll"]
