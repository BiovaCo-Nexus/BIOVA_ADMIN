# BiovaCo Nexus — Admin Portal

> **Internal Use Only.** This is a private, production-grade administration dashboard for BiovaCo Nexus. Not intended for public access.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## Overview

BiovaCo Nexus Admin is the central command center for all internal operations — from R&D lab management and finance to HR, content, and team collaboration. Built as a secure, offline-capable PWA with role-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 5 + SWC |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database & Auth** | Supabase (PostgreSQL + RLS) |
| **State Management** | TanStack Query v5 |
| **PDF Generation** | jsPDF + pdf-lib |
| **3D Rendering** | Three.js + React Three Fiber |
| **Push Notifications** | Web Push API + Supabase Edge Functions |
| **PWA** | vite-plugin-pwa + Service Worker |
| **Email** | Brevo (Sendinblue) API |

---

## Project Structure

```
biovaco-nexus-admin/
├── public/                     # Static assets served at root
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── robots.txt
│
├── src/
│   ├── components/             # All UI components
│   │   ├── ui/                 # shadcn/ui primitives (auto-generated)
│   │   ├── ui-custom/          # App-specific reusable layout components
│   │   ├── rd-lab/             # R&D Lab module components
│   │   └── *.tsx               # Feature-level admin components
│   │
│   ├── pages/                  # Route-level page components
│   │   ├── Admin.tsx           # Main admin dashboard
│   │   ├── Auth.tsx            # Login / authentication
│   │   ├── Careers.tsx         # Public careers page
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── integrations/           # Third-party service clients (Supabase, etc.)
│   ├── lib/                    # Shared utilities (clsx, cn helpers)
│   ├── utils/                  # Business logic utilities (PDF, push, logging)
│   ├── App.tsx                 # Root app + routing
│   ├── main.tsx                # App entry point
│   └── sw.ts                   # Service Worker (PWA)
│
├── supabase/
│   ├── functions/              # Supabase Edge Functions (Deno)
│   │   ├── _shared/            # Shared CORS helpers
│   │   ├── push-notify/        # Web push dispatcher
│   │   ├── newsletter-subscribe/
│   │   ├── newsletter-confirm/
│   │   ├── send-application-confirmation/
│   │   ├── track-visitor/
│   │   ├── visitor-stats/
│   │   └── heartbeat/
│   │
│   ├── migrations/             # Ordered SQL migrations (applied via Supabase CLI)
│   └── config.toml             # Supabase local dev config
│
├── .env.example                # ✅ Environment variable template (commit this)
├── .env                        # ❌ Real secrets — NEVER commit
├── .gitignore
├── .vscode/                    # Shared VSCode team settings
├── components.json             # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vercel.json                 # Deployment config
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or `bun`)
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone the repository

```bash
git clone https://github.com/your-org/biovaco-nexus-admin.git
cd biovaco-nexus-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials and API keys.  
See [`.env.example`](./.env.example) for a full list of required variables.

### 4. Run database migrations

```bash
npx supabase db push
```

> Ensure Supabase CLI is installed: `npm install -g supabase`

### 5. Start the development server

```bash
npm run dev
```

App will be available at **http://localhost:8080**

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Supabase Edge Functions

Edge functions live in `supabase/functions/`. To deploy:

```bash
# Deploy a single function
npx supabase functions deploy push-notify

# Deploy all functions
npx supabase functions deploy
```

---

## Database Migrations

All schema changes go through versioned SQL files in `supabase/migrations/`.

```bash
# Apply pending migrations to remote
npx supabase db push

# Create a new migration
npx supabase migration new your_migration_name
```

> Migration files are named with a timestamp prefix for deterministic ordering.

---

## Security

- All routes are protected via **Supabase Auth** + `AuthProtectedRoute`
- Database access is governed by strict **Row Level Security (RLS)** policies
- Search engine crawling is blocked via `robots.txt` and `<meta name="robots">` tags
- Push notification keys use **VAPID authentication**
- Environment secrets are **never committed** to source control

---

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

---

## License

**Private & Confidential.** This codebase is proprietary to BiovaCo Nexus. Unauthorized distribution or use is prohibited.
