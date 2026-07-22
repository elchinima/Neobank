# ==========================================
# STAGE 1: Build Frontend (Vite/React)
# ==========================================
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ARG VITE_STRIPE_PUBLIC_KEY
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
RUN npm run build

# ==========================================
# STAGE 2: Build Backend (.NET 10)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src

# Copy project files for caching restore
COPY ["server/NeoBank.Api/NeoBank.Api.csproj", "NeoBank.Api/"]
COPY ["server/NeoBank.Application/NeoBank.Application.csproj", "NeoBank.Application/"]
COPY ["server/NeoBank.Core/NeoBank.Core.csproj", "NeoBank.Core/"]
COPY ["server/NeoBank.Infrastructure/NeoBank.Infrastructure.csproj", "NeoBank.Infrastructure/"]

RUN dotnet restore "NeoBank.Api/NeoBank.Api.csproj"

# Copy full C# source
COPY server/ .

# Build and Publish
WORKDIR "/src/NeoBank.Api"
RUN dotnet publish "NeoBank.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# STAGE 3: Final Production Image
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy Published backend app
COPY --from=backend-build /app/publish .

# Copy Built frontend files into wwwroot folder of the backend API
COPY --from=frontend-build /app/dist ./wwwroot

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "NeoBank.Api.dll"]
