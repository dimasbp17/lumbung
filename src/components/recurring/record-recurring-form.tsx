import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { Field } from "@/components/common/field"
import { MemberPicker } from "@/components/transactions/member-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLastMember, useMembers } from "@/hooks/use-members"
import { useRecordRecurring } from "@/hooks/use-recurring"
import { errorMessage } from "@/lib/error"
import { formatDate, todayWib } from "@/lib/format"
import type { RecurringTransaction } from "@/types"

interface RecordRecurringFormProps {
  recurring: RecurringTransaction
  onDone: () => void
}

/** Confirms the amount/date and records the occurrence as a real transaction. */
export function RecordRecurringForm({ recurring, onDone }: RecordRecurringFormProps) {
  const record = useRecordRecurring()
  const { data: members = [] } = useMembers()
  const { memberId: lastMemberId, setLastMember } = useLastMember()
  const [amount, setAmount] = useState(recurring.amount)
  const [date, setDate] = useState(todayWib())
  const [recorder, setRecorder] = useState<string | null | undefined>(undefined)
  const [amountError, setAmountError] = useState<string>()

  const recordedBy = recorder === undefined ? lastMemberId : recorder

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (amount <= 0) return setAmountError("Nominal harus lebih dari 0.")
    try {
      await record.mutateAsync({ id: recurring.id, date, amount, recordedBy })
      if (recordedBy) setLastMember(recordedBy)
      toast.success(`"${recurring.name}" dicatat`)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
        Jatuh tempo {formatDate(recurring.next_date)}. Setelah dicatat, tagihan berpindah ke jadwal berikutnya.
      </p>

      <Field label="Nominal" htmlFor="record-amount" error={amountError}>
        <AmountInput
          id="record-amount"
          size="lg"
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setAmountError(undefined)
          }}
          invalid={Boolean(amountError)}
          autoFocus
        />
      </Field>

      <Field label="Tanggal transaksi" htmlFor="record-date">
        <Input id="record-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 text-base" />
      </Field>

      {members.length > 0 && (
        <Field label="Dicatat oleh">
          <MemberPicker members={members} value={recordedBy} onChange={setRecorder} />
        </Field>
      )}

      <Button type="submit" size="lg" disabled={record.isPending}>
        {record.isPending ? "Mencatat…" : "Catat transaksi"}
      </Button>
    </form>
  )
}
