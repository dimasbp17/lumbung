import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { Category, CategoryType } from "@/types"

const QUERY_KEY = ["categories"] as const

/** All categories, including inactive ones (needed to display old transactions). */
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type, icon, color, is_active, sort_order")
        .order("sort_order")
        .order("name")
      if (error) throw error
      return data
    },
  })
}

export type CategoryInput = Pick<
  Category,
  "name" | "type" | "icon" | "color" | "is_active"
> & { id?: string }

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: CategoryInput) => {
      if (id) {
        const { error } = await supabase
          .from("categories")
          .update(values)
          .eq("id", id)
        if (error) throw error
        return
      }
      // New categories go to the end of the list.
      const { data: last } = await supabase
        .from("categories")
        .select("sort_order")
        .eq("type", values.type)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
      const { error } = await supabase
        .from("categories")
        .insert({ ...values, sort_order: (last?.sort_order ?? 0) + 1 })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export const categoryTypeLabels: Record<CategoryType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
}
