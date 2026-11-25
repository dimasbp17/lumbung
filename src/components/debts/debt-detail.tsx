import { useState } from "react"
import { HandCoins, Pencil, Trash } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/common/confirm-delete"
import { ProgressBar } from "@/components/common/progress-bar"
import { Loading } from "@/components/common/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDebtPayments, useDeleteDebtPayment } from "@/hooks/use-debts"
import { useLookups } from "@/hooks/use-lookups"
import { errorMessage } from "@/lib/error"
import { dueLabel, formatDate, formatRupiah, formatShortDate } from "@/lib/format"
import type { DebtPayment, DebtWithProgress } from "@/types"

interface DebtDetailProps {
  debt: DebtWithProgress
  onPay: () => void
  onEdit: () => void
}

export function DebtDetail({ debt, onPay, onEdit }: DebtDetailProps) {
  const payments = useDebtPayments(debt.id)
  const remove = useDeleteDebtPayment()
  const { lookups } = useLookups()
  const [toDelete, setToDelete] = useState<DebtPayment | null>(null)

  const remaining = debt.amount - debt.paid
  const settled = remaining <= 0
  const payable = debt.direction === "payable"
  const wallet = debt.wallet_id ? lookups.wallets.get(debt.wallet_id) : undefined

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await remove.mutateAsync(toDelete.id)
      toast.success("Pembayaran dihapus")
      setToDelete(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{settled ? "Lunas" : "Sisa"}</p>
          <p className="text-2xl font-bold tabular-nums">{formatRupiah(Math.max(remaining, 0))}</p>
          <p className="text-sm text-muted-foreground">
            {payable ? "Dipinjam dari" : "Dipinjamkan kepada"} {debt.person_name} · {formatDate(debt.date)}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={onEdit} aria-label="Ubah">
          <Pencil />
        </Button>
      </div>

      <div className="space-y-2">
        <ProgressBar value={debt.paid / debt.amount} label="Progres pembayaran" />
        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground tabular-nums">
          <span>
            Dibayar {formatRupiah(debt.paid)} dari {formatRupiah(debt.amount)}
          </span>
          {settled ? (
            <Badge>Lunas</Badge>
          ) : (
            debt.due_date && <span>Jatuh tempo: {dueLabel(debt.due_date)}</span>
          )}
        </div>
        {wallet && (
          <p className="text-sm text-muted-foreground">
            {payable ? "Uang masuk ke" : "Uang keluar dari"} {wallet.name}
          </p>
        )}
        {debt.note && <p className="text-sm text-muted-foreground">{debt.note}</p>}
      </div>

      {!settled && (
        <Button size="lg" onClick={onPay}>
          <HandCoins /> {payable ? "Catat pembayaran" : "Catat penerimaan"}
        </Button>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Riwayat pembayaran</h3>
        {payments.isPending ? (
          <Loading />
        ) : !payments.data?.length ? (
          <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            Belum ada pembayaran.
          </p>
        ) : (
          <ul className="space-y-0.5 rounded-2xl bg-muted/40 p-1.5">
            {payments.data.map((p) => {
              const w = p.wallet_id ? lookups.wallets.get(p.wallet_id) : undefined
              const details = [formatShortDate(p.date, true), w?.name, p.note].filter(Boolean).join(" · ")
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold tabular-nums">{formatRupiah(p.amount)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{details}</span>
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(p)} aria-label="Hapus pembayaran">
                    <Trash className="text-muted-foreground" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConfirmDelete
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Hapus pembayaran ini?"
        description="Sisa utang dan saldo dompet terkait akan dihitung ulang."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </div>
  )
}
