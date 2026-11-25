import { useState, type FormEvent } from "react"
import { ArrowDown, Trash } from "lucide-react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { CategoryPicker } from "@/components/transactions/category-picker"
import { MemberPicker } from "@/components/transactions/member-picker"
import { WalletChips } from "@/components/transactions/wallet-chips"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCategories } from "@/hooks/use-categories"
import { useLastMember, useMembers } from "@/hooks/use-members"
import {
  findMatchingBill,
  useRecurringTransactions,
  useSkipRecurring,
} from "@/hooks/use-recurring"
import { useDeleteTransaction, useSaveTransaction } from "@/hooks/use-transactions"
import { lastWalletId, rememberWallet, useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { dueLabel, formatRupiah, formatShortDate, todayWib } from "@/lib/format"
import { nextRecurrenceDate } from "@/lib/recurrence"
import { cn } from "@/lib/utils"
import type { RecurringTransaction, Transaction, TransactionType } from "@/types"

interface TransactionFormProps {
  /** Set when editing an existing transaction */
  transaction?: Transaction | null
  /** Initial type for a new transaction (e.g. "transfer" from the Wallets page) */
  initialType?: TransactionType
  onDone: () => void
}

const typeOptions: { value: TransactionType; label: string; className: string }[] = [
  {
    value: "expense",
    label: "Pengeluaran",
    className: "data-[active=true]:bg-red-600 data-[active=true]:text-white",
  },
  {
    value: "income",
    label: "Pemasukan",
    className: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white",
  },
  {
    value: "transfer",
    label: "Transfer",
    className: "data-[active=true]:bg-sky-600 data-[active=true]:text-white",
  },
]

type FormErrors = Partial<Record<"amount" | "date" | "category" | "wallet" | "toWallet", string>>

export function TransactionForm({ transaction, initialType, onDone }: TransactionFormProps) {
  const { data: allCategories = [] } = useCategories()
  const { data: wallets = [] } = useWallets()
  const { data: members = [] } = useMembers()
  const { memberId: lastMemberId, setLastMember } = useLastMember()
  const { data: bills = [] } = useRecurringTransactions()
  const save = useSaveTransaction()
  const skipBill = useSkipRecurring()
  const remove = useDeleteTransaction()

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? initialType ?? "expense"
  )
  const [amount, setAmountState] = useState(transaction?.amount ?? 0)
  const [date, setDateState] = useState(transaction?.date ?? todayWib())
  const [categoryId, setCategoryIdState] = useState<string | null>(transaction?.category_id ?? null)
  const [selectedWalletId, setWalletIdState] = useState<string | null>(transaction?.wallet_id ?? null)
  const [toWalletId, setToWalletIdState] = useState<string | null>(transaction?.to_wallet_id ?? null)
  const [note, setNote] = useState(transaction?.note ?? "")
  const [selectedRecorder, setRecorder] = useState<string | null | undefined>(
    transaction ? transaction.recorded_by : undefined
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Bill the user said this transaction does NOT pay (switch turned off).
  const [declinedBillId, setDeclinedBillId] = useState<string | null>(null)

  // A field's error message disappears as soon as that field changes.
  const clearingErrors =
    <T,>(set: (v: T) => void, ...keys: (keyof FormErrors)[]) =>
    (v: T) => {
      set(v)
      setErrors((prev) => {
        const next = { ...prev }
        for (const k of keys) delete next[k]
        return next
      })
    }
  const setAmount = clearingErrors(setAmountState, "amount")
  const setDate = clearingErrors(setDateState, "date")
  const setCategoryId = clearingErrors(setCategoryIdState, "category")
  const setWalletId = clearingErrors((id: string | null) => {
    setWalletIdState(id)
    // A transfer can't go to the same wallet: drop the destination if it now matches.
    if (id && id === toWalletId) setToWalletIdState(null)
  }, "wallet", "toWallet")
  const setToWalletId = clearingErrors(setToWalletIdState, "toWallet")

  // Defaults follow the latest data until the user picks something
  // (wallet/member data may finish loading after the form opens).
  // Wallet: the one last used on this device, otherwise the first wallet.
  const walletId = selectedWalletId ?? lastWalletId(wallets) ?? wallets[0]?.id ?? null
  const recorder = selectedRecorder === undefined ? lastMemberId : selectedRecorder

  // Categories shown: active and of the current type. When editing, an old
  // category that has since been deactivated stays visible so it isn't lost.
  const categories = allCategories.filter(
    (c) => c.type === type && (c.is_active || c.id === transaction?.category_id)
  )

  // A new transaction in the same category as a due bill is probably paying it:
  // offer to mark the bill paid so it isn't recorded twice.
  const matchingBill = transaction ? null : findMatchingBill(bills, { type, categoryId, date })
  const paysBill = matchingBill !== null && matchingBill.id !== declinedBillId

  const changeType = (next: TransactionType) => {
    setType(next)
    setErrors({})
    const current = allCategories.find((c) => c.id === categoryId)
    if (current && current.type !== next) setCategoryIdState(null)
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {}
    if (!Number.isInteger(amount) || amount <= 0) e.amount = "Nominal harus lebih dari 0."
    if (!date) e.date = "Tanggal wajib diisi."
    if (!walletId) e.wallet = "Pilih dompet."
    if (type === "transfer") {
      if (!toWalletId) e.toWallet = "Pilih dompet tujuan."
      else if (toWalletId === walletId) e.toWallet = "Dompet tujuan harus berbeda."
    } else if (!categoryId) {
      e.category = "Pilih kategori."
    }
    return e
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      await save.mutateAsync({
        id: transaction?.id,
        type,
        amount,
        date,
        category_id: type === "transfer" ? null : categoryId,
        wallet_id: walletId!,
        to_wallet_id: type === "transfer" ? toWalletId : null,
        note: note.trim() || null,
        recorded_by: recorder,
      })
      if (recorder) setLastMember(recorder)
      if (type !== "transfer") rememberWallet(walletId!)
    } catch (err) {
      toast.error(errorMessage(err))
      return
    }

    if (paysBill) {
      // Moves the bill's due date on without creating a second transaction.
      try {
        await skipBill.mutateAsync(matchingBill.id)
        toast.success(`Transaksi dicatat, "${matchingBill.name}" ditandai lunas`)
      } catch (err) {
        toast.error(
          `Transaksi dicatat, tapi "${matchingBill.name}" gagal ditandai lunas: ${errorMessage(err)}. Tekan Lewati di halaman Tagihan rutin.`
        )
      }
    } else {
      toast.success(transaction ? "Transaksi diperbarui" : "Transaksi dicatat")
    }
    onDone()
  }

  const handleDelete = async () => {
    if (!transaction) return
    try {
      await remove.mutateAsync(transaction.id)
      toast.success("Transaksi dihapus")
      setConfirmDelete(false)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div
        role="radiogroup"
        aria-label="Jenis transaksi"
        className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1"
      >
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

      <Field label="Nominal" htmlFor="amount" error={errors.amount}>
        <AmountInput
          id="amount"
          size="lg"
          value={amount}
          onChange={setAmount}
          invalid={Boolean(errors.amount)}
          autoFocus={!transaction}
        />
      </Field>

      {type === "transfer" ? (
        <div className="grid gap-2">
          <Field label="Dari dompet" error={errors.wallet}>
            <WalletChips
              label="Dari dompet"
              wallets={wallets}
              value={walletId}
              onChange={setWalletId}
              invalid={Boolean(errors.wallet)}
            />
          </Field>
          <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />
          <Field label="Ke dompet" error={errors.toWallet}>
            <WalletChips
              label="Ke dompet"
              wallets={wallets}
              value={toWalletId}
              onChange={setToWalletId}
              exclude={walletId}
              invalid={Boolean(errors.toWallet)}
            />
          </Field>
        </div>
      ) : (
        <>
          <Field label="Dompet" error={errors.wallet}>
            <WalletChips
              label="Dompet"
              wallets={wallets}
              value={walletId}
              onChange={setWalletId}
              invalid={Boolean(errors.wallet)}
            />
          </Field>
          <Field label="Kategori" error={errors.category}>
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              invalid={Boolean(errors.category)}
            />
          </Field>
          {matchingBill && (
            <BillPaymentToggle
              bill={matchingBill}
              checked={paysBill}
              onCheckedChange={(on) => setDeclinedBillId(on ? null : matchingBill.id)}
            />
          )}
        </>
      )}

      <Field label="Tanggal" htmlFor="date" error={errors.date}>
        <Input
          id="date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={Boolean(errors.date) || undefined}
          className="h-12 text-base"
        />
      </Field>

      <Field label="Catatan (opsional)" htmlFor="note">
        <Textarea
          id="note"
          value={note}
          maxLength={200}
          rows={2}
          placeholder="Misal: belanja di pasar"
          onChange={(e) => setNote(e.target.value)}
          className="text-base"
        />
      </Field>

      {members.length > 0 && (
        <Field label="Dicatat oleh">
          <MemberPicker members={members} value={recorder} onChange={setRecorder} />
        </Field>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {transaction ? (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash /> Hapus
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          size="lg"
          disabled={save.isPending || skipBill.isPending}
          className="sm:min-w-40"
        >
          {save.isPending || skipBill.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      <ConfirmDelete
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus transaksi ini?"
        description="Transaksi yang dihapus tidak bisa dikembalikan. Saldo dompet akan dihitung ulang."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}

interface BillPaymentToggleProps {
  bill: RecurringTransaction
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** "Is this the payment for <bill>?" — marking it paid moves the bill to its next due date. */
function BillPaymentToggle({ bill, checked, onCheckedChange }: BillPaymentToggleProps) {
  const next = nextRecurrenceDate(bill.start_date, bill.frequency, bill.interval_count, bill.next_date)
  const finishes = bill.end_date !== null && next > bill.end_date
  return (
    <label
      htmlFor="pays-bill"
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-primary/30 bg-accent/60 p-4"
    >
      <span className="min-w-0 text-sm">
        <span className="block font-semibold">Ini pembayaran "{bill.name}"?</span>
        <span className="block text-muted-foreground">
          Tagihan {formatRupiah(bill.amount)}, jatuh tempo {formatShortDate(bill.next_date)} (
          {dueLabel(bill.next_date).toLowerCase()}).{" "}
          {checked
            ? finishes
              ? "Tagihan ditandai lunas dan selesai."
              : `Tagihan ditandai lunas, jatuh tempo berikutnya ${formatShortDate(next, true)}.`
            : "Tagihan tetap menunggu dibayar."}
        </span>
      </span>
      <Switch id="pays-bill" checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
    </label>
  )
}
