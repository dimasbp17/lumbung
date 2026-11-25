import { useState } from "react"
import { HandCoins, Plus } from "lucide-react"

import { MemberAvatar } from "@/components/common/member-avatar"
import { ProgressBar } from "@/components/common/progress-bar"
import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { DebtDetail } from "@/components/debts/debt-detail"
import { DebtForm } from "@/components/debts/debt-form"
import { DebtPaymentForm } from "@/components/debts/debt-payment-form"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { debtDirectionLabels, useDebts } from "@/hooks/use-debts"
import { errorMessage } from "@/lib/error"
import { daysBetween, dueLabel, formatRupiah, todayWib } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { DebtDirection, DebtWithProgress } from "@/types"

type SheetView =
  | { mode: "create" }
  | { mode: "detail" | "edit" | "pay"; debtId: string }

function DebtRow({ debt, onOpen }: { debt: DebtWithProgress; onOpen: () => void }) {
  const remaining = debt.amount - debt.paid
  const settled = remaining <= 0
  const overdue = !settled && debt.due_date !== null && daysBetween(todayWib(), debt.due_date) < 0

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left outline-none hover:bg-muted focus-visible:bg-muted",
        settled && "opacity-60"
      )}
    >
      <MemberAvatar
        name={debt.person_name}
        color={debt.direction === "payable" ? "#dc2626" : "#059669"}
        className="size-11 text-base"
      />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold">{debt.person_name}</span>
          <span className="shrink-0 font-semibold tabular-nums">{formatRupiah(Math.max(remaining, 0))}</span>
        </span>
        <ProgressBar value={debt.paid / debt.amount} className="h-1.5" />
        <span className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>dari {formatRupiah(debt.amount)}</span>
          {settled ? (
            <Badge variant="secondary">Lunas</Badge>
          ) : debt.due_date ? (
            <span className={cn(overdue && "font-semibold text-red-600 dark:text-red-400")}>
              {dueLabel(debt.due_date)}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}

export function DebtsPage() {
  const { data = [], isPending, error } = useDebts()
  const [direction, setDirection] = useState<DebtDirection>("payable")
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<SheetView>({ mode: "create" })
  const [formKey, setFormKey] = useState(0)

  const show = (next: SheetView) => {
    setView(next)
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const debt = view.mode === "create" ? null : (data.find((d) => d.id === view.debtId) ?? null)
  const backToDetail = () => debt && show({ mode: "detail", debtId: debt.id })

  const remainingOf = (dir: DebtDirection) =>
    data.filter((d) => d.direction === dir).reduce((s, d) => s + Math.max(d.amount - d.paid, 0), 0)

  const list = data.filter((d) => d.direction === direction)
  const unsettled = list.filter((d) => d.paid < d.amount)
  const settled = list.filter((d) => d.paid >= d.amount)

  return (
    <>
      <PageHeader
        description="Catat uang yang dipinjam dan dipinjamkan beserta cicilannya."
        action={
          <Button onClick={() => show({ mode: "create" })}>
            <Plus /> Catat baru
          </Button>
        }
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="surface p-4">
            <p className="text-sm text-muted-foreground">Utang kami</p>
            <p className="text-xl font-semibold text-red-600 tabular-nums dark:text-red-400">
              {formatRupiah(remainingOf("payable"))}
            </p>
          </div>
          <div className="surface p-4">
            <p className="text-sm text-muted-foreground">Piutang kami</p>
            <p className="text-xl font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatRupiah(remainingOf("receivable"))}
            </p>
          </div>
        </div>

        <Tabs value={direction} onValueChange={(v) => setDirection(v as DebtDirection)}>
          <TabsList className="w-full">
            <TabsTrigger value="payable" className="h-9">{debtDirectionLabels.payable}</TabsTrigger>
            <TabsTrigger value="receivable" className="h-9">{debtDirectionLabels.receivable}</TabsTrigger>
          </TabsList>
        </Tabs>

        {error && <ErrorMessage message={errorMessage(error)} />}

        {isPending ? (
          <Loading />
        ) : list.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title={direction === "payable" ? "Tidak ada utang" : "Tidak ada piutang"}
            description={
              direction === "payable"
                ? "Catat pinjaman dari saudara, teman, atau koperasi."
                : "Catat uang yang dipinjamkan kepada orang lain."
            }
            action={<Button onClick={() => show({ mode: "create" })}>Catat baru</Button>}
          />
        ) : (
          <div className="space-y-5">
            {unsettled.length > 0 && (
              <div className="surface space-y-0.5 p-2">
                {unsettled.map((d) => (
                  <DebtRow key={d.id} debt={d} onOpen={() => show({ mode: "detail", debtId: d.id })} />
                ))}
              </div>
            )}
            {settled.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">Sudah lunas</h3>
                <div className="surface space-y-0.5 p-2">
                  {settled.map((d) => (
                    <DebtRow key={d.id} debt={d} onOpen={() => show({ mode: "detail", debtId: d.id })} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={
          view.mode === "create"
            ? "Catat utang/piutang"
            : view.mode === "edit"
              ? "Ubah data"
              : view.mode === "pay"
                ? debt?.direction === "payable" ? "Catat pembayaran" : "Catat penerimaan"
                : debt
                  ? `${debtDirectionLabels[debt.direction]} · ${debt.person_name}`
                  : "Detail"
        }
        description="Kelola utang, piutang, dan pembayarannya."
        width={view.mode === "detail" ? "lg" : "md"}
      >
        {view.mode === "create" && (
          <DebtForm key={formKey} initialDirection={direction} onDone={() => setOpen(false)} />
        )}
        {debt && view.mode === "detail" && (
          <DebtDetail
            debt={debt}
            onPay={() => show({ mode: "pay", debtId: debt.id })}
            onEdit={() => show({ mode: "edit", debtId: debt.id })}
          />
        )}
        {debt && view.mode === "edit" && (
          <DebtForm key={formKey} debt={debt} onDone={backToDetail} onDeleted={() => setOpen(false)} />
        )}
        {debt && view.mode === "pay" && (
          <DebtPaymentForm key={formKey} debt={debt} onDone={backToDetail} />
        )}
      </ResponsiveSheet>
    </>
  )
}
