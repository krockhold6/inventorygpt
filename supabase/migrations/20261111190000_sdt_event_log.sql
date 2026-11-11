-- SDT-Events append-only event log (Delivery project gyjkqbvvetxhvgisrvlc)
create table public.sdt_event_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  type text not null,
  source text not null,
  subject_id text,
  correlation_id uuid,
  payload jsonb not null default '{}'::jsonb,
  schema_version int not null default 1
);

alter table public.sdt_event_log enable row level security;

create policy "sdt_event_log_select_authenticated"
  on public.sdt_event_log
  for select
  to authenticated
  using (true);

create policy "sdt_event_log_insert_authenticated"
  on public.sdt_event_log
  for insert
  to authenticated
  with check (true);

create index sdt_event_log_occurred_at_idx
  on public.sdt_event_log (occurred_at desc);

create index sdt_event_log_type_idx
  on public.sdt_event_log (type);

create index sdt_event_log_correlation_id_idx
  on public.sdt_event_log (correlation_id)
  where correlation_id is not null;
