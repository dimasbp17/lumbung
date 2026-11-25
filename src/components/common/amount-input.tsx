import { useId } from "react"

import { cn } from "@/lib/utils"
import { formatNumber, parseNumber } from "@/lib/format"

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  id?: string
  autoFocus?: boolean
  invalid?: boolean
  /** "lg" for the transaction form, "md" for other forms */
  size?: "lg" | "md"
  className?: string
  "aria-describedby"?: string
}

/**
 * Rupiah amount input: shows thousands separators while typing and
 * returns an integer (no decimals).
 */
export function AmountInput({
  value,
  onChange,
  id,
  autoFocus,
  invalid,
  size = "md",
  className,
  ...rest
}: AmountInputProps) {
  const fallbackId = useId()
  const large = size === "lg"

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid &&
          "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50",
        large ? "h-16 px-4" : "h-10 px-3",
        className
      )}
    >
      <span
        className={cn(
          "mr-2 font-medium text-muted-foreground",
          large ? "text-xl" : "text-sm"
        )}
      >
        Rp
      </span>
      <input
        id={id ?? fallbackId}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        placeholder="0"
        value={value ? formatNumber(value) : ""}
        onChange={(e) => {
          // Cap at 15 digits so it stays safe as a number (< 2^53).
          const next = parseNumber(e.target.value.slice(0, 20))
          onChange(Math.min(next, 999_999_999_999_999))
        }}
        className={cn(
          "w-full min-w-0 bg-transparent font-semibold tabular-nums outline-none placeholder:text-muted-foreground/60",
          large ? "text-3xl" : "text-base"
        )}
        {...rest}
      />
    </div>
  )
}
