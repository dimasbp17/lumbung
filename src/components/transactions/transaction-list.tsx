import { useMemo } from "react"

import { SignedAmount } from "@/components/transactions/transaction-amount"
import { TransactionCard } from "@/components/transactions/transaction-card"
import type { Lookups } from "@/hooks/use-lookups"
import { summarizeTransactions } from "@/hooks/use-transactions"
import { relativeDateLabel } from "@/lib/format"
import type { Transaction } from "@/types"

interface TransactionListProps {
  transactions: Transaction[]
  lookups: Lookups
  onSelect: (t: Transaction) => void
}

/** Transactions grouped by date, with a daily total. */
export function TransactionList({ transactions, lookups, onSelect }: TransactionListProps) {
  const groups = useMemo(() => {
    const byDate = new Map<string, Transaction[]>()
    for (const t of transactions) {
      const items = byDate.get(t.date)
      if (items) items.push(t)
      else byDate.set(t.date, [t])
    }
    return [...byDate.entries()]
  }, [transactions])

  return (
    <div className="space-y-5">
      {groups.map(([date, items]) => {
        const { net } = summarizeTransactions(items)
        return (
          <section key={date}>
            <header className="mb-2 flex items-center justify-between gap-2 px-1">
              <h3 className="text-sm font-semibold text-muted-foreground">{relativeDateLabel(date)}</h3>
              <SignedAmount value={net} className="text-sm" />
            </header>
            <div className="surface space-y-0.5 p-2">
              {items.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  lookups={lookups}
                  onClick={onSelect}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
