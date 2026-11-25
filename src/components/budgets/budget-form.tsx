import { useState, type FormEvent } from "react"
import { Trash } from "lucide-react"
import { toast } from "sonner"

import { AmountInput } from "@/components/common/amount-input"
import { ConfirmDelete } from "@/components/common/confirm-delete"
import { Field } from "@/components/common/field"
import { CategoryPicker } from "@/components/transactions/category-picker"
import { Button } from "@/components/ui/button"
import { useDeleteBudget, useSaveBudget } from "@/hooks/use-budgets"
import { errorMessage } from "@/lib/error"
import type { Budget, Category } from "@/types"

interface BudgetFormProps {
  budget?: Budget | null
  /** Expense categories that may be chosen (those without a budget yet, plus the current one) */
  categories: Category[]
  onDone: () => void
}

export function BudgetForm({ budget, categories, onDone }: BudgetFormProps) {
  const save = useSaveBudget()
  const remove = useDeleteBudget()
  const [categoryId, setCategoryId] = useState<string | null>(budget?.category_id ?? null)
  const [amount, setAmount] = useState(budget?.amount ?? 0)
  const [errors, setErrors] = useState<{ category?: string; amount?: string }>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (!categoryId) found.category = "Pilih kategori."
    if (amount <= 0) found.amount = "Nominal harus lebih dari 0."
    setErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      await save.mutateAsync({ id: budget?.id, category_id: categoryId!, amount })
      toast.success(budget ? "Anggaran diperbarui" : "Anggaran ditambahkan")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!budget) return
    try {
      await remove.mutateAsync(budget.id)
      toast.success("Anggaran dihapus")
      setConfirmDelete(false)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <Field label="Kategori pengeluaran" error={errors.category}>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Semua kategori pengeluaran aktif sudah punya anggaran.
          </p>
        ) : (
          <CategoryPicker
            categories={categories}
            value={categoryId}
            onChange={(id) => {
              setCategoryId(id)
              setErrors((e) => ({ ...e, category: undefined }))
            }}
            invalid={Boolean(errors.category)}
          />
        )}
      </Field>

      <Field label="Batas per periode" htmlFor="budget-amount" error={errors.amount}>
        <AmountInput
          id="budget-amount"
          size="lg"
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setErrors((e) => ({ ...e, amount: undefined }))
          }}
          invalid={Boolean(errors.amount)}
        />
        <p className="text-xs text-muted-foreground">
          Batas yang sama berlaku setiap periode bulanan.
        </p>
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {budget ? (
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
        title="Hapus anggaran ini?"
        description="Transaksi tidak terpengaruh; hanya batas anggarannya yang dihapus."
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </form>
  )
}
