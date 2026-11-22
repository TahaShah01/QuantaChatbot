<div align="center">

# ✦ QuantaV
### Intelligence, Without Friction.

A premium, high-performance AI chatbot web application powered by **Groq LPU™ acceleration**, **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-Accelerated-f55036?style=for-the-badge&logo=groq)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

</div>

---

## ⚡ Overview

**QuantaV** establishes a distinctive, distraction-free conversational experience inspired by the usability of modern assistants (ChatGPT, Claude, Gemini) with its own unmistakable design identity: layered deep charcoals, warm alabaster light tones, refined violet accents, and blistering sub-second response times powered by the official Groq Cloud API.

---

## ✨ Key Features

### 🚀 Ultra-Fast Reasoning Engines
- **Curated Groq Cloud Models**: Seamless access to production acceleration engines:
  - `Llama 3.1 8B Instant` (~560 tps, 30,000 TPM limit — ultra-stable default)
  - `GPT OSS 120B` (~500 tps flagship open weights reasoning model)
  - `GPT OSS 20B` (~1,000 tps extreme throughput)
  - `Qwen 3.8 27B` (~450 tps high-precision instruction following)
  - `Llama 3.3 70B Versatile` (~280 tps advanced reasoning)
  - `MiniMax M2.7` (196k extended context)
  - `Muse Spark Open` (creative reasoning & generation)
- **In-Chatbar Model Switcher**: Swap active models instantly right from the composer bar with zero menu navigation.
- **Custom Model ID Support**: Bring any custom Groq model deployment on demand.

### 🛡️ Smart Token Budgeting & Self-Healing
- **Model-Aware TPM Budgeting**: Automatically calculates input tokens and clamps completion token requests safely beneath Groq free-tier rate limits (e.g. 8,000 TPM for GPT OSS 120B).
- **Auto-Retry on 413 / Rate Limits**: Self-healing server route automatically recalibrates token reservations and retries requests on the fly without failing.
- **Token Limit Detection**: When an extensive code response reaches the token limit, QuantaV surfaces a **"Continue Generating →"** action to seamlessly pick up from the exact point of completion.

### 🎨 Distinctive Visual Identity & Complete Dual Theme System
- **Dark Mode**: Deep charcoal backgrounds (`#0d0c10`), layered dark surfaces (`#14131a`), violet glow borders, and soft white typography.
- **Light Mode**: Warm alabaster canvas (`#fcfbfa`), pure white elevated surfaces (`#ffffff`), dark slate text (`#121116`), and crisp neutral borders.
- **1-Click Header Switcher**: Instant Sun/Moon toggle in the top navigation bar plus system auto-detection in Settings.
- **Spacious Full-Width Canvas**: Eliminates cramped message cards. Tables and code blocks expand smoothly across wide laptop and desktop viewports up to `2xl:max-w-7xl`.

### 💻 Developer-Grade Code & Markdown
- **Syntax Highlighting**: Highlighted code blocks with line counts, language badges, and one-click copy.
- **Code Wrapping**: Toggle line wrapping for dense code files.
- **Responsive Tables**: Automatic `.table-wrapper` scroll protection so multi-column comparison tables never overflow or break mobile screens.
- **Text-to-Speech (TTS)**: Built-in voice readout for any assistant response.

### 🔒 Ephemeral Privacy & Data Control
- **In-Memory API Keys**: Your Groq API key is held strictly in volatile browser memory for the session. It is **never** written to `localStorage`, cookies, or remote databases.
- **Export & Backup**: Export conversations as **Markdown (`.md`)**, **Plain Text (`.txt`)**, or **Structured JSON (`.json`)**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with native CSS custom properties |
| **AI Inference** | Official [Groq SDK](https://github.com/groq/groq-typescript) (`groq-sdk`) |
| **Markdown & Code** | `react-markdown`, `remark-gfm`, `rehype-highlight` |

---

## 📁 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts         # SSE streaming route with Groq SDK & TPM auto-budgeting
│   │   └── validate/
│   │       └── route.ts         # API key validation & live model discovery
│   ├── components/
│   │   ├── ChatArea.tsx         # Main chat canvas with header, model picker & quick theme toggle
│   │   ├── ChatComposer.tsx     # In-chatbar model & persona selectors, auto-expanding input
│   │   ├── ChatMessage.tsx      # Full-width markdown, syntax-highlighted code & action toolbar
│   │   ├── QuantaIcon.tsx       # QuantaV brand SVG icon
│   │   ├── SettingsModal.tsx    # Tabbed settings (API, Models, Personas, Themes, Export)
│   │   ├── Sidebar.tsx          # History drawer, search, rename, export, delete
│   │   ├── ThemeSwitcher.tsx    # Light / Dark / System mode controller
│   │   └── WelcomeScreen.tsx    # Centered greeting & prompt suggestion chips
│   ├── providers/
│   │   ├── ChatProvider.tsx     # Global chat context, conversations state & non-blocking streaming
│   │   └── ThemeProvider.tsx    # Dynamic data-theme provider with anti-flash hydration
│   ├── globals.css              # Light & dark theme design system (Tailwind v4 @theme inline)
│   ├── layout.tsx               # Root HTML layout with anti-flash script
│   └── page.tsx                 # Root responsive application shell
├── lib/
│   ├── storage.ts               # Local storage persistence for chats & themes
│   ├── types.ts                 # TypeScript interfaces, available models & personas
│   └── utils.ts                 # Token estimation, export formatters & date grouping
├── netlify.toml                 # Netlify deployment configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.18+ or v20+
- A [Groq Cloud API Key](https://console.groq.com/keys) (Free tier available)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/quantav-ai.git
   cd quantav-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000). Enter your Groq API key in Settings (or when prompted by the composer banner) to begin.

---

## 🌐 Deployment Guide

### Option A: Deploy to Vercel (Recommended — Zero Config)

Vercel is built by the creators of Next.js and provides instant, zero-configuration deployment:

#### Method 1: Using the Vercel CLI
```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy to production
vercel --prod
```

#### Method 2: Via Git & Vercel Dashboard
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your `quantav-ai` repository.
4. Framework Preset will automatically detect **Next.js**.
5. Click **Deploy**.

---

### Option B: Deploy to Netlify

Netlify natively runs Next.js App Router applications with edge runtime and serverless functions:

#### Method 1: Using Netlify CLI
```bash
# 1. Install Netlify CLI globally
npm install -g netlify-cli

# 2. Login to your Netlify account
netlify login

# 3. Initialize & Deploy
netlify init
netlify deploy --prod
```

#### Method 2: Via Netlify Dashboard
1. Push your repository to GitHub.
2. Log in to [app.netlify.com](https://app.netlify.com) and click **"Add new site"** > **"Import an existing project"**.
3. Select your GitHub repository.
4. Netlify will automatically detect:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Click **Deploy Site**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Start a new chat |
| `⌘B` / `Ctrl+B` | Toggle sidebar open/closed |
| `⌘,` / `Ctrl+,` | Open Settings modal |
| `Enter` | Send message |
| `Shift + Enter` | New line in composer |
| `Escape` | Dismiss modal or popover menu |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with precision for <strong>QuantaV</strong> • Powered by Groq Cloud LPUs</sub>
</div>
