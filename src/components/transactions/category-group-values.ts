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
}

const typeOrder: Record<TransactionType, number> = { expense: 0, income: 1, transfer: 2 }

/**
 * Sums transactions per category (transfers form a single group): expenses
 * first, then income, then transfers; largest total first within each type.
 */
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
      }
      groups.set(key, group)
    }
    group.count += 1
    group.total += t.amount
  }
  return [...groups.values()].sort(
    (a, b) => typeOrder[a.type] - typeOrder[b.type] || b.total - a.total
  )
}

export interface DayCategoryGroups {
  date: string
  transactions: Transaction[]
  groups: CategoryGroup[]
}

/** Per day (in the input's order, i.e. newest first), the day's transactions summed per category. */
export function groupByDayAndCategory(transactions: Transaction[], lookups: Lookups): DayCategoryGroups[] {
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const items = byDate.get(t.date)
    if (items) items.push(t)
    else byDate.set(t.date, [t])
  }
  return [...byDate.entries()].map(([date, items]) => ({
    date,
    transactions: items,
    groups: groupByCategory(items, lookups),
  }))
}
