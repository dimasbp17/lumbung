import { createContext, useContext } from "react"

import type { Transaction, TransactionType } from "@/types"

export interface TransactionFormState {
  /** Opens the form to add (no argument) or edit (with a transaction). */
  openForm: (transaction?: Transaction) => void
  /** Opens the form for a new transaction of a given type, e.g. "transfer". */
  openFormWithType: (type: TransactionType) => void
}

export const TransactionFormContext = createContext<TransactionFormState | null>(null)

export function useTransactionForm() {
  const ctx = useContext(TransactionFormContext)
  if (!ctx) throw new Error("useTransactionForm must be used inside <TransactionFormProvider>")
  return ctx
}
