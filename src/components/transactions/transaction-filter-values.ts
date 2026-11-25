import type { TransactionType } from "@/types"

export type DateScope = "period" | "all" | "custom"

export interface TransactionFilterValues {
  type?: TransactionType
  categoryId?: string
  walletId?: string
  memberId?: string
  scope: DateScope
  /** Only for scope "custom" */
  start?: string
  end?: string
}

export const emptyFilters: TransactionFilterValues = { scope: "period" }

/** Number of active filters, for the badge on the filter button. */
export function countFilters(f: TransactionFilterValues): number {
  return [f.type, f.categoryId, f.walletId, f.memberId, f.scope !== "period" ? f.scope : undefined].filter(
    Boolean
  ).length
}
