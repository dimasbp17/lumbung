# Lumbung

Aplikasi pencatatan keuangan keluarga: pemasukan, pengeluaran, dompet, dan (nanti) anggaran serta tabungan.
Satu akun dipakai bersama oleh suami dan istri; setiap transaksi mencatat siapa yang mencatatnya.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Base UI) · TanStack Query · Supabase (Auth + PostgreSQL) · pnpm

---

## Menjalankan aplikasi

### 1. Pasang dependensi

```bash
pnpm install
```

### 2. Siapkan Supabase

Pilih salah satu:

**A. Project Supabase online (paling mudah)**

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, lalu jalankan **semua** file di `supabase/migrations/` satu per satu,
   **urut berdasarkan nama file** (nama diawali tanggal). Setiap ada file migrasi baru,
   jalankan file itu saja.

   > **Sudah pernah menjalankan migrasi lama (nama tabel berbahasa Indonesia)?**
   > Skema sudah diganti ke nama berbahasa Inggris dan **semua data aplikasi ikut terhapus**.
   > Jalankan berurutan di SQL Editor:
   > 1. `supabase/snippets/reset_old_schema.sql` — menghapus skema lama (akun login tetap ada)
   > 2. `supabase/migrations/20261125000000_initial_schema.sql`
   > 3. `supabase/snippets/fill_missing_defaults.sql` — menyiapkan profil, Dompet Tunai,
   >    kategori bawaan, dan pengaturan untuk akun yang sudah ada (aman dijalankan berulang;
   >    atau cukup daftar akun baru)
3. Di **Authentication → URL Configuration**, isi *Site URL* dengan `http://localhost:5173`
   dan tambahkan `http://localhost:5173/reset-password` ke *Redirect URLs*
   (dibutuhkan untuk konfirmasi email dan reset password).
4. Ambil URL project dan **publishable key** (`sb_publishable_...`) dari **Project Settings → API Keys**.

**B. Supabase lokal (butuh Docker)**

```bash
pnpm dlx supabase init      # sekali saja, membuat supabase/config.toml
pnpm dlx supabase start     # menjalankan Supabase + migrasi + seed.sql
```

URL dan key ditampilkan di output `supabase start`. Email konfirmasi/reset bisa dilihat
di Inbucket/Mailpit (`http://localhost:54324`).

### 3. Isi `.env`

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> Nama lama `VITE_SUPABASE_ANON_KEY` tetap didukung. Setiap kali `.env` diubah,
> hentikan dan jalankan ulang `pnpm dev`.

### 4. Jalankan

```bash
pnpm dev        # http://localhost:5173
pnpm build      # build produksi (typecheck + bundle)
pnpm lint
pnpm guide:pdf  # buat ulang buku panduan PDF (butuh Chrome/Edge terpasang)
```

### Akun demo (Supabase lokal)

`seed.sql` membuat akun `demo@lumbung.test` / `lumbung123` yang masih kosong
(profil, Dompet Tunai, dan kategori bawaan sudah tersedia). Untuk Supabase online,
cukup daftar akun baru.

---

## Fitur

### ✅ Fase 1 — MVP (selesai)

- **Akun & profil keluarga**
  - Daftar, masuk, dan lupa password (reset lewat email)
  - Akun baru otomatis mendapat profil *Suami* & *Istri*, dompet *Dompet Tunai*, dan kategori bawaan
  - Profil anggota bisa ditambah/diubah/dihapus (nama + warna avatar)
  - "Dicatat oleh" pada setiap transaksi; profil terakhir diingat per perangkat
  - Data tiap akun terisolasi dengan Row Level Security
- **Dompet**: Tunai, Rekening Bank, E-Wallet, Lainnya — nama, ikon, warna, saldo awal;
  saldo dihitung otomatis; transfer antar dompet tidak dihitung sebagai pemasukan/pengeluaran
- **Transaksi**: pemasukan, pengeluaran, transfer; tambah/ubah/hapus (dengan konfirmasi);
  dikelompokkan per tanggal dengan total harian; navigasi per periode;
  tombol tambah selalu terlihat (tombol melayang di HP, tombol di sidebar di desktop)
- **Kategori**: 14 kategori pengeluaran & 5 kategori pemasukan bawaan; bisa ditambah, diubah
  (nama, ikon, warna), dan dinonaktifkan
- **Landing page** (`/`): perkenalan aplikasi; tombolnya berubah menjadi "Buka Beranda" jika sudah masuk
- **Top bar**: judul halaman di kiri; menu profil di kanan (ganti profil perangkat, Pengaturan, Halaman depan, Keluar)
- **Beranda** (`/beranda`): total saldo, ringkasan periode (pemasukan, pengeluaran, selisih),
  grafik donut pengeluaran per kategori, 5 transaksi terakhir
- **Pengaturan**: format `Rp 1.500.000`, tanggal awal periode bulanan (1–28, misal tanggal gajian),
  mode terang/gelap/ikuti HP

### ✅ Fase 2 — Pengelolaan lanjutan (selesai)

- **Anggaran** (`/anggaran`): batas belanja per kategori pengeluaran, berlaku setiap periode;
  progres terpakai/sisa, tanda "Hampir habis" (≥ 80%) dan "Terlampaui"; ringkasan di Beranda
- **Tujuan tabungan** (`/tabungan`): target dana & tanggal, setoran/penarikan dengan riwayat,
  saran nominal per bulan; setoran bisa diambil dari dompet (saldo dompet ikut menyesuaikan)
- **Tagihan rutin & transaksi berulang** (`/tagihan`): mingguan/bulanan/tahunan (setiap N),
  tanggal berakhir opsional; dikelompokkan jatuh tempo / 7 hari / akan datang; tombol **Catat**
  (nominal bisa disesuaikan) dan **Lewati**; tagihan terdekat tampil di Beranda.
  Tagihan tidak tercatat otomatis — pengguna yang menekan "Catat".
- **Utang-piutang** (`/utang`): utang (kami meminjam) dan piutang (kami meminjamkan), jatuh tempo,
  cicilan pembayaran sampai lunas; bisa dikaitkan ke dompet
- **Pencarian & filter transaksi**: cari catatan/nama kategori; filter jenis, kategori, dompet,
  pencatat, dan waktu (per periode, semua waktu, atau rentang tanggal)
- Menu **Lainnya** (`/lainnya`) di HP untuk fitur yang tidak muat di dock bawah

### ⏳ Fase 3 — Laporan & pelengkap (belum)

Laporan bulanan/tahunan, ekspor CSV/Excel/PDF, backup & restore, foto struk, kunci PIN, log aktivitas.

---

## Catatan teknis

- **Nominal** disimpan sebagai `bigint` (Rupiah, tanpa desimal) dan wajib `> 0`.
- **Tanggal** transaksi bertipe `date`; "hari ini" dihitung dalam zona **Asia/Jakarta (WIB)**.
- **Keamanan data:** semua tabel memakai RLS `user_id = auth.uid()`. Foreign key komposit
  `(id, user_id)` memastikan transaksi tidak bisa merujuk dompet/kategori/profil milik akun lain.
  View `wallet_balances` memakai `security_invoker` sehingga RLS tetap berlaku.
- **Saldo dompet** = saldo awal + pemasukan − pengeluaran ± transfer − setoran tabungan
  (+ penarikan) + utang diterima − pembayaran utang − piutang diberikan + piutang diterima,
  tetapi hanya untuk catatan tabungan/utang yang memilih dompet.
- **Tagihan rutin**: jadwal berikutnya dihitung dari tanggal acuan (`start_date`) agar tanggal
  akhir bulan tidak bergeser (31 Jan → 28 Feb → 31 Mar). Pencatatan memakai fungsi
  `record_recurring_transaction` sehingga transaksi dan jadwal berikutnya tersimpan bersamaan.
- **Validasi ganda:** di form (pesan berbahasa Indonesia) dan di database (check constraint +
  trigger yang memastikan jenis kategori cocok dengan jenis transaksi).
- **Bahasa:** semua kode (nama file, komponen, variabel, tabel/kolom/enum database, komentar)
  berbahasa Inggris. Hanya teks yang tampil ke pengguna (label, tombol, pesan galat, nama
  kategori bawaan) dan URL halaman (`/beranda`, `/transaksi`, `/dompet`, `/pengaturan`, `/masuk`, …)
  yang berbahasa Indonesia.

## Deploy ke Cloudflare (Workers)

Konfigurasi ada di `wrangler.jsonc`: hasil build `dist/` disajikan sebagai static assets dengan
`not_found_handling = "single-page-application"` (agar `/beranda`, `/transaksi`, … bisa dibuka
langsung) dan URL `workers.dev` aktif.

1. Push repo ke GitHub, lalu di Cloudflare: **Workers & Pages → Create → Import a repository**.
2. Pengaturan build:
   - *Build command*: `pnpm build`
   - *Deploy command*: `npx wrangler deploy`
   - Versi Node diambil dari `.node-version` (22). pnpm terdeteksi otomatis dari `pnpm-lock.yaml`.
3. **Variables** (Settings → Build → Variables and secrets, yaitu variabel saat *build*):
   `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`. Setelah mengubahnya, jalankan ulang
   deploy karena nilainya dibaca saat build.
4. Di **Supabase → Authentication → URL Configuration**: isi *Site URL* dengan URL produksi
   (misal `https://lumbung.<subdomain>.workers.dev`), lalu tambahkan `https://<domain>/reset-password`
   ke *Redirect URLs*.

Catatan:
- Halaman 404 ditangani oleh rute aplikasi (`src/pages/not-found.tsx`); jangan menambahkan `404.html`.
- Header cache & keamanan diatur di `public/_headers` (didukung Workers static assets).
- Jika memakai **Cloudflare Pages** alih-alih Workers, `wrangler.jsonc` tidak dipakai dan routing SPA
  aktif otomatis selama tidak ada `404.html`.

## Buku panduan pengguna

Sumber panduan ada di `docs/user-guide/user-guide.html` (bahasa Indonesia). Setelah mengubahnya,
jalankan `pnpm guide:pdf` untuk membuat ulang `public/downloads/panduan-lumbung.pdf`.
PDF ini bisa diunduh dari landing page dan halaman Pengaturan. **Perbarui panduan setiap ada
fitur baru atau perubahan cara pakai.**

## Struktur folder

```
docs/user-guide/        sumber HTML buku panduan (dicetak ke PDF oleh scripts/build-user-guide.mjs)
public/downloads/       PDF panduan yang bisa diunduh pengguna
supabase/
  migrations/           skema, RLS, trigger akun baru (jalankan urut nama file)
  seed.sql              akun demo kosong untuk Supabase lokal
  snippets/             skrip SQL sekali pakai (misal reset skema lama)
src/
  components/
    ui/                 komponen shadcn
    common/             AmountInput, IconBadge, MemberAvatar, ColorPicker, IconPicker,
                        ConfirmDelete, ResponsiveSheet, Field,
                        status (Loading, EmptyState, ErrorMessage)
    transactions/       TransactionForm, TransactionCard, TransactionList, TransactionFilters,
                        CategoryPicker, WalletPicker, MemberPicker, TransactionAmount
    budgets/ savings/ recurring/ debts/
    wallets/ categories/ members/ home/ period/ layout/
  hooks/                akses data per entitas (TanStack Query + Supabase)
  lib/                  supabase client, format Rupiah & tanggal, periode, ikon, pesan error,
                        kunci localStorage
  pages/                landing, home, transactions, budgets, savings, recurring, debts, more, wallets, settings, categories, auth/*
  providers/            auth, tema, form transaksi global
  types/                tipe entitas
```
