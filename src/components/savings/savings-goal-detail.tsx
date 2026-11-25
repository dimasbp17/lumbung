import { useState } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Trash } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDelete } from "@/components/common/confirm-delete"
import { IconBadge } from "@/components/common/icon-badge"
import { ProgressBar } from "@/components/common/progress-bar"
import { Loading } from "@/components/common/status"
import { Button } from "@/components/ui/button"
import { useLookups } from "@/hooks/use-lookups"
import { useDeleteSavingsEntry, useSavingsEntries } from "@/hooks/use-savings"
import { errorMessage } from "@/lib/error"
import { formatDate, formatRupiah, formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SavingsEntry, SavingsGoalWithProgress } from "@/types"
import { monthlySuggestion } from "@/components/savings/savings-math"

interface SavingsGoalDetailProps {
  goal: SavingsGoalWithProgress
  onDeposit: () => void
  onWithdraw: () => void
  onEdit: () => void
}

export function SavingsGoalDetail({ goal, onDeposit, onWithdraw, onEdit }: SavingsGoalDetailProps) {
  const entries = useSavingsEntries(goal.id)
  const remove = useDeleteSavingsEntry()
  const { lookups } = useLookups()
  const [toDelete, setToDelete] = useState<SavingsEntry | null>(null)

  const ratio = goal.saved / goal.target_amount
  const remaining = goal.target_amount - goal.saved
  const perMonth = monthlySuggestion(goal)

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await remove.mutateAsync(toDelete.id)
      toast.success("Catatan dihapus")
      setToDelete(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <IconBadge icon={goal.icon} color={goal.color} size="lg" shape="square" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Terkumpul</p>
          <p className="text-2xl font-bold tabular-nums">{formatRupiah(goal.saved)}</p>
        </div>
        <Button variant="outline" size="icon" onClick={onEdit} aria-label="Ubah tujuan">
          <Pencil />
        </Button>
      </div>

      <div className="space-y-2">
        <ProgressBar value={ratio} color={goal.color} label="Progres tabungan" />
        <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
          <span>{Math.min(100, Math.round(ratio * 100))}% dari {formatRupiah(goal.target_amount)}</span>
          {remaining > 0 ? <span>Kurang {formatRupiah(remaining)}</span> : <span className="font-medium text-emerald-600 dark:text-emerald-400">Tercapai 🎉</span>}
        </div>
        {goal.target_date && (
          <p className="text-sm text-muted-foreground">
            Target: {formatDate(goal.target_date)}
            {perMonth !== null && ` · perlu sekitar ${formatRupiah(perMonth)} per bulan`}
          </p>
        )}
        {goal.note && <p className="text-sm text-muted-foreground">{goal.note}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" onClick={onDeposit}>
          <ArrowDownToLine /> Setor
        </Button>
        <Button size="lg" variant="outline" onClick={onWithdraw} disabled={goal.saved <= 0}>
          <ArrowUpFromLine /> Ambil
        </Button>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Riwayat</h3>
        {entries.isPending ? (
          <Loading />
        ) : !entries.data?.length ? (
          <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
            Belum ada setoran.
          </p>
        ) : (
          <ul className="space-y-0.5 rounded-2xl bg-muted/40 p-1.5">
            {entries.data.map((e) => {
              const wallet = e.wallet_id ? lookups.wallets.get(e.wallet_id) : undefined
              const member = e.recorded_by ? lookups.members.get(e.recorded_by) : undefined
              const details = [formatShortDate(e.date, true), wallet?.name, member?.name, e.note]
                .filter(Boolean)
                .join(" · ")
              return (
                <li key={e.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{e.amount > 0 ? "Setoran" : "Penarikan"}</span>
                    <span className="block truncate text-xs text-muted-foreground">{details}</span>
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      e.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {e.amount > 0 ? "+" : "−"}
                    {formatRupiah(Math.abs(e.amount))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setToDelete(e)}
                    aria-label="Hapus catatan"
                  >
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
        title="Hapus catatan ini?"
        description="Jumlah terkumpul dan saldo dompet terkait akan dihitung ulang."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </div>
  )
}
