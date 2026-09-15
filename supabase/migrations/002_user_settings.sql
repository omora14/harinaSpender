-- Per-user settings (starting cash balance for cash-on-hand calculations)

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  starting_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users select own settings"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own settings"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own settings"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_user_settings_updated_at();
