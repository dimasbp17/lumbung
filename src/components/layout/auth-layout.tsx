import type { ReactNode } from "react"

import { AnimatedLogo } from "@/components/common/animated-logo"

interface AuthLayoutProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/25" />
        <div className="absolute -right-40 -bottom-48 size-[30rem] rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-800/25" />
        <div className="absolute top-1/3 right-1/4 size-64 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-700/10" />
      </div>

      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <AnimatedLogo variant="intro" className="size-16" />
        <div>
          <p className="text-3xl font-bold tracking-tight">Lumbung</p>
          <p className="text-muted-foreground">Catatan keuangan keluarga</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-card/85 p-6 shadow-elevated ring-1 ring-foreground/5 backdrop-blur-xl">
        <div className="mb-5 space-y-1.5">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
    </div>
  )
}
