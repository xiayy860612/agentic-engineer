-- Run this if /instruments shows empty but the table has rows in the dashboard.
-- SQL Editor runs as superuser and bypasses RLS, so data can exist while the API returns [].

grant select on public.instruments to anon, authenticated;

drop policy if exists "public can read instruments" on public.instruments;

create policy "public can read instruments"
on public.instruments
for select
to anon, authenticated
using (true);
