import { useId, type CSSProperties } from "react"

import { cn } from "@/lib/utils"
import "./animated-logo.css"

export type AnimatedLogoVariant = "intro" | "idle" | "loading"

interface AnimatedLogoProps {
  variant?: AnimatedLogoVariant
  className?: string
  /** Accessible label; omit when the logo is decorative */
  label?: string
  /**
   * Intro only: how many times the leaf sways after the build-up before it
   * rests. Keep this small so the logo is not animating forever. Default 3.
   */
  swayCount?: number | "infinite"
}

/**
 * The Lumbung logo (same shapes as public/images/logo-lumbung.svg) drawn
 * inline so each part can be animated. Change `key` to replay the intro.
 */
export function AnimatedLogo({ variant = "intro", className, label, swayCount = 3 }: AnimatedLogoProps) {
  // React ids contain characters like ":" or "«»" that can break url(#…) references.
  const id = `al${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const clipId = `${id}-clip`
  const shineId = `${id}-shine`

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-variant={variant}
      className={cn("al size-24", className)}
      style={{ "--al-sway-count": String(swayCount) } as CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="120" height="120" rx="28" />
        </clipPath>
        <linearGradient id={shineId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="al-bg">
        <rect width="120" height="120" rx="28" fill="#007f51" />
        <g clipPath={`url(#${clipId})`}>
          <rect className="al-shine" x="0" y="-20" width="40" height="160" fill={`url(#${shineId})`} />
        </g>
      </g>

      <path
        className="al-roof"
        d="M29.5 51.5C27.2 53.6 27 57.2 29.1 59.5C31.2 61.8 34.8 62 37.1 59.9L60 39.2L82.9 59.9C85.2 62 88.8 61.8 90.9 59.5C93 57.2 92.8 53.6 90.5 51.5L64.7 28.2C62 25.8 58 25.8 55.3 28.2L29.5 51.5Z"
        fill="#dcf4e7"
      />
      <path
        className="al-l"
        d="M41 53C41 49.134 44.134 46 48 46C51.866 46 55 49.134 55 53V73C55 75.2091 56.7909 77 59 77H81C84.866 77 88 80.134 88 84C88 87.866 84.866 91 81 91H53C46.3726 91 41 85.6274 41 79V53Z"
        fill="#FFFFFF"
      />
      <path
        className="al-leaf"
        d="M82 48C69.8497 48 61 56.8497 61 69C61 69.5523 61.4477 70 62 70C74.1503 70 83 61.1503 83 49C83 48.4477 82.5523 48 82 48Z"
        fill="#35cb90"
      />
    </svg>
  )
}
