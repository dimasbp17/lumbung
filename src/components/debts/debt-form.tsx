import { useState, type FormEvent } from "react"
import { Trash } from "lucide-react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { WalletPicker } from "@/components/transactions/wallet-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDeleteDebt, useSaveDebt } from "@/hooks/use-debts"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { todayWib } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Debt, DebtDirection } from "@/types"

const directionOptions: { value: DebtDirection; label: string; hint: string }[] = [
  { value: "payable", label: "Utang", hint: "Kami meminjam" },
  { value: "receivable", label: "Piutang", hint: "Kami meminjamkan" },
]

interface DebtFormProps {
  debt?: Debt | null
  initialDirection?: DebtDirection
  onDone: () => void
  onDeleted?: () => void
}

export function DebtForm({ debt, initialDirection = "payable", onDone, onDeleted }: DebtFormProps) {
  const save = useSaveDebt()
  const remove = useDeleteDebt()
  const { data: wallets = [] } = useWallets()
  const [direction, setDirection] = useState<DebtDirection>(debt?.direction ?? initialDirection)
  const [person, setPerson] = useState(debt?.person_name ?? "")
  const [amount, setAmount] = useState(debt?.amount ?? 0)
  const [date, setDate] = useState(debt?.date ?? todayWib())
  const [dueDate, setDueDate] = useState(debt?.due_date ?? "")
  const [walletId, setWalletId] = useState<string | null>(debt?.wallet_id ?? null)
  const [note, setNote] = useState(debt?.note ?? "")
  const [errors, setErrors] = useState<{ person?: string; amount?: string; dueDate?: string }>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const payable = direction === "payable"

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (!person.trim()) found.person = "Nama wajib diisi."
    if (amount <= 0) found.amount = "Nominal harus lebih dari 0."
    if (dueDate && dueDate < date) found.dueDate = "Jatuh tempo tidak boleh sebelum tanggal pinjam."
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      await save.mutateAsync({
        id: debt?.id,
        direction,
        person_name: person.trim(),
        amount,
        date,
        due_date: dueDate || null,
        wallet_id: walletId,
        note: note.trim() || null,
      })
      toast.success(debt ? "Data diperbarui" : payable ? "Utang dicatat" : "Piutang dicatat")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!debt) return
    try {
      await remove.mutateAsync(debt.id)
      toast.success("Data dihapus")
      setConfirmDelete(false)
      onDeleted?.()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div role="radiogroup" aria-label="Jenis" className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {directionOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={direction === o.value}
            onClick={() => setDirection(o.value)}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              direction === o.value ? "bg-card font-semibold shadow-soft" : "text-muted-foreground"
            )}
          >
            {o.label}
            <span className="text-xs font-normal text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>

      <Field label={payable ? "Meminjam dari" : "Dipinjamkan kepada"} htmlFor="debt-person" error={errors.person}>
        <Input
          id="debt-person"
          value={person}
          maxLength={60}
          placeholder="Misal: Pak Budi, Koperasi"
          onChange={(e) => setPerson(e.target.value)}
          aria-invalid={Boolean(errors.person) || undefined}
          className="h-11"
        />
      </Field>

      <Field label="Nominal" htmlFor="debt-amount" error={errors.amount}>
        <AmountInput id="debt-amount" size="lg" value={amount} onChange={setAmount} invalid={Boolean(errors.amount)} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tanggal" htmlFor="debt-date">
          <Input id="debt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 text-base" />
        </Field>
        <Field label="Jatuh tempo (opsional)" htmlFor="debt-due" error={errors.dueDate}>
          <Input
            id="debt-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-invalid={Boolean(errors.dueDate) || undefined}
            className="h-12 text-base"
          />
        </Field>
      </div>

      <Field label={payable ? "Uang masuk ke dompet (opsional)" : "Uang keluar dari dompet (opsional)"} htmlFor="debt-wallet">
        <WalletPicker id="debt-wallet" wallets={wallets} value={walletId} onChange={setWalletId} noneLabel="Tidak terkait dompet" />
        <p className="text-xs text-muted-foreground">
          Pilih dompet jika uangnya benar-benar berpindah, agar saldo dompet ikut menyesuaikan.
        </p>
      </Field>

      <Field label="Catatan (opsional)" htmlFor="debt-note">
        <Textarea id="debt-note" value={note} maxLength={200} rows={2} onChange={(e) => setNote(e.target.value)} className="text-base" />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {debt ? (
          <Button type="button" variant="destructive" size="lg" onClick={() => setConfirmDelete(true)}>
            <Trash /> Hapus
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={save.isPending} className="sm:min-w-40">
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      <ConfirmDelete
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Hapus ${payable ? "utang" : "piutang"} dengan ${debt?.person_name ?? ""}?`}
        description="Semua catatan pembayarannya ikut terhapus. Saldo dompet yang terkait akan dihitung ulang."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}
