import { useState } from "react"
import { Plus } from "lucide-react"

import { CategoryForm } from "@/components/categories/category-form"
import { IconBadge } from "@/components/common/icon-badge"
import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { ErrorMessage, Loading } from "@/components/common/status"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { categoryTypeLabels, useCategories } from "@/hooks/use-categories"
import { errorMessage } from "@/lib/error"
import { cn } from "@/lib/utils"
import type { Category, CategoryType } from "@/types"

export function CategoriesPage() {
  const { data = [], isPending, error } = useCategories()
  const [type, setType] = useState<CategoryType>("expense")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [formKey, setFormKey] = useState(0)

  const openSheet = (c: Category | null) => {
    setSelected(c)
    setFormKey((n) => n + 1)
    setOpen(true)
  }

  // Active first, then inactive.
  const categories = data
    .filter((c) => c.type === type)
    .sort((a, b) => Number(b.is_active) - Number(a.is_active))

  return (
    <>
      <PageHeader
        action={
          <Button onClick={() => openSheet(null)}>
            <Plus /> Tambah kategori
          </Button>
        }
      />

      <Tabs
        value={type}
        onValueChange={(v) => setType(v as CategoryType)}
        className="mb-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="h-9">{categoryTypeLabels.expense}</TabsTrigger>
          <TabsTrigger value="income" className="h-9">{categoryTypeLabels.income}</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <ErrorMessage message={errorMessage(error)} />}

      {isPending ? (
        <Loading />
      ) : (
        <div className="surface space-y-0.5 p-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openSheet(c)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none hover:bg-muted focus-visible:bg-muted",
                !c.is_active && "opacity-60"
              )}
            >
              <IconBadge icon={c.icon} color={c.color} shape="square" />
              <span className="flex-1 font-medium">{c.name}</span>
              {!c.is_active && <Badge variant="secondary">Nonaktif</Badge>}
            </button>
          ))}
        </div>
      )}

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={
          selected
            ? "Ubah kategori"
            : `Tambah kategori ${categoryTypeLabels[type].toLowerCase()}`
        }
        description="Atur nama, warna, ikon, dan status kategori."
      >
        <CategoryForm
          key={formKey}
          category={selected}
          type={type}
          onDone={() => setOpen(false)}
        />
      </ResponsiveSheet>
    </>
  )
}
