import { cn } from "@/lib/utils"

interface MemberAvatarProps {
  name: string
  color: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-6 text-xs",
  md: "size-9 text-sm",
  lg: "size-12 text-lg",
}

/** Round avatar showing the member's initial in their color. */
export function MemberAvatar({ name, color, size = "md", className }: MemberAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initial}
    </span>
  )
}
