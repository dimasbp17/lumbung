import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { addDays } from "@/lib/format"
import { supabase } from "@/lib/supabase"
import type { RecurringTransaction, TransactionType } from "@/types"

const QUERY_KEY = ["recurring"] as const

export function useRecurringTransactions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select(
          "id, name, type, amount, category_id, wallet_id, to_wallet_id, note, frequency, interval_count, start_date, next_date, end_date, is_active"
        )
        .order("next_date")
        .order("name")
      if (error) throw error
      return data.map((r) => ({ ...r, amount: Number(r.amount) }))
    },
  })
}

/** Finished = the next occurrence falls after the end date. */
export function isRecurringFinished(r: RecurringTransaction): boolean {
  return r.end_date !== null && r.next_date > r.end_date
}

/** How many days before its due date a payment still counts as paying a bill. */
const PAY_AHEAD_DAYS = 7

/**
 * The bill a new transaction most likely pays: an active income/expense bill of
 * the same type and category, due by `date` + 7 days (overdue included).
 * Earliest due date first.
 */
export function findMatchingBill(
  bills: RecurringTransaction[],
  t: { type: TransactionType; categoryId: string | null; date: string }
): RecurringTransaction | null {
  if (t.type === "transfer" || !t.categoryId || !t.date) return null
  const horizon = addDays(t.date, PAY_AHEAD_DAYS)
  return (
    bills.find(
      (r) =>
        r.is_active &&
        !isRecurringFinished(r) &&
        r.type === t.type &&
        r.category_id === t.categoryId &&
        r.next_date <= horizon
    ) ?? null
  )
}

export type RecurringInput = Omit<RecurringTransaction, "id" | "start_date"> & { id?: string }

export function useSaveRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: RecurringInput) => {
      // The chosen next due date becomes the new anchor for later occurrences.
      const row = { ...values, start_date: values.next_date }
      const { error } = id
        ? await supabase.from("recurring_transactions").update(row).eq("id", id)
        : await supabase.from("recurring_transactions").insert(row)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_transactions").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

/** Records the current occurrence as a transaction and moves to the next due date. */
export function useRecordRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; date: string; amount: number; recordedBy: string | null }) => {
      const { error } = await supabase.rpc("record_recurring_transaction", {
        p_id: args.id,
        p_date: args.date,
        p_amount: args.amount,
        p_recorded_by: args.recordedBy,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["wallets"] })
    },
  })
}

/** Skips the current occurrence without recording anything. */
export function useSkipRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("skip_recurring_transaction", { p_id: id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
