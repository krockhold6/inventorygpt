-- =============================================================================
-- SDT Programs — one-time apply (Supabase Dashboard → SQL Editor)
-- Project ref: gyjkqbvvetxhvgisrvlc
-- Run once (service role). No secrets in this file.
-- Then sign up at /auth; optional: set profiles.is_platform_admin for admin UI.
-- =============================================================================

-- SDT Programs schema (South Dayton Toyota — Delivery)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
begin
  create type public.membership_role as enum ('member', 'dealership_admin');
exception
  when duplicate_object then null;
end $$;

create table public.dealership_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  role public.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, dealership_id)
);

do $$
begin
  create type public.program_status as enum ('draft', 'published', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.eligibility_mode as enum ('open', 'dealerships');
exception
  when duplicate_object then null;
end $$;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description_md text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  capacity integer,
  status public.program_status not null default 'draft',
  eligibility_mode public.eligibility_mode not null default 'open',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_dealerships (
  program_id uuid not null references public.programs (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  primary key (program_id, dealership_id)
);

create table public.program_registrations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (program_id, user_id)
);

create index program_registrations_program_id_idx on public.program_registrations (program_id);
create index program_dealerships_dealership_id_idx on public.program_dealerships (dealership_id);
create index dealership_memberships_user_id_idx on public.dealership_memberships (user_id);

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists programs_updated_at on public.programs;
create trigger programs_updated_at
  before update on public.programs
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth signup → profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1),
      'User'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions (security definer)
-- ---------------------------------------------------------------------------

create or replace function public.current_user_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.user_admin_dealership_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select dm.dealership_id
  from public.dealership_memberships dm
  where dm.user_id = auth.uid()
    and dm.role = 'dealership_admin';
$$;

create or replace function public.user_dealership_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select dm.dealership_id
  from public.dealership_memberships dm
  where dm.user_id = auth.uid();
$$;

create or replace function public.user_can_admin_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_is_platform_admin()
    or exists (
      select 1
      from public.program_dealerships pd
      where pd.program_id = p_program_id
        and pd.dealership_id in (select public.user_admin_dealership_ids())
    )
    or exists (
      select 1
      from public.programs pr
      where pr.id = p_program_id
        and pr.created_by = auth.uid()
        and exists (
          select 1
          from public.dealership_memberships dm
          where dm.user_id = auth.uid()
            and dm.role = 'dealership_admin'
        )
    );
$$;

create or replace function public.user_eligible_for_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.programs pr
    where pr.id = p_program_id
      and pr.status = 'published'
      and (
        pr.eligibility_mode = 'open'
        or exists (
          select 1
          from public.program_dealerships pd
          where pd.program_id = pr.id
            and pd.dealership_id in (select public.user_dealership_ids())
        )
      )
  );
$$;

create or replace function public.program_visible_to_user(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.programs pr
    where pr.id = p_program_id
      and (
        public.user_can_admin_program(p_program_id)
        or (
          pr.status = 'published'
          and (
            pr.eligibility_mode = 'open'
            or exists (
              select 1
              from public.program_dealerships pd
              where pd.program_id = pr.id
                and pd.dealership_id in (select public.user_dealership_ids())
            )
          )
        )
      )
  );
$$;

revoke all on function public.current_user_is_platform_admin() from public;
revoke all on function public.user_admin_dealership_ids() from public;
revoke all on function public.user_dealership_ids() from public;
revoke all on function public.user_can_admin_program(uuid) from public;
revoke all on function public.user_eligible_for_program(uuid) from public;
revoke all on function public.program_visible_to_user(uuid) from public;

grant execute on function public.current_user_is_platform_admin() to authenticated;
grant execute on function public.user_admin_dealership_ids() to authenticated;
grant execute on function public.user_dealership_ids() to authenticated;
grant execute on function public.user_can_admin_program(uuid) to authenticated;
grant execute on function public.user_eligible_for_program(uuid) to authenticated;
grant execute on function public.program_visible_to_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.dealerships enable row level security;
alter table public.profiles enable row level security;
alter table public.dealership_memberships enable row level security;
alter table public.programs enable row level security;
alter table public.program_dealerships enable row level security;
alter table public.program_registrations enable row level security;

-- dealerships
create policy dealerships_select_authenticated
  on public.dealerships
  for select
  to authenticated
  using (true);

create policy dealerships_manage_platform_admin
  on public.dealerships
  for all
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

-- profiles
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- dealership_memberships
create policy memberships_select_self_or_admin
  on public.dealership_memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_is_platform_admin()
    or dealership_id in (select public.user_admin_dealership_ids())
  );

create policy memberships_manage_platform_admin
  on public.dealership_memberships
  for all
  to authenticated
  using (public.current_user_is_platform_admin())
  with check (public.current_user_is_platform_admin());

create policy memberships_manage_dealership_admin
  on public.dealership_memberships
  for insert
  to authenticated
  with check (
    dealership_id in (select public.user_admin_dealership_ids())
    and role = 'member'
  );

create policy memberships_update_dealership_admin
  on public.dealership_memberships
  for update
  to authenticated
  using (dealership_id in (select public.user_admin_dealership_ids()))
  with check (dealership_id in (select public.user_admin_dealership_ids()));

-- programs
create policy programs_select_visible
  on public.programs
  for select
  to authenticated
  using (public.program_visible_to_user(id));

create policy programs_insert_admin
  on public.programs
  for insert
  to authenticated
  with check (
    public.current_user_is_platform_admin()
    or exists (
      select 1
      from public.dealership_memberships dm
      where dm.user_id = auth.uid()
        and dm.role = 'dealership_admin'
    )
  );

create policy programs_update_admin
  on public.programs
  for update
  to authenticated
  using (public.user_can_admin_program(id))
  with check (public.user_can_admin_program(id));

create policy programs_delete_admin
  on public.programs
  for delete
  to authenticated
  using (public.user_can_admin_program(id));

-- program_dealerships
create policy program_dealerships_select_visible
  on public.program_dealerships
  for select
  to authenticated
  using (public.program_visible_to_user(program_id));

create policy program_dealerships_manage_admin
  on public.program_dealerships
  for all
  to authenticated
  using (public.user_can_admin_program(program_id))
  with check (public.user_can_admin_program(program_id));

-- program_registrations
create policy registrations_select_own_or_admin
  on public.program_registrations
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_can_admin_program(program_id)
  );

create policy registrations_insert_eligible_self
  on public.program_registrations
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_eligible_for_program(program_id)
  );

-- ---------------------------------------------------------------------------
-- Seed sample dealerships + programs
-- ---------------------------------------------------------------------------

-- Supabase Dashboard → SQL Editor, or: supabase db execute --file supabase/seed.sql

insert into public.dealerships (id, name, slug)
values
  ('a1000000-0000-4000-8000-000000000001', 'Dealer A', 'dealer-a'),
  ('a1000000-0000-4000-8000-000000000002', 'Dealer B', 'dealer-b'),
  ('a1000000-0000-4000-8000-00000000000f', 'Dealer F', 'dealer-f')
on conflict (slug) do update set name = excluded.name;

insert into public.programs (
  id,
  title,
  slug,
  description_md,
  starts_at,
  ends_at,
  location,
  capacity,
  status,
  eligibility_mode
)
values
  (
    'b2000000-0000-4000-8000-000000000001',
    'All-Staff Safety Briefing',
    'all-staff-safety-briefing',
    'Monthly safety update for all delivery staff. No registration cap.',
    (now() + interval '14 days'),
    (now() + interval '14 days' + interval '2 hours'),
    'Delivery Center — Training Room',
    null,
    'published',
    'open'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'Dealer Roadshow (A / B / F)',
    'dealer-roadshow-abf',
    'Eligibility limited to Dealer A, B, and F team members.',
    (now() + interval '21 days'),
    null,
    'Main lot',
    40,
    'published',
    'dealerships'
  )
on conflict (slug) do update set
  title = excluded.title,
  description_md = excluded.description_md,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location = excluded.location,
  capacity = excluded.capacity,
  status = excluded.status,
  eligibility_mode = excluded.eligibility_mode;

insert into public.program_dealerships (program_id, dealership_id)
values
  (
    'b2000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-00000000000f'
  )
on conflict (program_id, dealership_id) do nothing;
