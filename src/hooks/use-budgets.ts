import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { isRecurringFinished } from "@/hooks/use-recurring"
import { formatRupiah, todayWib } from "@/lib/format"
import type { Period } from "@/lib/period"
import { nextRecurrenceDate } from "@/lib/recurrence"
import { supabase } from "@/lib/supabase"
import type { Budget, RecurringTransaction, Transaction } from "@/types"

const QUERY_KEY = ["budgets"] as const

export function useBudgets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from("budgets")
        .select("id, category_id, amount")
        .order("created_at")
      if (error) throw error
      return data.map((b) => ({ ...b, amount: Number(b.amount) }))
    },
  })
}

export function useSaveBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Pick<Budget, "category_id" | "amount"> & { id?: string }) => {
      const { error } = id
        ? await supabase.from("budgets").update(values).eq("id", id)
        : await supabase.from("budgets").insert(values)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export interface BudgetProgress extends Budget {
  spent: number
  /** Unrecorded bills of this category still due this period */
  reserved: number
  /** spent / amount */
  ratio: number
  /** (spent + reserved) / amount */
  committedRatio: number
  /** amount − spent */
  remaining: number
  /** amount − spent − reserved: what can still be spent freely */
  safeRemaining: number
}

/** Upper bound on occurrences counted per bill, guards against odd data. */
const MAX_OCCURRENCES = 60

/**
 * Per category: the total of unrecorded expense bills due within `period`.
 * Past periods reserve nothing. The current period also counts overdue bills,
 * since they still have to be paid; a bill due every 2 weeks counts twice in a month.
 */
export function reservedByCategory(
  bills: RecurringTransaction[],
  period: Period,
  today: string = todayWib()
): Map<string, number> {
  const reserved = new Map<string, number>()
  if (period.end < today) return reserved
  const isCurrent = period.start <= today

  for (const r of bills) {
    if (r.type !== "expense" || !r.category_id || !r.is_active || isRecurringFinished(r)) continue
    let count = 0
    let d = r.next_date
    for (let i = 0; i < MAX_OCCURRENCES && d <= period.end; i++) {
      if (r.end_date !== null && d > r.end_date) break
      if (isCurrent || d >= period.start) count++
      d = nextRecurrenceDate(r.start_date, r.frequency, r.interval_count, d)
    }
    if (count > 0) reserved.set(r.category_id, (reserved.get(r.category_id) ?? 0) + count * r.amount)
  }
  return reserved
}

/** Pairs each budget with what was spent (and is reserved by bills) in its category. */
export function budgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  reserved: Map<string, number> = new Map()
): BudgetProgress[] {
  const spentByCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== "expense" || !t.category_id) continue
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + t.amount)
  }
  return budgets.map((b) => {
    const spent = spentByCategory.get(b.category_id) ?? 0
    const held = reserved.get(b.category_id) ?? 0
    return {
      ...b,
      spent,
      reserved: held,
      ratio: spent / b.amount,
      committedRatio: (spent + held) / b.amount,
      remaining: b.amount - spent,
      safeRemaining: b.amount - spent - held,
    }
  })
}

/** Right-hand status of a budget: over the limit, short for its bills, or what's left. */
export function budgetRemainingLabel(r: BudgetProgress): { text: string; danger: boolean } {
  if (r.remaining < 0) return { text: `Lebih ${formatRupiah(-r.remaining)}`, danger: true }
  if (r.reserved === 0) return { text: `Sisa ${formatRupiah(r.remaining)}`, danger: false }
  if (r.safeRemaining < 0) return { text: `Kurang ${formatRupiah(-r.safeRemaining)}`, danger: true }
  return { text: `Sisa aman ${formatRupiah(r.safeRemaining)}`, danger: false }
}
