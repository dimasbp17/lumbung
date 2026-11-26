import { useMemo } from "react"
import { ArrowLeftRight, ChevronRight } from "lucide-react"

import { IconBadge } from "@/components/common/icon-badge"
import {
  groupByDayAndCategory,
  type CategoryGroup,
} from "@/components/transactions/category-group-values"
import { SignedAmount, TransactionAmount } from "@/components/transactions/transaction-amount"
import type { Lookups } from "@/hooks/use-lookups"
import { summarizeTransactions } from "@/hooks/use-transactions"
import { relativeDateLabel } from "@/lib/format"
import type { Transaction } from "@/types"

interface CategoryGroupListProps {
  transactions: Transaction[]
  lookups: Lookups
  onSelect: (group: CategoryGroup) => void
}

/** Transactions grouped by day (with a daily total), and within each day per category. */
export function CategoryGroupList({ transactions, lookups, onSelect }: CategoryGroupListProps) {
  const days = useMemo(() => groupByDayAndCategory(transactions, lookups), [transactions, lookups])

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.date}>
          <header className="mb-2 flex items-center justify-between gap-2 px-1">
            <h3 className="text-sm font-semibold text-muted-foreground">{relativeDateLabel(day.date)}</h3>
            <SignedAmount value={summarizeTransactions(day.transactions).net} className="text-sm" />
          </header>
          <div className="surface space-y-0.5 p-2">
            {day.groups.map((g) => (
              <CategoryGroupRow key={g.key} group={g} onClick={() => onSelect(g)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function CategoryGroupRow({ group: g, onClick }: { group: CategoryGroup; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left transition-colors outline-none hover:bg-muted active:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GroupIcon group={g} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{g.name}</span>
        <span className="block truncate text-sm text-muted-foreground">{g.count} transaksi</span>
      </span>
      <TransactionAmount type={g.type} amount={g.total} />
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

export function GroupIcon({ group }: { group: Pick<CategoryGroup, "type" | "icon" | "color"> }) {
  if (group.type === "transfer")
    return (
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
        <ArrowLeftRight className="size-5" />
      </span>
    )
  return <IconBadge icon={group.icon} color={group.color} shape="square" />
}
