import { createElement } from "react"

import { getIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface IconBadgeProps {
  icon: string | null | undefined
  color: string
  size?: "sm" | "md" | "lg"
  /** "circle" (default) or a soft-cornered "square" */
  shape?: "circle" | "square"
  className?: string
}

const sizeClasses = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-11 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-6",
}

/** Category/wallet icon inside a softly tinted shape. */
export function IconBadge({
  icon,
  color,
  size = "md",
  shape = "circle",
  className,
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        shape === "circle" ? "rounded-full" : "rounded-2xl",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden
    >
      {createElement(getIcon(icon))}
    </span>
  )
}
