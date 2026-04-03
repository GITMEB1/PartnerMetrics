<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Partner Metrics - LLM Development Instructions

## Tech Stack
- Next.js (App Router), TypeScript, Server Components/Actions.
- Vercel for hosting.
- Supabase (Auth, Postgres, RLS).
- Tailwind CSS v3, shadcn/ui, Lucide icons, Zod, date-fns.

## Architectural Guidelines
1. **Prefer Server Actions:** Use server actions (`server/actions/`) for simple mutations. Keep mutations small and easy to test.
2. **Server-first patterns:** Use React Server Components for initial fetches. Consolidate page data in route-level loaders (e.g., `src/app/app/today/page.tsx`).
3. **Optimistic UI:** Utilize optimistic updates for logging interactions on the client using React's `useOptimistic` or state changes before transition completes. Let the UI feel *immediate*.
4. **Rich Aesthetics:** Ensure modifications fit into a fast, calm, mobile-first design system. Include subtle dynamic animations (e.g. glow effects, simple transitions) to make the UI feel alive but not heavy.

## Development Workflow
- **Local Dev:** Run `npm run dev` in `partner-metrics/`.
- **Reference Material:** Always refer to `partner_metrics_app_blueprint V2.md` in the root folder for business logic and schema context when building or planning complex features.
- **Constraints:** Do not add libraries unless they genuinely remove real work. Prefer typed helpers (e.g., in `src/lib/`) over hidden magic.

## Privacy & Data Model Reminder
- All data access is governed by Supabase RLS.
- Personal metrics can be private (`visible_to_partner = false`). Always respect privacy modes in data fetching logic.
