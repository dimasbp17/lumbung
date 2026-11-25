import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { Debt, DebtDirection, DebtPayment, DebtWithProgress } from "@/types"

const DEBTS_KEY = ["debts"] as const
const PAYMENTS_KEY = ["debt-payments"] as const

export function useDebts() {
  return useQuery({
    queryKey: DEBTS_KEY,
    queryFn: async (): Promise<DebtWithProgress[]> => {
      const [debts, totals] = await Promise.all([
        supabase
          .from("debts")
          .select("id, direction, person_name, amount, date, due_date, wallet_id, note, created_at")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("debt_totals").select("debt_id, paid"),
      ])
      if (debts.error) throw debts.error
      if (totals.error) throw totals.error

      const paidById = new Map(totals.data.map((t) => [t.debt_id as string, Number(t.paid)]))
      return (debts.data as Debt[]).map((d) => ({
        ...d,
        amount: Number(d.amount),
        paid: paidById.get(d.id) ?? 0,
      }))
    },
  })
}

export const debtDirectionLabels: Record<DebtDirection, string> = {
  payable: "Utang",
  receivable: "Piutang",
}

export type DebtInput = Pick<
  Debt,
  "direction" | "person_name" | "amount" | "date" | "due_date" | "wallet_id" | "note"
> & { id?: string }

function useInvalidateDebts() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: DEBTS_KEY })
    qc.invalidateQueries({ queryKey: PAYMENTS_KEY })
    qc.invalidateQueries({ queryKey: ["wallets"] })
  }
}

export function useSaveDebt() {
  const invalidate = useInvalidateDebts()
  return useMutation({
    mutationFn: async ({ id, ...values }: DebtInput) => {
      const { error } = id
        ? await supabase.from("debts").update(values).eq("id", id)
        : await supabase.from("debts").insert(values)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteDebt() {
  const invalidate = useInvalidateDebts()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDebtPayments(debtId: string | null) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, debtId],
    enabled: Boolean(debtId),
    queryFn: async (): Promise<DebtPayment[]> => {
      const { data, error } = await supabase
        .from("debt_payments")
        .select("id, debt_id, amount, date, wallet_id, note, created_at")
        .eq("debt_id", debtId!)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
      if (error) throw error
      return data.map((p) => ({ ...p, amount: Number(p.amount) }))
    },
  })
}

export type DebtPaymentInput = Pick<DebtPayment, "debt_id" | "amount" | "date" | "wallet_id" | "note">

export function useSaveDebtPayment() {
  const invalidate = useInvalidateDebts()
  return useMutation({
    mutationFn: async (values: DebtPaymentInput) => {
      const { error } = await supabase.from("debt_payments").insert(values)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteDebtPayment() {
  const invalidate = useInvalidateDebts()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debt_payments").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
