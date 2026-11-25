import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { STORAGE_KEYS } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import type { Wallet, WalletWithBalance } from "@/types"

const QUERY_KEY = ["wallets"] as const

export function useWallets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<WalletWithBalance[]> => {
      const [wallets, balances] = await Promise.all([
        supabase
          .from("wallets")
          .select("id, name, type, icon, color, initial_balance, created_at")
          .order("created_at"),
        supabase.from("wallet_balances").select("wallet_id, balance"),
      ])
      if (wallets.error) throw wallets.error
      if (balances.error) throw balances.error

      const balanceById = new Map<string, number>(
        balances.data.map((b) => [b.wallet_id as string, Number(b.balance)])
      )
      return (wallets.data as Wallet[]).map((w) => ({
        ...w,
        initial_balance: Number(w.initial_balance),
        balance: balanceById.get(w.id) ?? Number(w.initial_balance),
      }))
    },
  })
}

export type WalletInput = Pick<
  Wallet,
  "name" | "type" | "icon" | "color" | "initial_balance"
> & { id?: string }

export function useSaveWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: WalletInput) => {
      const { error } = id
        ? await supabase.from("wallets").update(values).eq("id", id)
        : await supabase.from("wallets").insert(values)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wallets").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export const walletTypeLabels: Record<Wallet["type"], string> = {
  cash: "Tunai",
  bank: "Rekening Bank",
  ewallet: "E-Wallet",
  other: "Lainnya",
}

export interface WalletBreakdown {
  income: number
  expense: number
  transferIn: number
  transferOut: number
  /** Withdrawals − deposits for savings entries that name this wallet */
  savings: number
  /** Net effect of debts/receivables and their payments that name this wallet */
  debts: number
}

/** How a wallet got from its initial balance to its current balance. */
export function useWalletBreakdown(walletId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, "breakdown", walletId],
    enabled: Boolean(walletId),
    queryFn: async (): Promise<WalletBreakdown> => {
      const id = walletId!
      const [transactions, savings, debts, payments] = await Promise.all([
        supabase
          .from("transactions")
          .select("type, amount, wallet_id, to_wallet_id")
          .or(`wallet_id.eq.${id},to_wallet_id.eq.${id}`),
        supabase.from("savings_entries").select("amount").eq("wallet_id", id),
        supabase.from("debts").select("direction, amount").eq("wallet_id", id),
        supabase.from("debt_payments").select("amount, debts!inner(direction)").eq("wallet_id", id),
      ])
      for (const r of [transactions, savings, debts, payments]) if (r.error) throw r.error

      const b: WalletBreakdown = { income: 0, expense: 0, transferIn: 0, transferOut: 0, savings: 0, debts: 0 }
      for (const t of transactions.data ?? []) {
        const amount = Number(t.amount)
        if (t.type === "income") b.income += amount
        else if (t.type === "expense") b.expense += amount
        else if (t.wallet_id === id) b.transferOut += amount
        else b.transferIn += amount
      }
      for (const e of savings.data ?? []) b.savings -= Number(e.amount)
      for (const d of debts.data ?? []) b.debts += d.direction === "payable" ? Number(d.amount) : -Number(d.amount)
      for (const p of payments.data ?? []) {
        const debt = p.debts as unknown as { direction: string }
        b.debts += debt.direction === "payable" ? -Number(p.amount) : Number(p.amount)
      }
      return b
    },
  })
}

// ---------------------------------------------------------------------------
// Last used wallet — stored per device (localStorage)
// ---------------------------------------------------------------------------

/** Wallet last used for an income/expense on this device, if it still exists. */
export function lastWalletId(wallets: Pick<Wallet, "id">[]): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.lastWallet)
    return wallets.find((w) => w.id === stored)?.id ?? null
  } catch {
    return null
  }
}

export function rememberWallet(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.lastWallet, id)
  } catch {
    // ignore: private mode / storage blocked
  }
}
