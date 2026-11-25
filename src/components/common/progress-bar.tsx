import { cn } from "@/lib/utils"

interface ProgressBarProps {
  /** 0..1 (values above 1 are drawn full) */
  value: number
  /** Extra 0..1 drawn after `value` as a striped segment, e.g. budget reserved by bills */
  reserved?: number
  color?: string
  /** Turns the bar red, e.g. when a budget is exceeded */
  danger?: boolean
  className?: string
  label?: string
}

const clamp = (v: number) => Math.max(0, Math.min(1, v))

export function ProgressBar({ value, reserved = 0, color, danger, className, label }: ProgressBarProps) {
  const percent = clamp(value) * 100
  const reservedPercent = clamp(value + reserved) * 100 - percent
  const fill = danger ? undefined : color
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={cn("flex h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full shrink-0 transition-[width] duration-500", reservedPercent > 0 ? "rounded-l-full" : "rounded-full", danger ? "bg-red-500" : !color && "bg-primary")}
        style={{ width: `${percent}%`, backgroundColor: fill }}
      />
      {reservedPercent > 0 && (
        <div
          aria-hidden
          className={cn(
            "h-full shrink-0 rounded-r-full opacity-45 transition-[width] duration-500",
            !fill && "bg-primary"
          )}
          style={{
            width: `${reservedPercent}%`,
            backgroundColor: fill,
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent 0 3px, rgb(255 255 255 / 0.55) 3px 6px)",
          }}
        />
      )}
    </div>
  )
}
