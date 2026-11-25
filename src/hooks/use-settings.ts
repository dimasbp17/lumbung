import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getPeriod } from "@/lib/period"
import { supabase } from "@/lib/supabase"
import type { Settings } from "@/types"

const QUERY_KEY = ["settings"] as const

export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Settings | null> => {
      const { data, error } = await supabase
        .from("settings")
        .select("user_id, period_start_day, timezone")
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function usePeriodStartDay(): number {
  return useSettings().data?.period_start_day ?? 1
}

/** The active monthly period; `offset` -1 = previous period, etc. */
export function usePeriod(offset = 0) {
  return getPeriod(usePeriodStartDay(), offset)
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Pick<Settings, "period_start_day">) => {
      const { error } = await supabase.from("settings").upsert(values)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
