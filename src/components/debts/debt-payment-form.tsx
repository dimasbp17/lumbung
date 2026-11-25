import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { Field } from "@/components/common/field"
import { WalletPicker } from "@/components/transactions/wallet-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSaveDebtPayment } from "@/hooks/use-debts"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { formatRupiah, todayWib } from "@/lib/format"
import type { DebtWithProgress } from "@/types"

interface DebtPaymentFormProps {
  debt: DebtWithProgress
  onDone: () => void
}

export function DebtPaymentForm({ debt, onDone }: DebtPaymentFormProps) {
  const save = useSaveDebtPayment()
  const { data: wallets = [] } = useWallets()
  const remaining = debt.amount - debt.paid
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayWib())
  const [walletId, setWalletId] = useState<string | null>(debt.wallet_id)
  const [note, setNote] = useState("")
  const [amountError, setAmountError] = useState<string>()

  const payable = debt.direction === "payable"

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (amount <= 0) return setAmountError("Nominal harus lebih dari 0.")
    if (amount > remaining) return setAmountError(`Maksimal ${formatRupiah(remaining)} (sisa yang belum dibayar).`)
    try {
      await save.mutateAsync({
        debt_id: debt.id,
        amount,
        date,
        wallet_id: walletId,
        note: note.trim() || null,
      })
      toast.success(amount === remaining ? "Lunas! Pembayaran dicatat" : "Pembayaran dicatat")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <Field label="Nominal pembayaran" htmlFor="payment-amount" error={amountError}>
        <AmountInput
          id="payment-amount"
          size="lg"
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setAmountError(undefined)
          }}
          invalid={Boolean(amountError)}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setAmount(remaining)}
          className="justify-self-start text-sm text-primary underline-offset-4 hover:underline"
        >
          Lunasi: {formatRupiah(remaining)}
        </button>
      </Field>

      <Field label="Tanggal" htmlFor="payment-date">
        <Input id="payment-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 text-base" />
      </Field>

      <Field label={payable ? "Dibayar dari dompet (opsional)" : "Diterima ke dompet (opsional)"} htmlFor="payment-wallet">
        <WalletPicker id="payment-wallet" wallets={wallets} value={walletId} onChange={setWalletId} noneLabel="Tidak terkait dompet" />
      </Field>

      <Field label="Catatan (opsional)" htmlFor="payment-note">
        <Textarea id="payment-note" value={note} maxLength={200} rows={2} onChange={(e) => setNote(e.target.value)} className="text-base" />
      </Field>

      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan pembayaran"}
      </Button>
    </form>
  )
}
