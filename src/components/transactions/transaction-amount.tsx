import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TransactionType } from "@/types"

/** Amount with a +/− sign and color; transfers have no sign. */
export function TransactionAmount({
  type,
  amount,
  className,
}: {
  type: TransactionType
  amount: number
  className?: string
}) {
  const sign = type === "income" ? "+" : type === "expense" ? "−" : ""
  return (
    <span
      className={cn(
        "font-semibold whitespace-nowrap tabular-nums",
        type === "income" && "text-emerald-600 dark:text-emerald-400",
        type === "expense" && "text-red-600 dark:text-red-400",
        type === "transfer" && "text-muted-foreground",
        className
      )}
    >
      {sign}
      {formatRupiah(amount)}
    </span>
  )
}

/** Signed number for totals (net). */
export function SignedAmount({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "font-semibold whitespace-nowrap tabular-nums",
        value > 0 && "text-emerald-600 dark:text-emerald-400",
        value < 0 && "text-red-600 dark:text-red-400",
        className
      )}
    >
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {formatRupiah(Math.abs(value))}
    </span>
  )
}
