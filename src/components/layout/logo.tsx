import { cn } from "@/lib/utils"

/** Lumbung logo (public/images/logo-lumbung.svg). Decorative: the app name is always shown next to it. */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/images/logo-lumbung.svg"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("size-10 shrink-0 select-none drop-shadow-sm", className)}
    />
  )
}
