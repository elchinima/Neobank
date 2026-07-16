<p align="center">
  <img src="./src/assets/icons/github-banner.svg" alt="Neobank Banner">
</p>

## 🚀 Neobank: Next-Gen Digital Banking Platform

> **Digital bank with cards, loans, deposits, and real-time AI support.**

Welcome to **Neobank** — a premium, modern banking web application built to provide a seamless financial experience. From managing cards to chatting with an AI-powered support agent in real-time, Neobank delivers a visually stunning and robust banking environment.

---

## ✨ Key Features

- 💳 **Card Management**: View, order, and manage your digital credit/debit cards seamlessly.
- 💸 **Smart Transactions**: Instant transfers, utility payments, and transaction history tracking.
- 🏦 **Loans & Deposits**: Flexible loan calculation and high-yield deposit management.
- 🤖 **Real-Time AI Support**: A powerful customer service chat using SignalR and AI to resolve issues in real-time.
- 🎁 **Cashback System**: Track rewards and cashbacks on your purchases.
- 🎨 **Premium UI/UX**: Dark mode by default, glassmorphism elements, gold accents, and fluid animations for a top-tier aesthetic.
- 🌍 **Multi-Language Support**: Available in multiple languages (AZ, RU, EN).

---

## 🛠️ Tech Stack

### **Frontend (Client)**
- **React 19** (Vite 8)
- **SCSS / CSS3** (Custom design system, no generic UI frameworks)
- **React Router v7**
- **SignalR Client** (Real-time chat)
- **Custom Context API** (Localization & Auth)

### **Backend (Server)**
- **ASP.NET Core 10 Web API**
- **Entity Framework Core 10** (Code-first architecture)
- **PostgreSQL** (Relational Database)
- **SignalR** (WebSockets for real-time AI communication)
- **Stripe API** (Payment Gateway integration)
- **JWT Authentication** (Secure stateless sessions)

---

## 📂 Project Structure

```text
neobank-client/
├── src/                      # Frontend React application
│   ├── app/                  # Contexts, Hooks, Store
│   ├── assets/               # Images, SVGs, global SCSS styles
│   └── components/           # UI Components (Pages, Dashboard, Support Chat)
└── server/                   # Backend ASP.NET Core solution (Clean Architecture)
    ├── NeoBank.Api/          # Controllers, Hubs, Middlewares
    ├── NeoBank.Application/  # Business Logic, Services, DTOs
    ├── NeoBank.Core/         # Domain Models & Interfaces
    └── NeoBank.Infrastructure/ # Entity Framework DbContext, Repositories, Stripe
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- .NET 10 SDK
- PostgreSQL
- Stripe Account (for payments)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/elchinima/Neobank-App.git
cd Neobank-App/neobank-client
```

### 2️⃣ Run the Frontend
```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will be available at `http://localhost:5173`.

### 3️⃣ Run the Backend
1. Navigate to the server API directory:
   ```bash
   cd server/NeoBank.Api
   ```
2. Update the `appsettings.json` with your database connection strings, JWT secret, and Stripe keys.
3. Apply database migrations:
   ```bash
   dotnet ef database update
   ```
4. Run the API:
   ```bash
   dotnet run
   ```
The backend will run on `https://localhost:7196` (or similar).

---

## 🛡️ Security & Performance
- **Authentication**: Secured with JWT bearer tokens.
- **Real-Time Data**: WebSocket connections via SignalR are authenticated and handled asynchronously.
- **Optimized UI**: Lazy-loaded components, optimized image formats (WebP), and CSS animations.

---

<p align="center">
  <i>Developed with ❤️ for the Code Academy Final Project.</i>
</p>
