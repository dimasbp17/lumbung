import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { Field } from "@/components/common/field"
import { WalletPicker } from "@/components/transactions/wallet-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLastMember } from "@/hooks/use-members"
import { useSaveSavingsEntry } from "@/hooks/use-savings"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { formatRupiah, todayWib } from "@/lib/format"
import type { SavingsGoalWithProgress } from "@/types"

interface SavingsEntryFormProps {
  goal: SavingsGoalWithProgress
  kind: "deposit" | "withdraw"
  onDone: () => void
}

export function SavingsEntryForm({ goal, kind, onDone }: SavingsEntryFormProps) {
  const save = useSaveSavingsEntry()
  const { data: wallets = [] } = useWallets()
  const { memberId } = useLastMember()
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayWib())
  const [walletId, setWalletId] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [amountError, setAmountError] = useState<string>()

  const deposit = kind === "deposit"
  const remaining = Math.max(goal.target_amount - goal.saved, 0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (amount <= 0) return setAmountError("Nominal harus lebih dari 0.")
    if (!deposit && amount > goal.saved)
      return setAmountError(`Maksimal ${formatRupiah(goal.saved)} (jumlah yang terkumpul).`)
    setAmountError(undefined)

    try {
      await save.mutateAsync({
        goal_id: goal.id,
        amount: deposit ? amount : -amount,
        date,
        wallet_id: walletId,
        note: note.trim() || null,
        recorded_by: memberId,
      })
      toast.success(deposit ? "Setoran dicatat" : "Penarikan dicatat")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <Field label={deposit ? "Nominal setoran" : "Nominal penarikan"} htmlFor="entry-amount" error={amountError}>
        <AmountInput
          id="entry-amount"
          size="lg"
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setAmountError(undefined)
          }}
          invalid={Boolean(amountError)}
          autoFocus
        />
        {deposit && remaining > 0 && (
          <button
            type="button"
            onClick={() => setAmount(remaining)}
            className="justify-self-start text-sm text-primary underline-offset-4 hover:underline"
          >
            Isi sisa target: {formatRupiah(remaining)}
          </button>
        )}
      </Field>

      <Field label="Tanggal" htmlFor="entry-date">
        <Input
          id="entry-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 text-base"
        />
      </Field>

      <Field label={deposit ? "Diambil dari dompet (opsional)" : "Dikembalikan ke dompet (opsional)"} htmlFor="entry-wallet">
        <WalletPicker
          id="entry-wallet"
          wallets={wallets}
          value={walletId}
          onChange={setWalletId}
          noneLabel="Tidak terkait dompet"
        />
        <p className="text-xs text-muted-foreground">
          {deposit
            ? "Jika dipilih, saldo dompet berkurang sebesar setoran ini."
            : "Jika dipilih, saldo dompet bertambah sebesar penarikan ini."}
        </p>
      </Field>

      <Field label="Catatan (opsional)" htmlFor="entry-note">
        <Textarea
          id="entry-note"
          value={note}
          maxLength={200}
          rows={2}
          onChange={(e) => setNote(e.target.value)}
          className="text-base"
        />
      </Field>

      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Menyimpan…" : deposit ? "Simpan setoran" : "Simpan penarikan"}
      </Button>
    </form>
  )
}
