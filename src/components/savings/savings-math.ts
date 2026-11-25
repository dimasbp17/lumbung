import { fromIso, todayWib } from "@/lib/format"
import type { SavingsGoalWithProgress } from "@/types"

/**
 * Roughly how much must be saved per month to reach the target by its date.
 * null when there is no target date or nothing left to save.
 */
export function monthlySuggestion(goal: SavingsGoalWithProgress): number | null {
  const remaining = goal.target_amount - goal.saved
  if (!goal.target_date || remaining <= 0) return null
  const today = fromIso(todayWib())
  const target = fromIso(goal.target_date)
  const months =
    (target.getUTCFullYear() - today.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - today.getUTCMonth())
  return Math.ceil(remaining / Math.max(months, 1))
}
