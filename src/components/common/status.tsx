import type { ReactNode } from "react"
import { LoaderCircle, type LucideIcon } from "lucide-react"

import { AnimatedLogo } from "@/components/common/animated-logo"
import { cn } from "@/lib/utils"

export function Loading({ className, label = "Memuat…" }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-10 text-muted-foreground",
        className
      )}
      role="status"
    >
      <LoaderCircle className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

/**
 * Full-screen loading state (app start, auth check). Uses the pulsing logo;
 * short-lived, so the looping animation is fine here.
 */
export function SplashScreen({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4" role="status">
      <AnimatedLogo variant="loading" className="size-20" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 px-4 py-10 text-center",
        className
      )}
    >
      <span className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  )
}
