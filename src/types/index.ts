export type TransactionType = "income" | "expense" | "transfer"
export type CategoryType = Exclude<TransactionType, "transfer">
export type WalletType = "cash" | "bank" | "ewallet" | "other"

export interface Settings {
  user_id: string
  /** Day of month the monthly period starts, 1..28 */
  period_start_day: number
  timezone: string
}

export interface Member {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Wallet {
  id: string
  name: string
  type: WalletType
  icon: string
  color: string
  /** Rupiah, integer */
  initial_balance: number
  created_at: string
}

export interface WalletWithBalance extends Wallet {
  /** Rupiah, integer — initial balance + transactions */
  balance: number
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  is_active: boolean
  sort_order: number
}

export interface Transaction {
  id: string
  type: TransactionType
  /** Rupiah, integer, always > 0 */
  amount: number
  /** "YYYY-MM-DD" (WIB date) */
  date: string
  category_id: string | null
  wallet_id: string
  to_wallet_id: string | null
  note: string | null
  recorded_by: string | null
  created_at: string
}

export type NewTransaction = Omit<Transaction, "id" | "created_at">

// ---------------------------------------------------------------------------
// Phase 2
// ---------------------------------------------------------------------------

export interface Budget {
  id: string
  category_id: string
  /** Spending limit per period, Rupiah */
  amount: number
}

export interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  /** "YYYY-MM-DD" or null */
  target_date: string | null
  icon: string
  color: string
  note: string | null
  created_at: string
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  /** Sum of all entries (deposits − withdrawals) */
  saved: number
}

export interface SavingsEntry {
  id: string
  goal_id: string
  /** > 0 deposit, < 0 withdrawal */
  amount: number
  date: string
  wallet_id: string | null
  note: string | null
  recorded_by: string | null
  created_at: string
}

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly"

export interface RecurringTransaction {
  id: string
  name: string
  type: TransactionType
  amount: number
  category_id: string | null
  wallet_id: string
  to_wallet_id: string | null
  note: string | null
  frequency: RecurrenceFrequency
  interval_count: number
  start_date: string
  next_date: string
  end_date: string | null
  is_active: boolean
}

export type DebtDirection = "payable" | "receivable"

export interface Debt {
  id: string
  direction: DebtDirection
  person_name: string
  amount: number
  date: string
  due_date: string | null
  wallet_id: string | null
  note: string | null
  created_at: string
}

export interface DebtWithProgress extends Debt {
  paid: number
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  date: string
  wallet_id: string | null
  note: string | null
  created_at: string
}
