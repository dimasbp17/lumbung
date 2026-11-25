import { Link, useLocation, useNavigate } from "react-router"
import { ArrowLeft, House } from "lucide-react"

import { AnimatedLogo } from "@/components/common/animated-logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-context"

/**
 * Shown for any unknown URL. This is a client-side route on purpose: a
 * static 404.html in the build would switch off Cloudflare Pages' SPA
 * fallback and break direct links such as /beranda.
 */
export function NotFoundPage() {
  const { session } = useAuth()
  const { pathname, key } = useLocation()
  // "default" = this is the first page of the visit, so there is nothing to go back to.
  const canGoBack = key !== "default"
  const navigate = useNavigate()
  const home = session ? { to: "/beranda", label: "Ke Beranda" } : { to: "/", label: "Ke halaman depan" }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/25" />
        <div className="absolute -right-40 -bottom-48 size-[30rem] rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-800/25" />
        <div className="absolute top-1/3 right-1/4 size-64 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-700/10" />
      </div>

      <AnimatedLogo variant="intro" swayCount={2} className="size-20" />

      <p
        aria-hidden
        className="mt-6 bg-linear-to-br from-emerald-600 to-teal-700 bg-clip-text text-8xl leading-none font-bold tracking-tighter text-transparent tabular-nums sm:text-9xl dark:from-emerald-400 dark:to-teal-300"
      >
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Lumbungnya ada, tapi halaman yang Anda cari tidak ada di dalamnya. Mungkin alamatnya salah
        ketik atau halamannya sudah dipindahkan.
      </p>
      <code className="mt-4 max-w-full truncate rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">
        {pathname}
      </code>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
        <Button size="lg" className="h-12 px-6" nativeButton={false} render={<Link to={home.to} replace />}>
          <House /> {home.label}
        </Button>
        {canGoBack && (
          <Button size="lg" variant="outline" className="h-12 px-6" onClick={() => navigate(-1)}>
            <ArrowLeft /> Kembali
          </Button>
        )}
      </div>
    </div>
  )
}
