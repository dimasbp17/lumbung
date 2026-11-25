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
import { Textarea } from "@/components/ui/textarea"
import { useDeleteSavingsGoal, useSaveSavingsGoal } from "@/hooks/use-savings"
import { errorMessage } from "@/lib/error"
import type { SavingsGoal } from "@/types"

interface SavingsGoalFormProps {
  goal?: SavingsGoal | null
  onDone: () => void
  /** Called after the goal is deleted (the detail view must close) */
  onDeleted?: () => void
}

export function SavingsGoalForm({ goal, onDone, onDeleted }: SavingsGoalFormProps) {
  const save = useSaveSavingsGoal()
  const remove = useDeleteSavingsGoal()
  const [name, setName] = useState(goal?.name ?? "")
  const [target, setTarget] = useState(goal?.target_amount ?? 0)
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "")
  const [icon, setIcon] = useState(goal?.icon ?? "piggy-bank")
  const [color, setColor] = useState(goal?.color ?? "#0891b2")
  const [note, setNote] = useState(goal?.note ?? "")
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (!name.trim()) found.name = "Nama tujuan wajib diisi."
    if (target <= 0) found.target = "Target harus lebih dari 0."
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      await save.mutateAsync({
        id: goal?.id,
        name: name.trim(),
        target_amount: target,
        target_date: targetDate || null,
        icon,
        color,
        note: note.trim() || null,
      })
      toast.success(goal ? "Tujuan diperbarui" : "Tujuan tabungan dibuat")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!goal) return
    try {
      await remove.mutateAsync(goal.id)
      toast.success("Tujuan tabungan dihapus")
      setConfirmDelete(false)
      onDeleted?.()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="flex items-center gap-3">
        <IconBadge icon={icon} color={color} size="lg" shape="square" />
        <Field label="Nama tujuan" htmlFor="goal-name" error={errors.name} className="flex-1">
          <Input
            id="goal-name"
            value={name}
            maxLength={60}
            placeholder="Misal: Dana mudik, Umrah, Sekolah anak"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name) || undefined}
            className="h-11"
          />
        </Field>
      </div>

      <Field label="Target dana" htmlFor="goal-target" error={errors.target}>
        <AmountInput
          id="goal-target"
          size="lg"
          value={target}
          onChange={setTarget}
          invalid={Boolean(errors.target)}
        />
      </Field>

      <Field label="Target tercapai pada (opsional)" htmlFor="goal-date">
        <Input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="h-12 text-base"
        />
      </Field>

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="Ikon">
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </Field>

      <Field label="Catatan (opsional)" htmlFor="goal-note">
        <Textarea
          id="goal-note"
          value={note}
          maxLength={200}
          rows={2}
          onChange={(e) => setNote(e.target.value)}
          className="text-base"
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {goal ? (
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
        title={`Hapus tujuan "${goal?.name ?? ""}"?`}
        description="Semua catatan setoran dan penarikannya ikut terhapus. Saldo dompet yang terkait akan dihitung ulang."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}
