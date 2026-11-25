import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { NewTransaction, Transaction, TransactionType } from "@/types"

const COLUMNS =
  "id, type, amount, date, category_id, wallet_id, to_wallet_id, note, recorded_by, created_at"

function normalize(rows: Transaction[]): Transaction[] {
  // bigint from PostgREST may arrive as a string; make sure it is a number.
  return rows.map((t) => ({ ...t, amount: Number(t.amount) }))
}

/** Transactions within a date range (inclusive), newest first. */
export function useTransactionsInRange(start: string, end: string) {
  return useQuery({
    queryKey: ["transactions", "range", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(COLUMNS)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
      if (error) throw error
      return normalize(data)
    },
  })
}

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ["transactions", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(COLUMNS)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw error
      return normalize(data)
    },
  })
}

function useInvalidateTransactions() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["transactions"] })
    // Wallet balances change as well.
    qc.invalidateQueries({ queryKey: ["wallets"] })
  }
}

export function useSaveTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({
    mutationFn: async ({ id, ...values }: NewTransaction & { id?: string }) => {
      const { error } = id
        ? await supabase.from("transactions").update(values).eq("id", id)
        : await supabase.from("transactions").insert(values)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Total income & expense (transfers are not counted). */
export function summarizeTransactions(transactions: Transaction[]) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === "income") income += t.amount
    else if (t.type === "expense") expense += t.amount
  }
  return { income, expense, net: income - expense }
}

export interface TransactionFilters {
  /** Inclusive date range; omit both to search all dates */
  start?: string
  end?: string
  type?: TransactionType
  categoryId?: string
  /** Matches the source wallet or the transfer destination */
  walletId?: string
  memberId?: string
  /** Free text: matches the note, or any category whose name matches */
  query?: string
  /** Category ids whose name matches `query` (resolved by the caller) */
  queryCategoryIds?: string[]
}

/** Upper bound when searching across all dates. */
export const SEARCH_LIMIT = 500

/** Strips characters that have meaning in PostgREST filter syntax. */
function sanitize(text: string): string {
  return text.replace(/[,()*%\\"]/g, " ").trim()
}

export function useTransactionSearch(filters: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", "search", filters],
    queryFn: async () => {
      let q = supabase.from("transactions").select(COLUMNS)
      if (filters.start) q = q.gte("date", filters.start)
      if (filters.end) q = q.lte("date", filters.end)
      if (filters.type) q = q.eq("type", filters.type)
      if (filters.categoryId) q = q.eq("category_id", filters.categoryId)
      if (filters.memberId) q = q.eq("recorded_by", filters.memberId)
      if (filters.walletId)
        q = q.or(`wallet_id.eq.${filters.walletId},to_wallet_id.eq.${filters.walletId}`)

      const text = sanitize(filters.query ?? "")
      if (text) {
        const parts = [`note.ilike.*${text}*`]
        if (filters.queryCategoryIds?.length)
          parts.push(`category_id.in.(${filters.queryCategoryIds.join(",")})`)
        q = q.or(parts.join(","))
      }

      const { data, error } = await q
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(SEARCH_LIMIT)
      if (error) throw error
      return normalize(data)
    },
    placeholderData: (previous) => previous,
  })
}
