import { ArrowLeftRight, Check, SkipForward } from "lucide-react"

import { IconBadge } from "@/components/common/icon-badge"
import { TransactionAmount } from "@/components/transactions/transaction-amount"
import { Button } from "@/components/ui/button"
import type { Lookups } from "@/hooks/use-lookups"
import { isRecurringFinished } from "@/hooks/use-recurring"
import { daysBetween, dueLabel, formatShortDate, todayWib } from "@/lib/format"
import { recurrenceLabel } from "@/lib/recurrence"
import { cn } from "@/lib/utils"
import type { RecurringTransaction } from "@/types"

interface RecurringRowProps {
  recurring: RecurringTransaction
  lookups: Lookups
  onRecord?: (r: RecurringTransaction) => void
  onSkip?: (r: RecurringTransaction) => void
  onEdit?: (r: RecurringTransaction) => void
}

export function RecurringRow({ recurring: r, lookups, onRecord, onSkip, onEdit }: RecurringRowProps) {
  const category = r.category_id ? lookups.categories.get(r.category_id) : undefined
  const wallet = lookups.wallets.get(r.wallet_id)
  const finished = isRecurringFinished(r)
  const inactive = !r.is_active || finished
  const days = daysBetween(todayWib(), r.next_date)

  const status = finished ? "Selesai" : !r.is_active ? "Nonaktif" : dueLabel(r.next_date)

  return (
    <div className={cn("flex flex-col gap-2 rounded-xl px-2.5 py-3 sm:flex-row sm:items-center", inactive && "opacity-60")}>
      <button
        type="button"
        onClick={() => onEdit?.(r)}
        disabled={!onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {r.type === "transfer" ? (
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            <ArrowLeftRight className="size-5" />
          </span>
        ) : (
          <IconBadge icon={category?.icon} color={category?.color ?? "#64748b"} shape="square" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{r.name}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {recurrenceLabel(r.frequency, r.interval_count)}
            {wallet ? ` · ${wallet.name}` : ""}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <TransactionAmount type={r.type} amount={r.amount} />
          <span
            className={cn(
              "text-xs tabular-nums",
              inactive
                ? "text-muted-foreground"
                : days < 0
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : days <= 3
                    ? "font-semibold text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
            )}
            title={formatShortDate(r.next_date, true)}
          >
            {status}
            {!inactive && days > 1 ? ` · ${formatShortDate(r.next_date)}` : ""}
          </span>
        </span>
      </button>

      {!inactive && (onRecord || onSkip) && (
        <div className="flex shrink-0 justify-end gap-1.5 sm:pl-2">
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={() => onSkip(r)}>
              <SkipForward /> Lewati
            </Button>
          )}
          {onRecord && (
            <Button size="sm" onClick={() => onRecord(r)}>
              <Check /> Catat
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
