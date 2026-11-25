import { useState } from "react"
import { Link } from "react-router"
import { ChevronRight } from "lucide-react"

import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { RecordRecurringForm } from "@/components/recurring/record-recurring-form"
import { RecurringRow } from "@/components/recurring/recurring-row"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lookups } from "@/hooks/use-lookups"
import { isRecurringFinished, useRecurringTransactions } from "@/hooks/use-recurring"
import { addDays, todayWib } from "@/lib/format"
import type { RecurringTransaction } from "@/types"

const MAX_ITEMS = 4

/** Overdue bills and those due within a week. Hidden when there are none. */
export function UpcomingBills({ lookups }: { lookups: Lookups }) {
  const { data = [] } = useRecurringTransactions()
  const [recording, setRecording] = useState<RecurringTransaction | null>(null)
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const horizon = addDays(todayWib(), 7)
  const upcoming = data.filter((r) => r.is_active && !isRecurringFinished(r) && r.next_date <= horizon)
  if (upcoming.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tagihan terdekat</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-primary" nativeButton={false} render={<Link to="/tagihan" />}>
            Semua <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-0.5 px-3">
        {upcoming.slice(0, MAX_ITEMS).map((r) => (
          <RecurringRow
            key={r.id}
            recurring={r}
            lookups={lookups}
            onRecord={(x) => {
              setRecording(x)
              setFormKey((k) => k + 1)
              setOpen(true)
            }}
          />
        ))}
        {upcoming.length > MAX_ITEMS && (
          <p className="px-2.5 pt-1 text-sm text-muted-foreground">
            +{upcoming.length - MAX_ITEMS} tagihan lainnya
          </p>
        )}
      </CardContent>

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={recording ? `Catat ${recording.name}` : "Catat tagihan"}
        description="Catat tagihan ini sebagai transaksi."
        width="md"
      >
        {recording && (
          <RecordRecurringForm key={formKey} recurring={recording} onDone={() => setOpen(false)} />
        )}
      </ResponsiveSheet>
    </Card>
  )
}
