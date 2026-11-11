# South Dayton Toyota Delivery / SDT-Events UI

Admin UI for **South Dayton Toyota — Delivery** (`gyjkqbvvetxhvgisrvlc`). Authenticated users can browse recent rows in `public.sdt_event_log` and emit test events through the `@sdt/events` client.

## Prerequisites

- Node.js 20+
- Supabase CLI (for migrations)
- A Supabase Auth user on the Delivery project (email/password)

## Setup

1. Clone and install:

   ```bash
   npm install
   ```

2. Configure env (never commit secrets):

   ```bash
   cp .env.example .env.local
   ```

   Set `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's **publishable (anon) key** from the Supabase dashboard.

3. Apply database migration (Delivery owns this database):

   ```bash
   supabase link --project-ref gyjkqbvvetxhvgisrvlc
   supabase db push
   ```

   Migration file: `supabase/migrations/20261111190000_sdt_event_log.sql` — append-only `sdt_event_log` with RLS allowing `authenticated` `SELECT` and `INSERT`.

## Development

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

## Build

```bash
npm run build
```

Builds `@sdt/events` in `packages/sdt-events` and the Vue app to `dist/`.

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | Vue 3 + TypeScript UI (sign-in, activity table, emit form) |
| `packages/sdt-events/` | Thin SDK: `createSdtEventsClient`, `emit`, `list` |
| `supabase/migrations/` | `sdt_event_log` schema and RLS |

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | `https://gyjkqbvvetxhvgisrvlc.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (browser-safe) |

Do not use the `service_role` key in this app.
