import type { Lookups } from "@/hooks/use-lookups"
import type { Transaction, TransactionType } from "@/types"

/** Group key: a category id, or "transfer" for transfers (they have no category). */
export const TRANSFER_GROUP = "transfer"

export interface CategoryGroup {
  key: string
  type: TransactionType
  name: string
  icon: string | null
  color: string
  count: number
  total: number
  /** Newest transaction date in the group (ISO) */
  lastDate: string
}

/** Sums transactions per category (transfers form a single group), largest total first. */
export function groupByCategory(transactions: Transaction[], lookups: Lookups): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>()
  for (const t of transactions) {
    const key = t.type === "transfer" ? TRANSFER_GROUP : (t.category_id ?? "none")
    let group = groups.get(key)
    if (!group) {
      const category = t.category_id ? lookups.categories.get(t.category_id) : undefined
      group = {
        key,
        type: t.type,
        name: t.type === "transfer" ? "Transfer" : (category?.name ?? "Tanpa kategori"),
        icon: category?.icon ?? null,
        color: category?.color ?? "#64748b",
        count: 0,
        total: 0,
        lastDate: t.date,
      }
      groups.set(key, group)
    }
    group.count += 1
    group.total += t.amount
    if (t.date > group.lastDate) group.lastDate = t.date
  }
  return [...groups.values()].sort((a, b) => b.total - a.total)
}
