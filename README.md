# South Dayton Toyota Delivery — Programs

Staff sign up for dealership **programs** (scheduled happenings). Organizers manage programs, eligibility by dealership, and registration rosters.

**Stack:** React, Vite, TypeScript, [shadcn/ui](https://ui.shadcn.com), Supabase (Auth + Postgres + RLS).

**Supabase project:** `gyjkqbvvetxhvgisrvlc` (South Dayton Toyota — Delivery).

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set:

   - `VITE_SUPABASE_URL` — project URL from the Supabase dashboard
   - `VITE_SUPABASE_ANON_KEY` — publishable (anon) key — not the service role secret

3. **Database**

   Apply migrations to the linked Supabase project:

   ```bash
   npx supabase link --project-ref gyjkqbvvetxhvgisrvlc
   npx supabase db push
   ```

   Migration `supabase/migrations/20261111210000_sdt_programs_schema.sql` creates dealerships, profiles, memberships, programs, registrations, signup trigger, and RLS policies.

   **No CLI access?** Paste and run `supabase/one_time_apply.sql` in the [Supabase SQL Editor](https://supabase.com/dashboard/project/gyjkqbvvetxhvgisrvlc/sql/new) (schema + sample seed). Or apply the migration then `supabase/seed.sql` separately.

4. **Seed data (optional)**

   In the SQL editor, add dealerships and assign users via `dealership_memberships`. Set `profiles.is_platform_admin = true` for platform admins, or use `dealership_admin` membership roles.

5. **Run locally**

   ```bash
   npm run dev
   ```

## Routes

| Path | Description |
|------|-------------|
| `/auth` | Sign in / sign up |
| `/` | Published programs you are eligible to see |
| `/programs/:slug` | Program detail and signup |
| `/admin/programs` | Admin program list |
| `/admin/programs/new` | Create program |
| `/admin/programs/:id` | Edit program + dealership eligibility |
| `/admin/programs/:id/registrations` | Registration roster |

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build (must pass in CI)
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript

## Roles (RLS)

- **Platform admin** — `profiles.is_platform_admin`; full program and roster access
- **Dealership admin** — `dealership_memberships.role = dealership_admin`; programs linked to their dealerships (or they created) plus rosters
- **Member** — view eligible published programs and register

Do not commit `.env.local` or any Supabase service role keys.
