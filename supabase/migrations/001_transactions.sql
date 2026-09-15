--create extension if not exists "pgcrypto";

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create index transactions_user_id_created_at_idx
  on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "Users select own transactions"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own transactions"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own transactions"
  on public.transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own transactions"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- No policies for anon; service role bypasses RLS for /api/expenses only.
