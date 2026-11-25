import { useState, type FormEvent } from "react"
import { Trash } from "lucide-react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { ColorPicker } from "@/components/common/color-picker"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { IconBadge } from "@/components/common/icon-badge"
import { IconPicker } from "@/components/common/icon-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useDeleteWallet,
  useSaveWallet,
  walletTypeLabels,
} from "@/hooks/use-wallets"
import { WalletBalanceSummary } from "@/components/wallets/wallet-balance-summary"
import { errorMessage } from "@/lib/error"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { WalletType, WalletWithBalance } from "@/types"

const defaultIcons: Record<WalletType, string> = {
  cash: "banknote",
  bank: "landmark",
  ewallet: "smartphone",
  other: "wallet",
}

interface WalletFormProps {
  wallet?: WalletWithBalance | null
  onDone: () => void
}

export function WalletForm({ wallet, onDone }: WalletFormProps) {
  const save = useSaveWallet()
  const remove = useDeleteWallet()
  const [name, setName] = useState(wallet?.name ?? "")
  const [type, setType] = useState<WalletType>(wallet?.type ?? "cash")
  const [icon, setIcon] = useState(wallet?.icon ?? "banknote")
  const [color, setColor] = useState(wallet?.color ?? "#16a34a")
  const [initialBalance, setInitialBalance] = useState(wallet?.initial_balance ?? 0)
  const [nameError, setNameError] = useState<string>()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const changeType = (next: WalletType) => {
    // The icon follows the type unless the user picked one themselves.
    if (icon === defaultIcons[type]) setIcon(defaultIcons[next])
    setType(next)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setNameError("Nama dompet wajib diisi.")
    setNameError(undefined)
    try {
      await save.mutateAsync({
        id: wallet?.id,
        name: name.trim(),
        type,
        icon,
        color,
        initial_balance: initialBalance,
      })
      toast.success(wallet ? "Dompet diperbarui" : "Dompet ditambahkan")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!wallet) return
    try {
      await remove.mutateAsync(wallet.id)
      toast.success("Dompet dihapus")
      setConfirmDelete(false)
      onDone()
    } catch (err) {
      setConfirmDelete(false)
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="flex items-center gap-3">
        <IconBadge icon={icon} color={color} size="lg" shape="square" />
        <Field label="Nama dompet" htmlFor="wallet-name" error={nameError} className="flex-1">
          <Input
            id="wallet-name"
            value={name}
            maxLength={40}
            placeholder="Misal: Rekening BRI"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError) || undefined}
            className="h-11"
          />
        </Field>
      </div>

      <Field label="Jenis">
        <div role="radiogroup" aria-label="Jenis dompet" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(walletTypeLabels) as WalletType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => changeType(t)}
              className={cn(
                "h-12 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                type === t
                  ? "bg-accent font-semibold text-accent-foreground ring-1 ring-primary/30"
                  : "bg-muted/60 hover:bg-muted"
              )}
            >
              {walletTypeLabels[t]}
            </button>
          ))}
        </div>
      </Field>

      {wallet ? (
        <>
          <WalletBalanceSummary wallet={wallet} />

          <Field label="Saldo awal (saat mulai dicatat)" htmlFor="initial-balance">
            <AmountInput id="initial-balance" value={initialBalance} onChange={setInitialBalance} className="h-11" />
            <p className="text-xs text-muted-foreground">
              Jumlah uang di dompet ini ketika pertama kali mulai memakai Lumbung. Ubah hanya jika dulu
              salah mengisinya.
            </p>
            {initialBalance !== wallet.initial_balance && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                Saldo saat ini akan menjadi{" "}
                <strong className="tabular-nums">
                  {formatRupiah(wallet.balance - wallet.initial_balance + initialBalance)}
                </strong>
                . Untuk gaji, belanja, atau tarik tunai, gunakan <strong>Catat transaksi</strong> — jangan
                mengubah saldo awal.
              </p>
            )}
          </Field>
        </>
      ) : (
        <Field label="Saldo sekarang" htmlFor="initial-balance">
          <AmountInput id="initial-balance" value={initialBalance} onChange={setInitialBalance} className="h-11" />
          <p className="text-xs text-muted-foreground">
            Isi jumlah uang yang ada di dompet ini saat ini (boleh 0). Setelah itu saldo berubah otomatis
            setiap kali Anda mencatat pemasukan, pengeluaran, atau transfer.
          </p>
        </Field>
      )}

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="Ikon">
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {wallet ? (
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
        title={`Hapus dompet "${wallet?.name ?? ""}"?`}
        description="Dompet hanya bisa dihapus jika belum memiliki transaksi."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}
