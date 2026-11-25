import { cn } from "@/lib/utils"

interface ProgressBarProps {
  /** 0..1 (values above 1 are drawn full) */
  value: number
  color?: string
  /** Turns the bar red, e.g. when a budget is exceeded */
  danger?: boolean
  className?: string
  label?: string
}

export function ProgressBar({ value, color, danger, className, label }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", danger ? "bg-red-500" : !color && "bg-primary")}
        style={{ width: `${percent}%`, backgroundColor: danger ? undefined : color }}
      />
    </div>
  )
}
