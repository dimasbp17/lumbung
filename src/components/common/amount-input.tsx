import { useId, useState } from "react"
import { Calculator } from "lucide-react"

import { AmountKeypad } from "@/components/common/amount-keypad"
import { MAX_AMOUNT } from "@/lib/amount-expression"
import { formatNumber, parseNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  id?: string
  autoFocus?: boolean
  invalid?: boolean
  /** "lg" for the transaction form, "md" for other forms */
  size?: "lg" | "md"
  /** Adds a button that opens a calculator keypad below the field */
  calculator?: boolean
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
  calculator,
  className,
  ...rest
}: AmountInputProps) {
  const fallbackId = useId()
  const keypadId = useId()
  const [keypadOpen, setKeypadOpen] = useState(false)
  const large = size === "lg"

  const field = (
    <div
      className={cn(
        "flex items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid && "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50",
        large ? "h-16 px-4" : "h-10 px-3",
        calculator && (large ? "pr-2" : "pr-1"),
        className
      )}
    >
      <span className={cn("mr-2 font-medium text-muted-foreground", large ? "text-xl" : "text-sm")}>
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
          onChange(Math.min(next, MAX_AMOUNT))
        }}
        className={cn(
          "w-full min-w-0 bg-transparent font-semibold tabular-nums outline-none placeholder:text-muted-foreground/60",
          large ? "text-3xl" : "text-base"
        )}
        {...rest}
      />
      {calculator && (
        <button
          type="button"
          aria-label="Kalkulator"
          aria-expanded={keypadOpen}
          aria-controls={keypadId}
          onClick={() => setKeypadOpen((o) => !o)}
          className={cn(
            "ml-2 flex shrink-0 items-center justify-center rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            large ? "size-11" : "size-8",
            keypadOpen
              ? "bg-primary text-primary-foreground"
              : "bg-muted/70 text-muted-foreground hover:bg-muted"
          )}
        >
          <Calculator className={large ? "size-5" : "size-4"} />
        </button>
      )}
    </div>
  )

  if (!calculator) return field

  return (
    <div className="grid gap-2">
      {field}
      {keypadOpen && (
        <AmountKeypad
          id={keypadId}
          initialValue={value}
          onApply={(total) => {
            onChange(total)
            setKeypadOpen(false)
          }}
          onClose={() => setKeypadOpen(false)}
        />
      )}
    </div>
  )
}
