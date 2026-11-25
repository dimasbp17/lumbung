import { useState } from "react"
import { PiggyBank, Plus } from "lucide-react"

import { IconBadge } from "@/components/common/icon-badge"
import { ProgressBar } from "@/components/common/progress-bar"
import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { PageHeader } from "@/components/layout/page-header"
import { SavingsEntryForm } from "@/components/savings/savings-entry-form"
import { SavingsGoalDetail } from "@/components/savings/savings-goal-detail"
import { SavingsGoalForm } from "@/components/savings/savings-goal-form"
import { monthlySuggestion } from "@/components/savings/savings-math"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSavingsGoals } from "@/hooks/use-savings"
import { errorMessage } from "@/lib/error"
import { dueLabel, formatRupiah } from "@/lib/format"

type SheetView =
  | { mode: "create" }
  | { mode: "detail" | "edit" | "deposit" | "withdraw"; goalId: string }

const titles: Record<SheetView["mode"], string> = {
  create: "Tujuan tabungan baru",
  detail: "",
  edit: "Ubah tujuan",
  deposit: "Setor tabungan",
  withdraw: "Ambil tabungan",
}

export function SavingsPage() {
  const { data: goals = [], isPending, error } = useSavingsGoals()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<SheetView>({ mode: "create" })
  const [formKey, setFormKey] = useState(0)

  const show = (next: SheetView) => {
    setView(next)
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const goal = view.mode === "create" ? null : (goals.find((g) => g.id === view.goalId) ?? null)
  const backToDetail = () => goal && show({ mode: "detail", goalId: goal.id })

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)

  return (
    <>
      <PageHeader
        description="Menabung untuk tujuan keluarga: mudik, sekolah, umrah, dan lainnya."
        action={
          <Button onClick={() => show({ mode: "create" })}>
            <Plus /> Tujuan baru
          </Button>
        }
      />

      {error && <ErrorMessage message={errorMessage(error)} />}

      {isPending ? (
        <Loading />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Belum ada tujuan tabungan"
          description="Buat tujuan, tentukan targetnya, lalu catat setiap setoran."
          action={<Button onClick={() => show({ mode: "create" })}>Buat tujuan pertama</Button>}
        />
      ) : (
        <div className="space-y-4">
          <div className="surface flex items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total terkumpul</p>
              <p className="text-2xl font-semibold tabular-nums">{formatRupiah(totalSaved)}</p>
            </div>
            <span className="text-sm text-muted-foreground">{goals.length} tujuan</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {goals.map((g) => {
              const ratio = g.saved / g.target_amount
              const reached = g.saved >= g.target_amount
              const perMonth = monthlySuggestion(g)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => show({ mode: "detail", goalId: g.id })}
                  className="surface flex flex-col gap-4 p-5 text-left transition-transform outline-none active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-3">
                    <IconBadge icon={g.icon} color={g.color} shape="square" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{g.name}</span>
                      <span className="block text-sm text-muted-foreground tabular-nums">
                        Target {formatRupiah(g.target_amount)}
                      </span>
                    </span>
                    {reached && <Badge>Tercapai</Badge>}
                  </span>
                  <span className="space-y-2">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-xl font-bold tabular-nums">{formatRupiah(g.saved)}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {Math.min(100, Math.round(ratio * 100))}%
                      </span>
                    </span>
                    <ProgressBar value={ratio} color={g.color} />
                    {g.target_date && !reached && (
                      <span className="block text-xs text-muted-foreground">
                        {dueLabel(g.target_date).replace("Terlambat", "Lewat")}
                        {perMonth !== null && ` · ±${formatRupiah(perMonth)}/bulan`}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={view.mode === "detail" ? (goal?.name ?? "Tujuan tabungan") : titles[view.mode]}
        description="Kelola tujuan tabungan, setoran, dan penarikan."
        width={view.mode === "detail" ? "lg" : "md"}
      >
        {view.mode === "create" && (
          <SavingsGoalForm key={formKey} onDone={() => setOpen(false)} />
        )}
        {goal && view.mode === "detail" && (
          <SavingsGoalDetail
            goal={goal}
            onDeposit={() => show({ mode: "deposit", goalId: goal.id })}
            onWithdraw={() => show({ mode: "withdraw", goalId: goal.id })}
            onEdit={() => show({ mode: "edit", goalId: goal.id })}
          />
        )}
        {goal && view.mode === "edit" && (
          <SavingsGoalForm
            key={formKey}
            goal={goal}
            onDone={backToDetail}
            onDeleted={() => setOpen(false)}
          />
        )}
        {goal && (view.mode === "deposit" || view.mode === "withdraw") && (
          <SavingsEntryForm key={formKey} goal={goal} kind={view.mode} onDone={backToDetail} />
        )}
      </ResponsiveSheet>
    </>
  )
}
