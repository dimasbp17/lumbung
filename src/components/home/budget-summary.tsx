import { Link } from "react-router"
import { ChevronRight } from "lucide-react"

import { IconBadge } from "@/components/common/icon-badge"
import { ProgressBar } from "@/components/common/progress-bar"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  budgetProgress,
  budgetRemainingLabel,
  reservedByCategory,
  useBudgets,
} from "@/hooks/use-budgets"
import type { Lookups } from "@/hooks/use-lookups"
import { useRecurringTransactions } from "@/hooks/use-recurring"
import { usePeriod } from "@/hooks/use-settings"
import type { Transaction } from "@/types"

const MAX_ITEMS = 3

/** The budgets closest to (or over) their limit this period. Hidden without budgets. */
export function BudgetSummary({ transactions, lookups }: { transactions: Transaction[]; lookups: Lookups }) {
  const { data: budgets = [] } = useBudgets()
  const { data: bills = [] } = useRecurringTransactions()
  const period = usePeriod()
  if (budgets.length === 0) return null

  const rows = budgetProgress(budgets, transactions, reservedByCategory(bills, period)).sort(
    (a, b) => b.committedRatio - a.committedRatio
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Anggaran periode ini</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-primary" nativeButton={false} render={<Link to="/anggaran" />}>
            Semua <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.slice(0, MAX_ITEMS).map((r) => {
          const category = lookups.categories.get(r.category_id)
          const over = r.ratio > 1
          const status = budgetRemainingLabel(r)
          return (
            <div key={r.id} className="flex items-center gap-3">
              <IconBadge icon={category?.icon} color={category?.color ?? "#64748b"} size="sm" shape="square" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{category?.name ?? "Kategori"}</span>
                  <span className={status.danger ? "font-semibold text-red-600 tabular-nums dark:text-red-400" : "text-muted-foreground tabular-nums"}>
                    {status.text}
                  </span>
                </div>
                <ProgressBar
                  value={r.ratio}
                  reserved={r.reserved / r.amount}
                  color={category?.color}
                  danger={over}
                  className="h-2"
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
