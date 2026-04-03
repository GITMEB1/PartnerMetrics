# Partner Metrics

A private, mobile-first web app for two people to track daily metrics together. Log habits, share progress, and build consistency — one tap at a time.

## Features

- **Fast daily logging** — boolean toggles, count steppers, duration chips, amount presets, 1-5 ratings, and short text
- **Shared & personal metrics** — track goals together while keeping some metrics personal
- **Household summary** — see at a glance how both partners are doing today
- **7-day trends** — streaks, change percentages, and mini bar charts
- **Daily notes** — capture quick thoughts alongside your metrics
- **Partner invite** — one invite link to join a household
- **Mobile-first** — designed for comfortable daily use on a phone

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, React Server Components, Server Actions
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Supabase](https://supabase.com/) — Auth, PostgreSQL, Row Level Security
- [Tailwind CSS v3](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/) — input validation
- [date-fns](https://date-fns.org/) — date utilities
- [Lucide](https://lucide.dev/) — icons

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd partner-metrics
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run these files in order:
   - `supabase/migrations/001_initial_schema.sql` — creates all tables
   - `supabase/policies.sql` — sets up Row Level Security
   - `supabase/seed.sql` — (optional) adds demo data

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` — from Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Settings > API > anon key
- `SUPABASE_SERVICE_ROLE_KEY` — from Settings > API > service_role key
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add all env vars in Vercel project settings
4. Deploy

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User display info (auto-created on signup) |
| `households` | The shared space for two people |
| `household_members` | Links users to households with roles |
| `invitations` | Partner invite tokens |
| `metric_definitions` | Configurable metric templates |
| `daily_entries` | One row per metric × user × date |
| `daily_notes` | Free-text daily notes |

All tables have Row Level Security enabled. See `supabase/policies.sql` for rules.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── login/              # Auth pages
│   ├── signup/
│   ├── invite/[token]/
│   ├── auth/callback/      # Magic link callback
│   └── app/                # Authenticated app
│       ├── layout.tsx      # App shell with nav
│       ├── today/          # Daily logging
│       ├── history/        # Trends & charts
│       ├── metrics/        # Metric CRUD
│       └── settings/       # Profile & household
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── app-shell/          # Navigation
│   ├── metrics/            # MetricCard, forms
│   ├── settings/           # Settings UI
│   └── shared/             # Shared components
├── lib/
│   ├── supabase/           # Client helpers
│   ├── validation/         # Zod schemas
│   └── dates/              # Date & streak helpers
├── server/actions/         # Server Actions
├── types/                  # TypeScript types
└── middleware.ts            # Auth guard
```

## License

Private — not for redistribution.
