import { useMemo, useState, type ReactNode } from "react"
import { Plus, Repeat } from "lucide-react"
import { toast } from "sonner"

import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { PageHeader } from "@/components/layout/page-header"
import { RecordRecurringForm } from "@/components/recurring/record-recurring-form"
import { RecurringForm } from "@/components/recurring/recurring-form"
import { RecurringRow } from "@/components/recurring/recurring-row"
import { Button } from "@/components/ui/button"
import { useLookups } from "@/hooks/use-lookups"
import {
  isRecurringFinished,
  useRecurringTransactions,
  useSkipRecurring,
} from "@/hooks/use-recurring"
import { errorMessage } from "@/lib/error"
import { addDays, formatRupiah, todayWib } from "@/lib/format"
import type { RecurringTransaction } from "@/types"

type SheetView =
  | { mode: "form"; recurring: RecurringTransaction | null }
  | { mode: "record"; recurring: RecurringTransaction }

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </header>
      <div className="surface space-y-0.5 p-2">{children}</div>
    </section>
  )
}

export function RecurringPage() {
  const { data = [], isPending, error } = useRecurringTransactions()
  const { lookups } = useLookups()
  const skip = useSkipRecurring()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<SheetView>({ mode: "form", recurring: null })
  const [formKey, setFormKey] = useState(0)

  const show = (next: SheetView) => {
    setView(next)
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const handleSkip = async (r: RecurringTransaction) => {
    try {
      await skip.mutateAsync(r.id)
      toast.success(`"${r.name}" dilewati untuk jadwal ini`)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const groups = useMemo(() => {
    const today = todayWib()
    const inAWeek = addDays(today, 7)
    const active = data.filter((r) => r.is_active && !isRecurringFinished(r))
    return {
      due: active.filter((r) => r.next_date <= today),
      soon: active.filter((r) => r.next_date > today && r.next_date <= inAWeek),
      later: active.filter((r) => r.next_date > inAWeek),
      inactive: data.filter((r) => !r.is_active || isRecurringFinished(r)),
    }
  }, [data])

  const dueTotal = groups.due
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + r.amount, 0)

  const row = (r: RecurringTransaction) => (
    <RecurringRow
      key={r.id}
      recurring={r}
      lookups={lookups}
      onRecord={(x) => show({ mode: "record", recurring: x })}
      onSkip={handleSkip}
      onEdit={(x) => show({ mode: "form", recurring: x })}
    />
  )

  return (
    <>
      <PageHeader
        description="Tagihan dan transaksi yang berulang: listrik, SPP, cicilan, gaji."
        action={
          <Button onClick={() => show({ mode: "form", recurring: null })}>
            <Plus /> Tambah tagihan
          </Button>
        }
      />

      {error && <ErrorMessage message={errorMessage(error)} />}

      {isPending ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Belum ada tagihan rutin"
          description="Tambahkan tagihan seperti listrik, internet, atau SPP agar tidak lupa dibayar."
          action={<Button onClick={() => show({ mode: "form", recurring: null })}>Tambah tagihan</Button>}
        />
      ) : (
        <div className="space-y-5">
          {groups.due.length > 0 && (
            <Group
              title="Jatuh tempo"
              hint={dueTotal > 0 ? `Pengeluaran ${formatRupiah(dueTotal)}` : undefined}
            >
              {groups.due.map(row)}
            </Group>
          )}
          {groups.soon.length > 0 && <Group title="7 hari ke depan">{groups.soon.map(row)}</Group>}
          {groups.later.length > 0 && <Group title="Akan datang">{groups.later.map(row)}</Group>}
          {groups.inactive.length > 0 && (
            <Group title="Selesai & nonaktif">{groups.inactive.map(row)}</Group>
          )}
        </div>
      )}

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={
          view.mode === "record"
            ? `Catat ${view.recurring.name}`
            : view.recurring
              ? "Ubah tagihan"
              : "Tagihan rutin baru"
        }
        description="Atur tagihan atau transaksi yang berulang."
      >
        {view.mode === "form" ? (
          <RecurringForm key={formKey} recurring={view.recurring} onDone={() => setOpen(false)} />
        ) : (
          <RecordRecurringForm key={formKey} recurring={view.recurring} onDone={() => setOpen(false)} />
        )}
      </ResponsiveSheet>
    </>
  )
}
