import { useCallback, useState, type ReactNode } from "react"

import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { TransactionFormContext } from "@/providers/transaction-form-context"
import type { Transaction, TransactionType } from "@/types"

/** Provides a single transaction form dialog that can be opened from any page. */
export function TransactionFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [initialType, setInitialType] = useState<TransactionType | undefined>()
  // New key on every open so the form always starts fresh.
  const [formKey, setFormKey] = useState(0)

  const openForm = useCallback((t?: Transaction) => {
    setTransaction(t ?? null)
    setInitialType(undefined)
    setFormKey((k) => k + 1)
    setOpen(true)
  }, [])

  const openFormWithType = useCallback((type: TransactionType) => {
    setTransaction(null)
    setInitialType(type)
    setFormKey((k) => k + 1)
    setOpen(true)
  }, [])

  return (
    <TransactionFormContext.Provider value={{ openForm, openFormWithType }}>
      {children}
      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={transaction ? "Ubah transaksi" : "Catat transaksi"}
        description="Isi nominal, kategori, dompet, dan tanggal transaksi."
      >
        <TransactionForm
          key={formKey}
          transaction={transaction}
          initialType={initialType}
          onDone={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </TransactionFormContext.Provider>
  )
}
