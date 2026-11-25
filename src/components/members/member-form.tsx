import { useState, type FormEvent } from "react"
import { Trash } from "lucide-react"
import { toast } from "sonner"

import { ColorPicker } from "@/components/common/color-picker"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { MemberAvatar } from "@/components/common/member-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDeleteMember, useSaveMember } from "@/hooks/use-members"
import { errorMessage } from "@/lib/error"
import type { Member } from "@/types"

interface MemberFormProps {
  member?: Member | null
  /** false when this is the only member (it cannot be deleted) */
  canDelete: boolean
  onDone: () => void
}

export function MemberForm({ member, canDelete, onDone }: MemberFormProps) {
  const save = useSaveMember()
  const remove = useDeleteMember()
  const [name, setName] = useState(member?.name ?? "")
  const [color, setColor] = useState(member?.color ?? "#0ea5e9")
  const [nameError, setNameError] = useState<string>()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setNameError("Nama wajib diisi.")
    setNameError(undefined)
    try {
      await save.mutateAsync({ id: member?.id, name: name.trim(), color })
      toast.success(member ? "Profil diperbarui" : "Profil ditambahkan")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!member) return
    try {
      await remove.mutateAsync(member.id)
      toast.success("Profil dihapus")
      setConfirmDelete(false)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="flex items-center gap-3">
        <MemberAvatar name={name || "?"} color={color} size="lg" />
        <Field label="Nama" htmlFor="member-name" error={nameError} className="flex-1">
          <Input
            id="member-name"
            value={name}
            maxLength={40}
            placeholder="Misal: Ayah, Bunda"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError) || undefined}
            className="h-11"
          />
        </Field>
      </div>

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {member && canDelete ? (
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
        title={`Hapus profil "${member?.name ?? ""}"?`}
        description="Transaksi yang pernah dicatat oleh profil ini tetap tersimpan, tetapi tidak lagi menampilkan pencatatnya."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}
