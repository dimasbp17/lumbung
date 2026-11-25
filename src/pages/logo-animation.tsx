import { useState } from "react"
import { Link } from "react-router"
import { ChevronLeft, RotateCcw } from "lucide-react"

import { AnimatedLogo, type AnimatedLogoVariant } from "@/components/common/animated-logo"
import { Button } from "@/components/ui/button"

const variants: { variant: AnimatedLogoVariant; title: string; description: string }[] = [
  {
    variant: "intro",
    title: "Intro",
    description:
      "Kotak muncul, atap jatuh, huruf L tergambar dari atas, daun tumbuh, lalu kilau lewat. Setelahnya daun terus bergoyang pelan.",
  },
  {
    variant: "idle",
    title: "Diam (loop)",
    description: "Logo melayang pelan, daun bergoyang, dan kilau lewat setiap beberapa detik.",
  },
  {
    variant: "loading",
    title: "Memuat",
    description: "Atap, huruf L, dan daun berdenyut bergantian. Cocok untuk layar memuat.",
  },
]

const SIZES = [
  { px: 24, className: "size-6" },
  { px: 40, className: "size-10" },
  { px: 64, className: "size-16" },
  { px: 96, className: "size-24" },
]

/** Preview page for the animated logo: /lumbung/animasi */
export function LogoAnimationPage() {
  // Bumping the key remounts the SVGs, which restarts every animation.
  const [replay, setReplay] = useState(0)

  return (
    <div className="relative min-h-svh overflow-x-clip px-4 py-8 md:px-6 md:py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-emerald-300/35 blur-3xl dark:bg-emerald-700/20" />
        <div className="absolute -right-40 bottom-0 size-[26rem] rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-700/10" />
      </div>

      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link to="/" />}>
            <ChevronLeft /> Halaman depan
          </Button>
          <Button onClick={() => setReplay((n) => n + 1)}>
            <RotateCcw /> Putar ulang
          </Button>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Animasi logo Lumbung</h1>
          <p className="max-w-2xl text-muted-foreground">
            Dibuat dari bentuk yang sama dengan <code className="rounded bg-muted px-1">logo-lumbung.svg</code>,
            dianimasikan dengan CSS. Jika perangkat mengaktifkan “kurangi gerakan”, logo tampil diam.
          </p>
        </header>

        {/* Hero preview */}
        <section className="surface flex flex-col items-center gap-5 px-6 py-14">
          <AnimatedLogo key={`hero-${replay}`} variant="intro" className="size-40 md:size-52" label="Logo Lumbung" />
          <div className="text-center">
            <p className="text-3xl font-bold tracking-tight">Lumbung</p>
            <p className="text-muted-foreground">Catatan keuangan keluarga</p>
          </div>
        </section>

        {/* Variants */}
        <section className="grid gap-4 md:grid-cols-3">
          {variants.map(({ variant, title, description }) => (
            <div key={variant} className="surface flex flex-col items-center gap-4 p-6 text-center">
              <div className="flex h-36 items-center justify-center">
                <AnimatedLogo key={`${variant}-${replay}`} variant={variant} className="size-28" />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Sizes */}
        <section className="surface space-y-4 p-6">
          <h2 className="font-semibold">Berbagai ukuran (intro)</h2>
          <div className="flex flex-wrap items-end gap-6">
            {SIZES.map(({ px, className }) => (
              <div key={px} className="flex flex-col items-center gap-2">
                <AnimatedLogo key={`size-${px}-${replay}`} variant="intro" className={className} />
                <span className="text-xs text-muted-foreground tabular-nums">{px}px</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
