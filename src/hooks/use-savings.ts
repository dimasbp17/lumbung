import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { SavingsEntry, SavingsGoal, SavingsGoalWithProgress } from "@/types"

const GOALS_KEY = ["savings-goals"] as const
const ENTRIES_KEY = ["savings-entries"] as const

export function useSavingsGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: async (): Promise<SavingsGoalWithProgress[]> => {
      const [goals, totals] = await Promise.all([
        supabase
          .from("savings_goals")
          .select("id, name, target_amount, target_date, icon, color, note, created_at")
          .order("created_at"),
        supabase.from("savings_goal_totals").select("goal_id, saved"),
      ])
      if (goals.error) throw goals.error
      if (totals.error) throw totals.error

      const savedById = new Map(totals.data.map((t) => [t.goal_id as string, Number(t.saved)]))
      return (goals.data as SavingsGoal[]).map((g) => ({
        ...g,
        target_amount: Number(g.target_amount),
        saved: savedById.get(g.id) ?? 0,
      }))
    },
  })
}

export type SavingsGoalInput = Pick<
  SavingsGoal,
  "name" | "target_amount" | "target_date" | "icon" | "color" | "note"
> & { id?: string }

export function useSaveSavingsGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: SavingsGoalInput) => {
      const { error } = id
        ? await supabase.from("savings_goals").update(values).eq("id", id)
        : await supabase.from("savings_goals").insert(values)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GOALS_KEY })
      qc.invalidateQueries({ queryKey: ENTRIES_KEY })
      // Entries that named a wallet were deleted too.
      qc.invalidateQueries({ queryKey: ["wallets"] })
    },
  })
}

export function useSavingsEntries(goalId: string | null) {
  return useQuery({
    queryKey: [...ENTRIES_KEY, goalId],
    enabled: Boolean(goalId),
    queryFn: async (): Promise<SavingsEntry[]> => {
      const { data, error } = await supabase
        .from("savings_entries")
        .select("id, goal_id, amount, date, wallet_id, note, recorded_by, created_at")
        .eq("goal_id", goalId!)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
      if (error) throw error
      return data.map((e) => ({ ...e, amount: Number(e.amount) }))
    },
  })
}

function useInvalidateEntries() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: GOALS_KEY })
    qc.invalidateQueries({ queryKey: ENTRIES_KEY })
    qc.invalidateQueries({ queryKey: ["wallets"] })
  }
}

export type SavingsEntryInput = Pick<
  SavingsEntry,
  "goal_id" | "amount" | "date" | "wallet_id" | "note" | "recorded_by"
>

export function useSaveSavingsEntry() {
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: async (values: SavingsEntryInput) => {
      const { error } = await supabase.from("savings_entries").insert(values)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteSavingsEntry() {
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_entries").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
