import { useEffect, useState } from "react"
import { Link } from "react-router"
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarRange,
  Camera,
  DatabaseBackup,
  Download,
  FileText,
  HandCoins,
  LockKeyhole,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Tags,
  Target,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { AnimatedLogo } from "@/components/common/animated-logo"
import { IconBadge } from "@/components/common/icon-badge"
import { MemberAvatar } from "@/components/common/member-avatar"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/format"
import { USER_GUIDE_FILE_NAME, USER_GUIDE_URL } from "@/lib/user-guide"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-context"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Satu akun untuk berdua",
    description:
      "Suami dan istri memakai akun yang sama. Setiap transaksi mencatat siapa yang mencatatnya.",
  },
  {
    icon: Zap,
    title: "Catat dalam hitungan detik",
    description:
      "Tombol catat selalu terlihat. Pilih kategori dengan sekali ketuk, langsung tersimpan.",
  },
  {
    icon: Wallet,
    title: "Saldo dompet otomatis",
    description:
      "Tunai, rekening bank, dan e-wallet. Saldo dihitung sendiri, termasuk transfer dan tarik tunai.",
  },
  {
    icon: CalendarRange,
    title: "Periode ikut tanggal gajian",
    description:
      "Atur awal periode bulanan sesuai tanggal gajian, misalnya tanggal 25 sampai 24 bulan berikutnya.",
  },
  {
    icon: Tags,
    title: "Kategori sesuai kebutuhan",
    description:
      "Sudah tersedia kategori khas keluarga seperti arisan, cicilan, dan zakat. Bisa ditambah dan diubah.",
  },
  {
    icon: ShieldCheck,
    title: "Data tetap milik keluarga",
    description:
      "Setiap akun terpisah dan terlindungi. Hanya keluarga Anda yang bisa melihat catatannya.",
  },
]

const steps = [
  {
    title: "Daftar akun keluarga",
    description: "Profil Suami, Istri, dompet tunai, dan kategori bawaan langsung disiapkan.",
  },
  {
    title: "Atur dompet & periode",
    description: "Tambahkan rekening dan e-wallet beserta saldo awalnya, lalu pilih tanggal gajian.",
  },
  {
    title: "Catat setiap transaksi",
    description: "Lihat ke mana uang pergi lewat ringkasan dan grafik pengeluaran per kategori.",
  },
]

const planning: Feature[] = [
  { icon: Target, title: "Anggaran", description: "Batas belanja per kategori setiap periode, lengkap dengan peringatan saat hampir habis." },
  { icon: PiggyBank, title: "Tujuan tabungan", description: "Menabung untuk mudik, sekolah, atau umrah — terlihat berapa yang perlu disisihkan tiap bulan." },
  { icon: Repeat, title: "Tagihan rutin", description: "Listrik, SPP, dan cicilan muncul saat jatuh tempo. Catat dengan sekali ketuk." },
  { icon: HandCoins, title: "Utang-piutang", description: "Catat pinjaman ke dan dari orang lain beserta cicilannya sampai lunas." },
]

const comingSoon: Feature[] = [
  { icon: FileText, title: "Laporan & ekspor", description: "Laporan bulanan dan tahunan, ekspor Excel dan PDF." },
  { icon: DatabaseBackup, title: "Cadangan data", description: "Backup dan pulihkan seluruh catatan keluarga." },
  { icon: Camera, title: "Foto struk", description: "Lampirkan foto struk belanja pada transaksi." },
  { icon: LockKeyhole, title: "Kunci PIN", description: "Amankan aplikasi di HP dengan PIN." },
]

const CURRENT_YEAR = new Date().getFullYear()

/** Illustrative rows for the app preview in the hero. */
const previewTransactions = [
  { icon: "shopping-basket", color: "#84cc16", name: "Belanja Dapur", note: "Pasar pagi", amount: 185_000, by: "Istri", byColor: "#db2777" },
  { icon: "zap", color: "#eab308", name: "Listrik & Air", note: "Token listrik", amount: 200_000, by: "Suami", byColor: "#2563eb" },
  { icon: "graduation-cap", color: "#8b5cf6", name: "Pendidikan", note: "SPP anak", amount: 350_000, by: "Istri", byColor: "#db2777" },
]

function AppPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-emerald-300/40 to-teal-300/30 blur-2xl dark:from-emerald-700/30 dark:to-teal-800/20" />

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-elevated dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900">
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10" />
        <p className="relative text-sm text-white/80">Total saldo semua dompet</p>
        <p className="relative mt-1 text-3xl font-bold tracking-tight tabular-nums">
          {formatRupiah(12_450_000)}
        </p>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/12 p-3">
            <p className="flex items-center gap-1 text-xs text-white/80">
              <ArrowDownLeft className="size-3.5" /> Pemasukan
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatRupiah(11_500_000)}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3">
            <p className="flex items-center gap-1 text-xs text-white/80">
              <ArrowUpRight className="size-3.5" /> Pengeluaran
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatRupiah(6_820_000)}</p>
          </div>
        </div>
      </div>

      <div className="surface mt-3 space-y-0.5 p-2">
        {previewTransactions.map((t) => (
          <div key={t.name} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
            <IconBadge icon={t.icon} color={t.color} shape="square" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{t.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{t.note}</span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold whitespace-nowrap text-red-600 tabular-nums dark:text-red-400">
                −{formatRupiah(t.amount)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MemberAvatar name={t.by} color={t.byColor} size="sm" className="size-4 text-[0.6rem]" />
                {t.by}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** true once the window has scrolled past a few pixels. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [threshold])
  return scrolled
}

export function LandingPage() {
  const { session } = useAuth()
  const signedIn = Boolean(session)
  const scrolled = useScrolled()

  return (
    <div className="relative min-h-svh overflow-x-clip">
      {/* Soft background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-emerald-300/35 blur-3xl dark:bg-emerald-700/20" />
        <div className="absolute top-20 -right-40 size-[26rem] rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-700/10" />
      </div>

      {/* Header */}
      {/* Transparent at the very top; blurred background once the page scrolls. */}
      <header
        className={cn(
          "sticky top-0 z-30 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-foreground/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
            : "border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="size-9" />
            <span className="text-lg font-bold">Lumbung</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            {signedIn ? (
              <Button nativeButton={false} render={<Link to="/beranda" />}>
                Buka Beranda <ArrowRight />
              </Button>
            ) : (
              <>
                <Button variant="ghost" nativeButton={false} render={<Link to="/masuk" />}>
                  Masuk
                </Button>
                <Button nativeButton={false} render={<Link to="/daftar" />}>
                  Daftar
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 md:grid-cols-2 md:px-6 md:pt-16 md:pb-24">
          <div className="space-y-6 text-center md:text-left">
            <AnimatedLogo variant="intro" className="mx-auto size-20 md:mx-0" />
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
              Catat keuangan keluarga,{" "}
              <span className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                bersama-sama.
              </span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground md:mx-0">
              Lumbung membantu suami dan istri mencatat pemasukan, pengeluaran, dan saldo
              setiap dompet di satu tempat — supaya tahu ke mana uang keluarga pergi.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              {signedIn ? (
                <Button size="lg" className="h-12 px-6 text-base shadow-soft" nativeButton={false} render={<Link to="/beranda" />}>
                  Buka Beranda <ArrowRight />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="h-12 px-6 text-base shadow-soft" nativeButton={false} render={<Link to="/daftar" />}>
                    Mulai sekarang <ArrowRight />
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 px-6 text-base" nativeButton={false} render={<Link to="/masuk" />}>
                    Sudah punya akun
                  </Button>
                </>
              )}
            </div>
          </div>

          <AppPreview />
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-bold">Dibuat untuk keuangan rumah tangga</h2>
            <p className="text-muted-foreground">
              Bukan aplikasi akuntansi yang rumit. Cukup yang dibutuhkan keluarga setiap hari.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="surface space-y-3 p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Planning features */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-bold">Rencanakan, bukan hanya mencatat</h2>
            <p className="text-muted-foreground">
              Atur batas belanja, kumpulkan tabungan, dan jangan lewatkan tagihan.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {planning.map(({ icon: Icon, title, description }) => (
              <div key={title} className="surface space-y-3 p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-bold">Mulai dalam tiga langkah</h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="surface flex gap-4 p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="surface mt-6 flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:text-left">
            <span className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <BookOpen className="size-6" />
              </span>
              <span>
                <span className="block font-semibold">Buku panduan pengguna</span>
                <span className="block text-sm text-muted-foreground">
                  Cara memakai setiap fitur, langkah demi langkah, dalam format PDF.
                </span>
              </span>
            </span>
            <Button
              variant="outline"
              size="lg"
              className="shrink-0"
              nativeButton={false}
              render={<a href={USER_GUIDE_URL} download={USER_GUIDE_FILE_NAME} />}
            >
              <Download /> Unduh panduan
            </Button>
          </div>
        </section>

        {/* Coming soon */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-bold">Segera hadir</h2>
            <p className="text-muted-foreground">Fitur yang sedang disiapkan berikutnya.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {comingSoon.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-dashed p-5">
                <Icon className="mb-3 size-5 text-muted-foreground" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-4 pt-8 pb-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-12 text-center text-white shadow-elevated md:py-16 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-white/5" />
            <div className="relative mx-auto max-w-xl space-y-5">
              <h2 className="text-3xl font-bold">Isi lumbung keluarga mulai hari ini</h2>
              <p className="text-white/85">
                Daftar satu akun, pakai berdua. Profil, dompet, dan kategori langsung siap.
              </p>
              <Button
                size="lg"
                className="h-12 bg-white px-6 text-base text-emerald-800 hover:bg-white/90"
                nativeButton={false}
                render={<Link to={signedIn ? "/beranda" : "/daftar"} />}
              >
                {signedIn ? "Buka Beranda" : "Daftar akun keluarga"} <ArrowRight />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row md:px-6">
          <span className="flex items-center gap-2">
            <Logo className="size-6" />
            Lumbung — catatan keuangan keluarga
          </span>
          <span className="flex items-center gap-4">
            <a
              href={USER_GUIDE_URL}
              download={USER_GUIDE_FILE_NAME}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              <Download className="size-4" /> Panduan (PDF)
            </a>
            <span>© {CURRENT_YEAR}</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
