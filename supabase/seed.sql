-- Sample data for local / staging (no secrets). Run after schema migration.
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
