import { useMemo, useState } from "react"
import { Plus, Target } from "lucide-react"

import { BudgetForm } from "@/components/budgets/budget-form"
import { IconBadge } from "@/components/common/icon-badge"
import { ProgressBar } from "@/components/common/progress-bar"
import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { PageHeader } from "@/components/layout/page-header"
import { PeriodNavigator } from "@/components/period/period-navigator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  budgetProgress,
  budgetRemainingLabel,
  reservedByCategory,
  useBudgets,
} from "@/hooks/use-budgets"
import { useCategories } from "@/hooks/use-categories"
import { useRecurringTransactions } from "@/hooks/use-recurring"
import { usePeriod } from "@/hooks/use-settings"
import { useTransactionsInRange } from "@/hooks/use-transactions"
import { errorMessage } from "@/lib/error"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Budget } from "@/types"

/** At or above this ratio a budget is flagged as almost used up. */
const WARNING_RATIO = 0.8

export function BudgetsPage() {
  const [offset, setOffset] = useState(0)
  const period = usePeriod(offset)
  const budgets = useBudgets()
  const { data: categories = [] } = useCategories()
  const transactions = useTransactionsInRange(period.start, period.end)
  const bills = useRecurringTransactions()

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Budget | null>(null)
  const [formKey, setFormKey] = useState(0)

  const openSheet = (b: Budget | null) => {
    setSelected(b)
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const rows = budgetProgress(
    budgets.data ?? [],
    transactions.data ?? [],
    reservedByCategory(bills.data ?? [], period)
  ).sort((a, b) => b.committedRatio - a.committedRatio)
  const totalBudget = rows.reduce((s, r) => s + r.amount, 0)
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0)
  const totalReserved = rows.reduce((s, r) => s + r.reserved, 0)
  const totalSafe = totalBudget - totalSpent - totalReserved

  // Categories offered in the form: active expense categories without a budget,
  // plus the one being edited.
  const usedCategoryIds = new Set((budgets.data ?? []).map((b) => b.category_id))
  const formCategories = categories.filter(
    (c) =>
      c.type === "expense" &&
      ((c.is_active && !usedCategoryIds.has(c.id)) || c.id === selected?.category_id)
  )

  const isPending = budgets.isPending || transactions.isPending
  const error = budgets.error ?? transactions.error

  return (
    <>
      <PageHeader
        description="Batas pengeluaran per kategori setiap periode."
        action={
          <Button onClick={() => openSheet(null)}>
            <Plus /> Tambah anggaran
          </Button>
        }
      />

      <div className="space-y-5">
        <PeriodNavigator period={period} offset={offset} onOffsetChange={setOffset} />

        {error && <ErrorMessage message={errorMessage(error)} />}

        {isPending ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Belum ada anggaran"
            description="Tetapkan batas belanja, misalnya Makan & Minum Rp 2.000.000 per bulan."
            action={<Button onClick={() => openSheet(null)}>Tambah anggaran</Button>}
          />
        ) : (
          <>
            <section className="surface space-y-3 p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Terpakai</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatRupiah(totalSpent)}
                    <span className="text-base font-normal text-muted-foreground">
                      {" "}/ {formatRupiah(totalBudget)}
                    </span>
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    totalSafe < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )}
                >
                  {totalSpent > totalBudget
                    ? `Lebih ${formatRupiah(totalSpent - totalBudget)}`
                    : totalReserved === 0
                      ? `Sisa ${formatRupiah(totalSafe)}`
                      : totalSafe < 0
                        ? `Kurang ${formatRupiah(-totalSafe)}`
                        : `Sisa aman ${formatRupiah(totalSafe)}`}
                </p>
              </div>
              <ProgressBar
                value={totalBudget ? totalSpent / totalBudget : 0}
                reserved={totalBudget ? totalReserved / totalBudget : 0}
                danger={totalSpent > totalBudget}
                label="Total anggaran terpakai"
              />
              {totalReserved > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">{formatRupiah(totalReserved)}</span>{" "}
                  dipesan tagihan rutin yang belum dibayar periode ini (bagian bergaris).
                </p>
              )}
            </section>

            <div className="surface space-y-0.5 p-2">
              {rows.map((r) => {
                const category = categoryById.get(r.category_id)
                const over = r.ratio > 1
                const status = budgetRemainingLabel(r)
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openSheet(r)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                  >
                    <IconBadge icon={category?.icon} color={category?.color ?? "#64748b"} shape="square" />
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-semibold">{category?.name ?? "Kategori"}</span>
                          {over ? (
                            <Badge variant="destructive">Terlampaui</Badge>
                          ) : r.committedRatio > 1 ? (
                            <Badge variant="destructive">Kurang untuk tagihan</Badge>
                          ) : r.committedRatio >= WARNING_RATIO ? (
                            <Badge variant="secondary">Hampir habis</Badge>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                          {Math.round(r.ratio * 100)}%
                        </span>
                      </span>
                      <ProgressBar
                        value={r.ratio}
                        reserved={r.reserved / r.amount}
                        color={category?.color}
                        danger={over}
                      />
                      <span className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                        <span>
                          {formatRupiah(r.spent)} dari {formatRupiah(r.amount)}
                        </span>
                        <span className={cn(status.danger && "font-medium text-red-600 dark:text-red-400")}>
                          {status.text}
                        </span>
                      </span>
                      {r.reserved > 0 && (
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          Dipesan tagihan {formatRupiah(r.reserved)}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={selected ? "Ubah anggaran" : "Tambah anggaran"}
        description="Pilih kategori pengeluaran dan batasnya per periode."
      >
        <BudgetForm
          key={formKey}
          budget={selected}
          categories={formCategories}
          onDone={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </>
  )
}
