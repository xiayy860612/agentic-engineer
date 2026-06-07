-- Quickstart sample: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
-- Run in Supabase SQL Editor before visiting /instruments

create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

insert into instruments (name)
values
  ('violin'),
  ('viola'),
  ('cello');

grant select on public.instruments to anon, authenticated;

alter table instruments enable row level security;

create policy "public can read instruments"
on public.instruments
for select
to anon, authenticated
using (true);
