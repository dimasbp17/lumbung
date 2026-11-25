-- =============================================================================
-- Lumbung — Phase 2: budgets, savings goals, recurring transactions (bills),
-- debts & receivables.
--
-- Conventions (same as the initial schema):
--   * amounts are BIGINT Rupiah, user_id defaults to auth.uid(), RLS everywhere
--   * composite foreign keys (id, user_id) keep references inside one account
--   * errors meant for the user are raised with hint = 'user_message'; the app
--     shows their (Indonesian) message as-is
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Budgets: a spending limit per expense category, applied to every period
-- -----------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One budget per category.
  unique (user_id, category_id),
  constraint budgets_category_fk foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete cascade
);

create index budgets_category_idx on public.budgets (category_id);

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create or replace function public.check_budget_category_type()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select c.type from public.categories c where c.id = new.category_id) <> 'expense' then
    raise exception 'Anggaran hanya bisa dibuat untuk kategori pengeluaran.'
      using errcode = 'check_violation', hint = 'user_message';
  end if;
  return new;
end;
$$;

create trigger budgets_check_category_type
  before insert or update on public.budgets
  for each row execute function public.check_budget_category_type();

-- -----------------------------------------------------------------------------
-- Savings goals and their entries (deposits > 0, withdrawals < 0)
-- -----------------------------------------------------------------------------
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  target_amount bigint not null check (target_amount > 0),
  target_date date,
  icon text not null default 'piggy-bank',
  color text not null default '#0891b2',
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index savings_goals_user_idx on public.savings_goals (user_id);

create trigger savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null,
  -- Positive = deposit, negative = withdrawal.
  amount bigint not null check (amount <> 0),
  date date not null,
  -- Optional: the wallet the money is taken from (deposit) or returned to (withdrawal).
  wallet_id uuid,
  note text check (note is null or length(note) <= 200),
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_entries_goal_fk foreign key (goal_id, user_id)
    references public.savings_goals (id, user_id) on delete cascade,
  constraint savings_entries_wallet_fk foreign key (wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict,
  constraint savings_entries_recorded_by_fk foreign key (recorded_by, user_id)
    references public.members (id, user_id) on delete set null (recorded_by)
);

create index savings_entries_goal_idx on public.savings_entries (goal_id, date desc);
create index savings_entries_wallet_idx on public.savings_entries (wallet_id);
create index savings_entries_recorded_by_idx on public.savings_entries (recorded_by);

create trigger savings_entries_updated_at
  before update on public.savings_entries
  for each row execute function public.set_updated_at();

create view public.savings_goal_totals
with (security_invoker = true)
as
select
  g.id as goal_id,
  g.user_id,
  coalesce(sum(e.amount), 0)::bigint as saved
from public.savings_goals g
left join public.savings_entries e on e.goal_id = g.id and e.user_id = g.user_id
group by g.id, g.user_id;

-- -----------------------------------------------------------------------------
-- Recurring transactions (routine bills, salary, monthly transfers, ...)
-- -----------------------------------------------------------------------------
create type public.recurrence_frequency as enum ('weekly', 'monthly', 'yearly');

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  type public.transaction_type not null,
  amount bigint not null check (amount > 0),
  category_id uuid,
  wallet_id uuid not null,
  to_wallet_id uuid,
  note text check (note is null or length(note) <= 200),
  frequency public.recurrence_frequency not null default 'monthly',
  -- Every N weeks/months/years.
  interval_count smallint not null default 1 check (interval_count between 1 and 12),
  -- First due date; later dates are computed from it so month-ends don't drift.
  start_date date not null,
  next_date date not null,
  end_date date check (end_date is null or end_date >= start_date),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint recurring_category_fk foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  constraint recurring_wallet_fk foreign key (wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict,
  constraint recurring_to_wallet_fk foreign key (to_wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict,
  constraint recurring_valid_shape check (
    (type = 'transfer'
      and category_id is null
      and to_wallet_id is not null
      and to_wallet_id <> wallet_id)
    or
    (type <> 'transfer'
      and category_id is not null
      and to_wallet_id is null)
  )
);

create index recurring_user_next_idx on public.recurring_transactions (user_id, next_date);
create index recurring_category_idx on public.recurring_transactions (category_id);
create index recurring_wallet_idx on public.recurring_transactions (wallet_id);
create index recurring_to_wallet_idx on public.recurring_transactions (to_wallet_id);

create trigger recurring_transactions_updated_at
  before update on public.recurring_transactions
  for each row execute function public.set_updated_at();

-- Same columns (type, category_id) as transactions, so the same check applies.
create trigger recurring_transactions_check_category_type
  before insert or update on public.recurring_transactions
  for each row execute function public.check_transaction_category_type();

-- The first occurrence (start + k * step, k >= 0) strictly after p_after.
create or replace function public.next_recurrence_date(
  p_start date,
  p_frequency public.recurrence_frequency,
  p_interval integer,
  p_after date
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  k integer := 0;
  d date := p_start;
begin
  while d <= p_after loop
    k := k + 1;
    d := case p_frequency
      when 'weekly' then p_start + k * 7 * p_interval
      when 'monthly' then (p_start + make_interval(months => k * p_interval))::date
      else (p_start + make_interval(years => k * p_interval))::date
    end;
  end loop;
  return d;
end;
$$;

-- Records the current occurrence as a real transaction and moves next_date on.
-- security invoker: RLS still decides what the caller may read and write.
create or replace function public.record_recurring_transaction(
  p_id uuid,
  p_date date,
  p_amount bigint default null,
  p_recorded_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.recurring_transactions;
  v_id uuid;
begin
  select * into r from public.recurring_transactions where id = p_id for update;
  if not found then
    raise exception 'Tagihan tidak ditemukan.' using hint = 'user_message';
  end if;

  insert into public.transactions
    (type, amount, date, category_id, wallet_id, to_wallet_id, note, recorded_by)
  values
    (r.type, coalesce(p_amount, r.amount), p_date, r.category_id, r.wallet_id,
     r.to_wallet_id, coalesce(nullif(trim(r.note), ''), r.name), p_recorded_by)
  returning id into v_id;

  update public.recurring_transactions
    set next_date = public.next_recurrence_date(start_date, frequency, interval_count, next_date)
    where id = p_id;

  return v_id;
end;
$$;

-- Skips the current occurrence without recording a transaction.
create or replace function public.skip_recurring_transaction(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.recurring_transactions
    set next_date = public.next_recurrence_date(start_date, frequency, interval_count, next_date)
    where id = p_id;
  if not found then
    raise exception 'Tagihan tidak ditemukan.' using hint = 'user_message';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Debts (we owe someone) and receivables (someone owes us)
-- -----------------------------------------------------------------------------
create type public.debt_direction as enum ('payable', 'receivable');

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  direction public.debt_direction not null,
  person_name text not null check (length(trim(person_name)) between 1 and 60),
  amount bigint not null check (amount > 0),
  date date not null,
  due_date date,
  -- Optional: the wallet that received (payable) or paid out (receivable) the money.
  wallet_id uuid,
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint debts_wallet_fk foreign key (wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict
);

create index debts_user_idx on public.debts (user_id, direction);
create index debts_wallet_idx on public.debts (wallet_id);

create trigger debts_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  debt_id uuid not null,
  amount bigint not null check (amount > 0),
  date date not null,
  -- Optional: the wallet the payment leaves (payable) or arrives in (receivable).
  wallet_id uuid,
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debt_payments_debt_fk foreign key (debt_id, user_id)
    references public.debts (id, user_id) on delete cascade,
  constraint debt_payments_wallet_fk foreign key (wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict
);

create index debt_payments_debt_idx on public.debt_payments (debt_id, date desc);
create index debt_payments_wallet_idx on public.debt_payments (wallet_id);

create trigger debt_payments_updated_at
  before update on public.debt_payments
  for each row execute function public.set_updated_at();

-- Payments may not exceed the debt amount.
create or replace function public.check_debt_payment_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_amount bigint;
  v_paid bigint;
begin
  select d.amount into v_amount from public.debts d where d.id = new.debt_id;
  select coalesce(sum(p.amount), 0) into v_paid
    from public.debt_payments p
    where p.debt_id = new.debt_id and p.id <> new.id;
  if v_paid + new.amount > v_amount then
    raise exception 'Pembayaran melebihi sisa yang belum dibayar.'
      using errcode = 'check_violation', hint = 'user_message';
  end if;
  return new;
end;
$$;

create trigger debt_payments_check_total
  before insert or update on public.debt_payments
  for each row execute function public.check_debt_payment_total();

-- The debt amount may not drop below what has already been paid.
create or replace function public.check_debt_amount_covers_payments()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.amount < (select coalesce(sum(p.amount), 0) from public.debt_payments p where p.debt_id = new.id) then
    raise exception 'Nominal tidak boleh lebih kecil dari jumlah yang sudah dibayar.'
      using errcode = 'check_violation', hint = 'user_message';
  end if;
  return new;
end;
$$;

create trigger debts_check_amount
  before update of amount on public.debts
  for each row execute function public.check_debt_amount_covers_payments();

create view public.debt_totals
with (security_invoker = true)
as
select
  d.id as debt_id,
  d.user_id,
  coalesce(sum(p.amount), 0)::bigint as paid
from public.debts d
left join public.debt_payments p on p.debt_id = d.id and p.user_id = d.user_id
group by d.id, d.user_id;

-- -----------------------------------------------------------------------------
-- Wallet balances now also include savings entries and debts that name a wallet
-- -----------------------------------------------------------------------------
create or replace view public.wallet_balances
with (security_invoker = true)
as
with movements as (
  select t.wallet_id, t.user_id,
         case when t.type = 'income' then t.amount else -t.amount end as delta
    from public.transactions t
  union all
  select t.to_wallet_id, t.user_id, t.amount
    from public.transactions t
    where t.type = 'transfer'
  union all
  -- Deposit takes money out of the wallet; withdrawal puts it back.
  select e.wallet_id, e.user_id, -e.amount
    from public.savings_entries e
    where e.wallet_id is not null
  union all
  -- Borrowing brings money in; lending sends it out.
  select d.wallet_id, d.user_id,
         case when d.direction = 'payable' then d.amount else -d.amount end
    from public.debts d
    where d.wallet_id is not null
  union all
  -- Paying a debt sends money out; being repaid brings it in.
  select p.wallet_id, p.user_id,
         case when d.direction = 'payable' then -p.amount else p.amount end
    from public.debt_payments p
    join public.debts d on d.id = p.debt_id
    where p.wallet_id is not null
)
select
  w.id as wallet_id,
  w.user_id,
  (w.initial_balance + coalesce(sum(m.delta), 0))::bigint as balance
from public.wallets w
left join movements m on m.wallet_id = w.id and m.user_id = w.user_id
group by w.id, w.user_id, w.initial_balance;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_entries enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

create policy "own budgets" on public.budgets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own savings goals" on public.savings_goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own savings entries" on public.savings_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own recurring transactions" on public.recurring_transactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own debts" on public.debts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own debt payments" on public.debt_payments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Data API privileges
-- -----------------------------------------------------------------------------
revoke all on
  public.budgets, public.savings_goals, public.savings_entries,
  public.recurring_transactions, public.debts, public.debt_payments,
  public.savings_goal_totals, public.debt_totals
from anon, authenticated;

grant select, insert, update, delete on
  public.budgets, public.savings_goals, public.savings_entries,
  public.recurring_transactions, public.debts, public.debt_payments
to authenticated;

grant select on public.savings_goal_totals, public.debt_totals to authenticated;

revoke execute on function public.next_recurrence_date(date, public.recurrence_frequency, integer, date) from public, anon;
revoke execute on function public.record_recurring_transaction(uuid, date, bigint, uuid) from public, anon;
revoke execute on function public.skip_recurring_transaction(uuid) from public, anon;
grant execute on function public.next_recurrence_date(date, public.recurrence_frequency, integer, date) to authenticated;
grant execute on function public.record_recurring_transaction(uuid, date, bigint, uuid) to authenticated;
grant execute on function public.skip_recurring_transaction(uuid) to authenticated;
