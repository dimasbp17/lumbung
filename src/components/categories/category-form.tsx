import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { ColorPicker } from "@/components/common/color-picker"
import { Field } from "@/components/common/field"
import { IconBadge } from "@/components/common/icon-badge"
import { IconPicker } from "@/components/common/icon-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSaveCategory } from "@/hooks/use-categories"
import { errorMessage } from "@/lib/error"
import type { Category, CategoryType } from "@/types"

interface CategoryFormProps {
  category?: Category | null
  type: CategoryType
  onDone: () => void
}

export function CategoryForm({ category, type, onDone }: CategoryFormProps) {
  const save = useSaveCategory()
  const [name, setName] = useState(category?.name ?? "")
  const [icon, setIcon] = useState(category?.icon ?? "package")
  const [color, setColor] = useState(category?.color ?? "#0ea5e9")
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [nameError, setNameError] = useState<string>()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setNameError("Nama kategori wajib diisi.")
    setNameError(undefined)
    try {
      await save.mutateAsync({
        id: category?.id,
        name: name.trim(),
        type: category?.type ?? type,
        icon,
        color,
        is_active: isActive,
      })
      toast.success(category ? "Kategori diperbarui" : "Kategori ditambahkan")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="flex items-center gap-3">
        <IconBadge icon={icon} color={color} size="lg" shape="square" />
        <Field label="Nama kategori" htmlFor="category-name" error={nameError} className="flex-1">
          <Input
            id="category-name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError) || undefined}
            className="h-11"
          />
        </Field>
      </div>

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="Ikon">
        <IconPicker value={icon} onChange={setIcon} color={color} />
      </Field>

      {category && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 p-4">
          <div>
            <Label htmlFor="is-active" className="text-sm">Kategori aktif</Label>
            <p className="text-xs text-muted-foreground">
              Kategori nonaktif tidak muncul saat mencatat, tetapi transaksi lama tetap tersimpan.
            </p>
          </div>
          <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}

      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  )
}
