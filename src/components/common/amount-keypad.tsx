import { useState, type ReactNode } from "react"
import { Delete, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  evaluate,
  formatTokens,
  hasOperator,
  MAX_AMOUNT,
  tokenize,
  type Operator,
} from "@/lib/amount-expression"
import { formatNumber, formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AmountKeypadProps {
  id?: string
  /** Starting amount (0 = empty) */
  initialValue: number
  /** Called with the total when the user taps "Pakai" */
  onApply: (total: number) => void
  onClose: () => void
}

/** Normalizes typed text: "25000+21" → "25.000 + 21". */
const normalize = (text: string) => formatTokens(tokenize(text))

/** On-screen calculator for summing several amounts, e.g. three meals in a day. */
export function AmountKeypad({ id, initialValue, onApply, onClose }: AmountKeypadProps) {
  const [text, setText] = useState(initialValue > 0 ? formatNumber(initialValue) : "")

  const tokens = tokenize(text)
  const total = evaluate(tokens)
  const showsSum = hasOperator(tokens)
  const canApply = total > 0 && total <= MAX_AMOUNT

  const press = (key: string) => setText((t) => normalize(t + key))
  const operator = (op: Operator) => {
    if (text) press(op)
  }
  // Removing the last character of "25.000 +" leaves "25.000 ", i.e. back to the number.
  const backspace = () => setText((t) => normalize(t.slice(0, -1)))

  return (
    <div id={id} role="group" aria-label="Kalkulator" className="surface space-y-3 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 text-right">
          <p className="min-h-5 text-sm break-words text-muted-foreground tabular-nums">
            {showsSum ? text : " "}
          </p>
          <p
            aria-live="polite"
            className={cn(
              "truncate text-2xl font-bold tabular-nums",
              total < 0 && "text-destructive"
            )}
          >
            {formatRupiah(total)}
          </p>
        </div>
        <button
          type="button"
          aria-label="Tutup kalkulator"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Key onClick={() => press("7")}>7</Key>
        <Key onClick={() => press("8")}>8</Key>
        <Key onClick={() => press("9")}>9</Key>
        <Key onClick={backspace} variant="muted" label="Hapus satu">
          <Delete className="size-5" />
        </Key>

        <Key onClick={() => press("4")}>4</Key>
        <Key onClick={() => press("5")}>5</Key>
        <Key onClick={() => press("6")}>6</Key>
        <Key onClick={() => operator("×")} variant="operator" label="Kali">×</Key>

        <Key onClick={() => press("1")}>1</Key>
        <Key onClick={() => press("2")}>2</Key>
        <Key onClick={() => press("3")}>3</Key>
        <Key onClick={() => operator("−")} variant="operator" label="Kurang">−</Key>

        <Key onClick={() => press("000")}>000</Key>
        <Key onClick={() => press("0")}>0</Key>
        <Key onClick={() => setText("")} variant="muted" label="Hapus semua">C</Key>
        <Key onClick={() => operator("+")} variant="operator" label="Tambah">+</Key>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canApply}
        onClick={() => onApply(total)}
      >
        {canApply ? `Pakai ${formatRupiah(total)}` : "Pakai"}
      </Button>
    </div>
  )
}

interface KeyProps {
  onClick: () => void
  children: ReactNode
  variant?: "digit" | "operator" | "muted"
  /** Accessible name when the visible content is a symbol */
  label?: string
}

function Key({ onClick, children, variant = "digit", label }: KeyProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-xl text-lg font-semibold tabular-nums transition-colors outline-none select-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring",
        variant === "digit" && "bg-muted/60 hover:bg-muted",
        variant === "operator" && "bg-accent text-xl text-accent-foreground hover:bg-accent/80",
        variant === "muted" && "bg-muted/30 text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}
