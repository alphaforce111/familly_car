create extension if not exists pgcrypto;

create table if not exists public.car_reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_date date not null unique,
  reserved_by text not null,
  previous_reserved_by text,
  takeover_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_car_reservations_updated_at on public.car_reservations;

create trigger set_car_reservations_updated_at
before update on public.car_reservations
for each row
execute function public.set_updated_at();

alter table public.car_reservations enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.car_reservations to anon;

drop policy if exists "Allow public read reservations" on public.car_reservations;
drop policy if exists "Allow public create reservations" on public.car_reservations;
drop policy if exists "Allow public update reservations" on public.car_reservations;
drop policy if exists "Allow public delete reservations" on public.car_reservations;

create policy "Allow public read reservations"
on public.car_reservations
for select
to anon
using (true);

create policy "Allow public create reservations"
on public.car_reservations
for insert
to anon
with check (true);

create policy "Allow public update reservations"
on public.car_reservations
for update
to anon
using (true)
with check (true);

create policy "Allow public delete reservations"
on public.car_reservations
for delete
to anon
using (true);

notify pgrst, 'reload schema';
