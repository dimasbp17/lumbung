import { useState, type FormEvent } from "react"
import { ArrowDown, Trash } from "lucide-react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { CategoryPicker } from "@/components/transactions/category-picker"
import { MemberPicker } from "@/components/transactions/member-picker"
import { WalletPicker } from "@/components/transactions/wallet-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCategories } from "@/hooks/use-categories"
import { useLastMember, useMembers } from "@/hooks/use-members"
import { useDeleteTransaction, useSaveTransaction } from "@/hooks/use-transactions"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { todayWib } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Transaction, TransactionType } from "@/types"

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
  const save = useSaveTransaction()
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
  const setWalletId = clearingErrors(setWalletIdState, "wallet", "toWallet")
  const setToWalletId = clearingErrors(setToWalletIdState, "toWallet")

  // Defaults follow the latest data until the user picks something
  // (wallet/member data may finish loading after the form opens).
  const walletId = selectedWalletId ?? wallets[0]?.id ?? null
  const recorder = selectedRecorder === undefined ? lastMemberId : selectedRecorder

  // Categories shown: active and of the current type. When editing, an old
  // category that has since been deactivated stays visible so it isn't lost.
  const categories = allCategories.filter(
    (c) => c.type === type && (c.is_active || c.id === transaction?.category_id)
  )

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
      toast.success(transaction ? "Transaksi diperbarui" : "Transaksi dicatat")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
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
          <Field label="Dari dompet" htmlFor="wallet" error={errors.wallet}>
            <WalletPicker
              id="wallet"
              wallets={wallets}
              value={walletId}
              onChange={setWalletId}
              invalid={Boolean(errors.wallet)}
            />
          </Field>
          <ArrowDown className="mx-auto size-5 text-muted-foreground" aria-hidden />
          <Field label="Ke dompet" htmlFor="to-wallet" error={errors.toWallet}>
            <WalletPicker
              id="to-wallet"
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
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              invalid={Boolean(errors.category)}
            />
          </Field>
          <Field label="Dompet" htmlFor="wallet" error={errors.wallet}>
            <WalletPicker
              id="wallet"
              wallets={wallets}
              value={walletId}
              onChange={setWalletId}
              invalid={Boolean(errors.wallet)}
            />
          </Field>
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
        <Button type="submit" size="lg" disabled={save.isPending} className="sm:min-w-40">
          {save.isPending ? "Menyimpan…" : "Simpan"}
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
