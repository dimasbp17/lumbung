-- =============================================================================
-- Fill in missing defaults (settings, members, cash wallet, default categories)
-- for accounts that existed before the schema reset, i.e. accounts the
-- on_auth_user_created trigger never ran for.
--
-- Safe to run more than once: each group is only inserted for accounts that
-- have no rows of that kind yet, so nothing is duplicated.
-- Run in the Supabase SQL Editor.
-- =============================================================================

-- 0) Check first: how many rows does each account have?
select
  u.email,
  (select count(*) from public.settings s where s.user_id = u.id)   as settings,
  (select count(*) from public.members m where m.user_id = u.id)    as members,
  (select count(*) from public.wallets w where w.user_id = u.id)    as wallets,
  (select count(*) from public.categories c where c.user_id = u.id) as categories
from auth.users u
order by u.created_at;

-- 1) Settings
insert into public.settings (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

-- 2) Members
insert into public.members (user_id, name, color)
select u.id, d.name, d.color
from auth.users u
cross join (values ('Suami', '#2563eb'), ('Istri', '#db2777')) as d(name, color)
where not exists (select 1 from public.members m where m.user_id = u.id);

-- 3) Cash wallet
insert into public.wallets (user_id, name, type, icon, color, initial_balance)
select u.id, 'Dompet Tunai', 'cash', 'banknote', '#16a34a', 0
from auth.users u
where not exists (select 1 from public.wallets w where w.user_id = u.id);

-- 4) Default categories (same list as setup_new_account)
insert into public.categories (user_id, name, type, icon, color, sort_order)
select u.id, d.name, d.type::public.category_type, d.icon, d.color, d.sort_order
from auth.users u
cross join (values
  ('Makan & Minum',        'expense', 'utensils',        '#f97316', 1),
  ('Belanja Dapur',        'expense', 'shopping-basket', '#84cc16', 2),
  ('Transportasi',         'expense', 'car',             '#0ea5e9', 3),
  ('Listrik & Air',        'expense', 'zap',             '#eab308', 4),
  ('Internet & Pulsa',     'expense', 'wifi',            '#6366f1', 5),
  ('Pendidikan',           'expense', 'graduation-cap',  '#8b5cf6', 6),
  ('Kesehatan',            'expense', 'heart-pulse',     '#ef4444', 7),
  ('Cicilan',              'expense', 'credit-card',     '#64748b', 8),
  ('Arisan',               'expense', 'users',           '#14b8a6', 9),
  ('Zakat/Sedekah/Donasi', 'expense', 'hand-heart',      '#22c55e', 10),
  ('Hiburan',              'expense', 'clapperboard',    '#ec4899', 11),
  ('Pakaian',              'expense', 'shirt',           '#a855f7', 12),
  ('Kebutuhan Anak',       'expense', 'baby',            '#f59e0b', 13),
  ('Lain-lain',            'expense', 'package',         '#78716c', 14),
  ('Gaji',                 'income',  'briefcase',       '#16a34a', 1),
  ('Usaha',                'income',  'store',           '#0891b2', 2),
  ('Bonus/THR',            'income',  'sparkles',        '#ca8a04', 3),
  ('Hadiah',               'income',  'gift',            '#db2777', 4),
  ('Lain-lain',            'income',  'package',         '#78716c', 5)
) as d(name, type, icon, color, sort_order)
where not exists (select 1 from public.categories c where c.user_id = u.id);
