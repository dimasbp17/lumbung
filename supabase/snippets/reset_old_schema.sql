-- =============================================================================
-- Remove the old (Indonesian-named) schema from an existing Supabase project.
--
-- Only needed for projects that already ran the old migrations
-- (20261124000000_fase1_skema_awal.sql and 20261124010000_hapus_fitur_data_contoh.sql).
-- WARNING: this deletes ALL app data (transactions, wallets, categories,
-- members, settings). Login accounts in auth.users are kept.
--
-- Steps in the Supabase SQL Editor:
--   1. Run this file.
--   2. Run supabase/migrations/20261125000000_initial_schema.sql.
--   3. Run supabase/snippets/fill_missing_defaults.sql to prepare defaults
--      (members, cash wallet, categories, settings) for accounts that already
--      exist — or simply sign up again with a new account.
-- =============================================================================

drop trigger if exists saat_pengguna_baru on auth.users;

drop function if exists public.isi_data_contoh();
drop function if exists public.buat_data_contoh(uuid);
drop function if exists public.tangani_pengguna_baru();
drop function if exists public.siapkan_akun_baru(uuid);

drop view if exists public.saldo_dompet;

drop table if exists public.transaksi;
drop table if exists public.kategori;
drop table if exists public.dompet;
drop table if exists public.profil_anggota;
drop table if exists public.pengaturan;

drop function if exists public.cek_jenis_kategori_transaksi();

drop type if exists public.jenis_transaksi;
drop type if exists public.jenis_kategori;
drop type if exists public.jenis_dompet;

-- public.set_updated_at() is kept: the new migration redefines it with
-- `create or replace`.
