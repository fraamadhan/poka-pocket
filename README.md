# 🪙 Poka Pocket | Pocket Money Tracker

Welcome to **Poka Pocket**, a cute, offline-first Progressive Web App (PWA) designed to make pocket money tracking simple, fast, and gamified. Built with a **Medieval Neo-Brutalism** aesthetic, it strips away the corporate clutter of traditional finance apps and turns daily budgeting into a game-like inventory ledger.

---

## ✨ Features

- **🏰 Pockets (Accounts):** Divide your money into discrete pools (e.g., *Main Wallet*, *School Snack Satchel*, *Savings Chest*).
- **🐉 Reactive Budget Icons:** Budgets for different categories are gamified! Icons visually morph from glowing/happy (under budget) to broken/burnt (over budget) to give instant visual feedback.
- **⚡ 3-Second Logging:** Equipped with a custom big-button on-screen numpad for ultra-fast, single-handed logging on mobile viewports.
- **📶 Offline-First PWA:** Fully responsive PWA layout with Service Worker integration. Log transactions offline while at school or on the move; the app syncs automatically once you re-establish connectivity.
- **📊 The Mana Curve & RPG Analytics:** Track your money using custom medieval charts:
  - *"The Mana Curve"* (Cash Flow Trend over time)
  - *"Tome of Allocation"* (XP-bar category breakdowns)
  - *"Pocket Duel"* (Pocket liquidity comparison)
- **📥 Data Portability:** Quickly audit transactions alongside parents or friends with one-click Excel/CSV spreadsheets export.
- **🛡️ Secure Access:** Safe authentication via Auth.js (NextAuth) integration.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Database ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database Provider:** [Neon (Serverless PostgreSQL)](https://neon.tech/)
- **Authentication:** [Auth.js (NextAuth v5)](https://authjs.dev/)
- **Styling:** Tailwind CSS v4 & custom CSS variables
- **Export Utility:** ExcelJS
- **Media Hosting:** Cloudinary

---

## 🚀 Getting Started

Follow these steps to run Poka Pocket locally:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Clone and Install Dependencies
```bash
# Navigate to the project directory
cd poka-pocket

# Install packages
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and populate the following variables:

```env
# Database Credentials
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Auth.js Configuration
AUTH_SECRET=your_auth_secret_here # Run `npx auth secret` to generate
AUTH_URL=http://localhost:3000

# OAuth Credentials (e.g., Google OAuth Provider)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Cloudinary (Image uploads)
CLOUDINARY_URL=your_cloudinary_url
```

### 4. Database Setup & Migrations
Sync your database schema with Neon using Drizzle:

```bash
# Push schema updates directly to the database
npx drizzle-kit push
```

### 5. Running the Application
Launch the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using Poka Pocket!

---

## 📱 Progressive Web App (PWA) Setup

To install Poka Pocket as an app on your mobile device:
1. Ensure the site is served over HTTPS (or use `localhost` for local testing).
2. Open the application in Safari (iOS) or Chrome (Android).
3. Tap the **Share / Options** button and select **"Add to Home Screen"**.
4. Poka Pocket will launch in standalone mode, utilizing offline capabilities.
