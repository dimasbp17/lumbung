import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { Budget, Transaction } from "@/types"

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
  /** spent / amount */
  ratio: number
  remaining: number
}

/** Pairs each budget with what was spent in its category during the given transactions. */
export function budgetProgress(budgets: Budget[], transactions: Transaction[]): BudgetProgress[] {
  const spentByCategory = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== "expense" || !t.category_id) continue
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + t.amount)
  }
  return budgets.map((b) => {
    const spent = spentByCategory.get(b.category_id) ?? 0
    return { ...b, spent, ratio: spent / b.amount, remaining: b.amount - spent }
  })
}
