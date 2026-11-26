import { useMemo } from "react"
import { ArrowLeftRight, ChevronRight } from "lucide-react"

import { IconBadge } from "@/components/common/icon-badge"
import { TransactionAmount } from "@/components/transactions/transaction-amount"
import type { Lookups } from "@/hooks/use-lookups"
import { groupByCategory, type CategoryGroup } from "@/components/transactions/category-group-values"
import { formatShortDate } from "@/lib/format"
import type { Transaction, TransactionType } from "@/types"

const sectionOrder: { type: TransactionType; label: string }[] = [
  { type: "expense", label: "Pengeluaran" },
  { type: "income", label: "Pemasukan" },
  { type: "transfer", label: "Transfer" },
]

interface CategoryGroupListProps {
  transactions: Transaction[]
  lookups: Lookups
  onSelect: (group: CategoryGroup) => void
}

/** Transactions summarized per category, split into expense / income / transfer sections. */
export function CategoryGroupList({ transactions, lookups, onSelect }: CategoryGroupListProps) {
  const groups = useMemo(() => groupByCategory(transactions, lookups), [transactions, lookups])

  return (
    <div className="space-y-5">
      {sectionOrder.map(({ type, label }) => {
        const items = groups.filter((g) => g.type === type)
        if (items.length === 0) return null
        const sectionTotal = items.reduce((s, g) => s + g.total, 0)
        return (
          <section key={type}>
            <header className="mb-2 flex items-center justify-between gap-2 px-1">
              <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
              <TransactionAmount type={type} amount={sectionTotal} className="text-sm" />
            </header>
            <div className="surface space-y-0.5 p-2">
              {items.map((g) => (
                <CategoryGroupRow
                  key={g.key}
                  group={g}
                  share={sectionTotal ? g.total / sectionTotal : 0}
                  onClick={() => onSelect(g)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function CategoryGroupRow({
  group: g,
  share,
  onClick,
}: {
  group: CategoryGroup
  share: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left transition-colors outline-none hover:bg-muted active:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GroupIcon group={g} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{g.name}</span>
          <TransactionAmount type={g.type} amount={g.total} />
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {g.count} transaksi · terakhir {formatShortDate(g.lastDate)}
          </span>
          {g.type !== "transfer" && (
            <span className="shrink-0 tabular-nums">{Math.round(share * 100)}%</span>
          )}
        </span>
        {g.type !== "transfer" && (
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(share * 100, 2)}%`, backgroundColor: g.color }}
            />
          </span>
        )}
      </span>
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
