-- =============================================================================
-- Lumbung — initial schema
-- Entities: settings, members, wallets, categories, transactions
-- All amounts are stored as BIGINT (Rupiah, no decimals).
-- Every table has a user_id column and is protected by Row Level Security.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
create type public.wallet_type as enum ('cash', 'bank', 'ewallet', 'other');
create type public.category_type as enum ('income', 'expense');
create type public.transaction_type as enum ('income', 'expense', 'transfer');

-- -----------------------------------------------------------------------------
-- Helper: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Account settings (one row per account)
-- -----------------------------------------------------------------------------
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- Day of month the monthly period starts (e.g. 25 = payday).
  -- Limited to 1..28 so it exists in every month.
  period_start_day smallint not null default 1
    check (period_start_day between 1 and 28),
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Family members (husband, wife, ...)
-- -----------------------------------------------------------------------------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  color text not null default '#0ea5e9',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Target of composite foreign keys so references cannot cross accounts.
  unique (id, user_id)
);

create index members_user_idx on public.members (user_id);

create trigger members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Wallets (sources of funds)
-- -----------------------------------------------------------------------------
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  type public.wallet_type not null default 'cash',
  icon text not null default 'wallet',
  color text not null default '#16a34a',
  initial_balance bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index wallets_user_idx on public.wallets (user_id);

create trigger wallets_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  type public.category_type not null,
  icon text not null default 'package',
  color text not null default '#64748b',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index categories_user_idx on public.categories (user_id);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Transactions
-- -----------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.transaction_type not null,
  amount bigint not null check (amount > 0),
  date date not null,
  category_id uuid,
  wallet_id uuid not null,
  -- Transfers only: the receiving wallet.
  to_wallet_id uuid,
  note text check (note is null or length(note) <= 200),
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Composite foreign keys: referenced rows must belong to the same account.
  constraint transactions_category_fk foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  constraint transactions_wallet_fk foreign key (wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict,
  constraint transactions_to_wallet_fk foreign key (to_wallet_id, user_id)
    references public.wallets (id, user_id) on delete restrict,
  constraint transactions_recorded_by_fk foreign key (recorded_by, user_id)
    references public.members (id, user_id) on delete set null (recorded_by),

  -- Transfer: requires a (different) destination wallet and no category.
  -- Income/expense: requires a category and no destination wallet.
  constraint transactions_valid_shape check (
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

create index transactions_user_date_idx on public.transactions (user_id, date desc, created_at desc);
create index transactions_category_idx on public.transactions (category_id);
create index transactions_wallet_idx on public.transactions (wallet_id);
create index transactions_to_wallet_idx on public.transactions (to_wallet_id);
create index transactions_recorded_by_idx on public.transactions (recorded_by);

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- The category type must match the transaction type.
-- The exception message is shown to the user as-is, so it stays in Indonesian.
create or replace function public.check_transaction_category_type()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_type public.category_type;
begin
  if new.category_id is not null then
    select c.type into v_type from public.categories c where c.id = new.category_id;
    if v_type::text <> new.type::text then
      raise exception 'Jenis kategori tidak sesuai dengan jenis transaksi.'
        using errcode = 'check_violation', hint = 'category_type_mismatch';
    end if;
  end if;
  return new;
end;
$$;

create trigger transactions_check_category_type
  before insert or update on public.transactions
  for each row execute function public.check_transaction_category_type();

-- -----------------------------------------------------------------------------
-- Wallet balances view (computed from transactions)
-- security_invoker = true → RLS of the underlying tables still applies.
-- -----------------------------------------------------------------------------
create view public.wallet_balances
with (security_invoker = true)
as
select
  w.id as wallet_id,
  w.user_id,
  w.initial_balance
    + coalesce(sum(case
        when t.type = 'income' and t.wallet_id = w.id then t.amount
        when t.type = 'expense' and t.wallet_id = w.id then -t.amount
        when t.type = 'transfer' and t.wallet_id = w.id then -t.amount
        when t.type = 'transfer' and t.to_wallet_id = w.id then t.amount
        else 0
      end), 0)::bigint as balance
from public.wallets w
left join public.transactions t
  on t.user_id = w.user_id
  and (t.wallet_id = w.id or t.to_wallet_id = w.id)
group by w.id, w.user_id, w.initial_balance;

-- -----------------------------------------------------------------------------
-- Row Level Security: users can only access their own rows
-- -----------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.members enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "own settings" on public.settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own members" on public.members
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own wallets" on public.wallets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own categories" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own transactions" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Data API privileges (explicit, independent of Supabase's
-- "Grant API access to new tables automatically" option).
-- anon (signed out) gets no access at all; authenticated is still
-- restricted by the RLS policies above.
-- -----------------------------------------------------------------------------
revoke all on
  public.settings, public.members, public.wallets,
  public.categories, public.transactions, public.wallet_balances
from anon, authenticated;

grant select, insert, update, delete on
  public.settings, public.members, public.wallets,
  public.categories, public.transactions
to authenticated;

grant select on public.wallet_balances to authenticated;

-- -----------------------------------------------------------------------------
-- Defaults for a new account: settings, members, cash wallet, default categories.
-- Names below are user-facing, so they are in Indonesian.
-- -----------------------------------------------------------------------------
create or replace function public.setup_new_account(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.settings (user_id) values (p_user)
  on conflict (user_id) do nothing;

  insert into public.members (user_id, name, color) values
    (p_user, 'Suami', '#2563eb'),
    (p_user, 'Istri', '#db2777');

  insert into public.wallets (user_id, name, type, icon, color, initial_balance) values
    (p_user, 'Dompet Tunai', 'cash', 'banknote', '#16a34a', 0);

  insert into public.categories (user_id, name, type, icon, color, sort_order) values
    (p_user, 'Makan & Minum',          'expense', 'utensils',        '#f97316', 1),
    (p_user, 'Belanja Dapur',          'expense', 'shopping-basket', '#84cc16', 2),
    (p_user, 'Transportasi',           'expense', 'car',             '#0ea5e9', 3),
    (p_user, 'Listrik & Air',          'expense', 'zap',             '#eab308', 4),
    (p_user, 'Internet & Pulsa',       'expense', 'wifi',            '#6366f1', 5),
    (p_user, 'Pendidikan',             'expense', 'graduation-cap',  '#8b5cf6', 6),
    (p_user, 'Kesehatan',              'expense', 'heart-pulse',     '#ef4444', 7),
    (p_user, 'Cicilan',                'expense', 'credit-card',     '#64748b', 8),
    (p_user, 'Arisan',                 'expense', 'users',           '#14b8a6', 9),
    (p_user, 'Zakat/Sedekah/Donasi',   'expense', 'hand-heart',      '#22c55e', 10),
    (p_user, 'Hiburan',                'expense', 'clapperboard',    '#ec4899', 11),
    (p_user, 'Pakaian',                'expense', 'shirt',           '#a855f7', 12),
    (p_user, 'Kebutuhan Anak',         'expense', 'baby',            '#f59e0b', 13),
    (p_user, 'Lain-lain',              'expense', 'package',         '#78716c', 14),
    (p_user, 'Gaji',                   'income',  'briefcase',       '#16a34a', 1),
    (p_user, 'Usaha',                  'income',  'store',           '#0891b2', 2),
    (p_user, 'Bonus/THR',              'income',  'sparkles',        '#ca8a04', 3),
    (p_user, 'Hadiah',                 'income',  'gift',            '#db2777', 4),
    (p_user, 'Lain-lain',              'income',  'package',         '#78716c', 5);
end;
$$;

revoke execute on function public.setup_new_account(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.setup_new_account(new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
