import { useState, type FormEvent } from "react"
import { ArrowDown, Trash } from "lucide-react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { CategoryPicker } from "@/components/transactions/category-picker"
import { WalletPicker } from "@/components/transactions/wallet-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCategories } from "@/hooks/use-categories"
import { useDeleteRecurring, useSaveRecurring } from "@/hooks/use-recurring"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { todayWib } from "@/lib/format"
import { addRecurrence, frequencyLabels, frequencyUnit, recurrenceLabel } from "@/lib/recurrence"
import { cn } from "@/lib/utils"
import type { RecurrenceFrequency, RecurringTransaction, TransactionType } from "@/types"

const typeOptions: { value: TransactionType; label: string; className: string }[] = [
  { value: "expense", label: "Pengeluaran", className: "data-[active=true]:bg-red-600 data-[active=true]:text-white" },
  { value: "income", label: "Pemasukan", className: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white" },
  { value: "transfer", label: "Transfer", className: "data-[active=true]:bg-sky-600 data-[active=true]:text-white" },
]

const frequencies: RecurrenceFrequency[] = ["weekly", "monthly", "yearly"]

type FormErrors = Partial<Record<"name" | "amount" | "category" | "wallet" | "toWallet" | "nextDate" | "endDate", string>>

interface RecurringFormProps {
  recurring?: RecurringTransaction | null
  onDone: () => void
}

export function RecurringForm({ recurring, onDone }: RecurringFormProps) {
  const { data: allCategories = [] } = useCategories()
  const { data: wallets = [] } = useWallets()
  const save = useSaveRecurring()
  const remove = useDeleteRecurring()

  const [type, setType] = useState<TransactionType>(recurring?.type ?? "expense")
  const [name, setName] = useState(recurring?.name ?? "")
  const [amount, setAmount] = useState(recurring?.amount ?? 0)
  const [categoryId, setCategoryId] = useState<string | null>(recurring?.category_id ?? null)
  const [selectedWalletId, setWalletId] = useState<string | null>(recurring?.wallet_id ?? null)
  const [toWalletId, setToWalletId] = useState<string | null>(recurring?.to_wallet_id ?? null)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(recurring?.frequency ?? "monthly")
  const [intervalCount, setIntervalCount] = useState(recurring?.interval_count ?? 1)
  // Null while the user hasn't picked a date: it then follows the chosen frequency.
  const [manualNextDate, setNextDate] = useState<string | null>(recurring?.next_date ?? null)
  const [endDate, setEndDate] = useState(recurring?.end_date ?? "")
  const [note, setNote] = useState(recurring?.note ?? "")
  const [isActive, setIsActive] = useState(recurring?.is_active ?? true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const walletId = selectedWalletId ?? wallets[0]?.id ?? null
  const nextDate = manualNextDate ?? addRecurrence(todayWib(), frequency, intervalCount)
  const categories = allCategories.filter(
    (c) => c.type === type && (c.is_active || c.id === recurring?.category_id)
  )

  const changeType = (next: TransactionType) => {
    setType(next)
    setErrors({})
    const current = allCategories.find((c) => c.id === categoryId)
    if (current && current.type !== next) setCategoryId(null)
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {}
    if (!name.trim()) e.name = "Nama wajib diisi."
    if (amount <= 0) e.amount = "Nominal harus lebih dari 0."
    if (!walletId) e.wallet = "Pilih dompet."
    if (type === "transfer") {
      if (!toWalletId) e.toWallet = "Pilih dompet tujuan."
      else if (toWalletId === walletId) e.toWallet = "Dompet tujuan harus berbeda."
    } else if (!categoryId) {
      e.category = "Pilih kategori."
    }
    if (!nextDate) e.nextDate = "Tanggal wajib diisi."
    if (endDate && nextDate && endDate < nextDate) e.endDate = "Tanggal selesai tidak boleh sebelum jatuh tempo."
    return e
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      await save.mutateAsync({
        id: recurring?.id,
        name: name.trim(),
        type,
        amount,
        category_id: type === "transfer" ? null : categoryId,
        wallet_id: walletId!,
        to_wallet_id: type === "transfer" ? toWalletId : null,
        note: note.trim() || null,
        frequency,
        interval_count: intervalCount,
        next_date: nextDate,
        end_date: endDate || null,
        is_active: isActive,
      })
      toast.success(recurring ? "Tagihan diperbarui" : "Tagihan rutin ditambahkan")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!recurring) return
    try {
      await remove.mutateAsync(recurring.id)
      toast.success("Tagihan dihapus")
      setConfirmDelete(false)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div role="radiogroup" aria-label="Jenis" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {typeOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={type === o.value}
            data-active={type === o.value}
            onClick={() => changeType(o.value)}
            className={cn(
              "h-11 rounded-xl text-sm font-semibold text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:shadow-soft",
              o.className
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <Field label="Nama" htmlFor="recurring-name" error={errors.name}>
        <Input
          id="recurring-name"
          value={name}
          maxLength={60}
          placeholder="Misal: Listrik PLN, SPP Adik, Gaji"
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name) || undefined}
          className="h-11"
        />
      </Field>

      <Field label="Nominal" htmlFor="recurring-amount" error={errors.amount}>
        <AmountInput
          id="recurring-amount"
          size="lg"
          value={amount}
          onChange={setAmount}
          invalid={Boolean(errors.amount)}
        />
        <p className="text-xs text-muted-foreground">
          Untuk tagihan yang berubah-ubah (misal listrik), isi perkiraannya. Nominal bisa diubah saat dicatat.
        </p>
      </Field>

      {type === "transfer" ? (
        <div className="grid gap-2">
          <Field label="Dari dompet" htmlFor="recurring-wallet" error={errors.wallet}>
            <WalletPicker id="recurring-wallet" wallets={wallets} value={walletId} onChange={setWalletId} invalid={Boolean(errors.wallet)} />
          </Field>
          <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />
          <Field label="Ke dompet" htmlFor="recurring-to-wallet" error={errors.toWallet}>
            <WalletPicker
              id="recurring-to-wallet"
              wallets={wallets}
              value={toWalletId}
              onChange={setToWalletId}
              exclude={walletId}
              invalid={Boolean(errors.toWallet)}
              placeholder="Pilih dompet tujuan"
            />
          </Field>
        </div>
      ) : (
        <>
          <Field label="Kategori" error={errors.category}>
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} invalid={Boolean(errors.category)} />
          </Field>
          <Field label="Dompet" htmlFor="recurring-wallet" error={errors.wallet}>
            <WalletPicker id="recurring-wallet" wallets={wallets} value={walletId} onChange={setWalletId} invalid={Boolean(errors.wallet)} />
          </Field>
        </>
      )}

      <Field label="Berulang">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Frekuensi">
          {frequencies.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={frequency === f}
              onClick={() => setFrequency(f)}
              className={cn(
                "h-11 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                frequency === f
                  ? "bg-accent font-semibold text-accent-foreground ring-1 ring-primary/30"
                  : "bg-muted/60 hover:bg-muted"
              )}
            >
              {frequencyLabels[f]}
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span>Setiap</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={intervalCount}
            onChange={(e) => setIntervalCount(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
            className="h-10 w-20 text-center text-base"
            aria-label="Jarak pengulangan"
          />
          <span>{frequencyUnit(frequency)}</span>
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jatuh tempo berikutnya" htmlFor="recurring-next" error={errors.nextDate}>
          <Input
            id="recurring-next"
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            aria-invalid={Boolean(errors.nextDate) || undefined}
            className="h-12 text-base"
          />
          {manualNextDate === null && (
            <p className="text-xs text-muted-foreground">
              Otomatis {recurrenceLabel(frequency, intervalCount).toLowerCase()} dari hari ini. Ubah bila
              tanggalnya berbeda.
            </p>
          )}
        </Field>
        <Field label="Berakhir (opsional)" htmlFor="recurring-end" error={errors.endDate}>
          <Input
            id="recurring-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-invalid={Boolean(errors.endDate) || undefined}
            className="h-12 text-base"
          />
        </Field>
      </div>

      <Field label="Catatan transaksi (opsional)" htmlFor="recurring-note">
        <Textarea
          id="recurring-note"
          value={note}
          maxLength={200}
          rows={2}
          placeholder="Kosongkan untuk memakai nama sebagai catatan"
          onChange={(e) => setNote(e.target.value)}
          className="text-base"
        />
      </Field>

      {recurring && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 p-4">
          <div>
            <Label htmlFor="recurring-active" className="text-sm">Aktif</Label>
            <p className="text-xs text-muted-foreground">Tagihan nonaktif tidak muncul di daftar jatuh tempo.</p>
          </div>
          <Switch id="recurring-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {recurring ? (
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
        title={`Hapus "${recurring?.name ?? ""}"?`}
        description="Transaksi yang sudah pernah dicatat dari tagihan ini tetap tersimpan."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}
