import { IconBadge } from "@/components/common/icon-badge"
import { cn } from "@/lib/utils"
import type { Category } from "@/types"

interface CategoryPickerProps {
  categories: Category[]
  value: string | null
  onChange: (id: string) => void
  invalid?: boolean
}

/** Category grid with large icons — easy to tap on a phone. */
export function CategoryPicker({ categories, value, onChange, invalid }: CategoryPickerProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada kategori aktif. Tambahkan di Pengaturan → Kategori.
      </p>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Kategori"
      aria-invalid={invalid || undefined}
      className={cn(
        "grid grid-cols-3 gap-2 sm:grid-cols-4",
        invalid && "rounded-lg ring-2 ring-destructive/40 ring-offset-4 ring-offset-popover"
      )}
    >
      {categories.map((c) => {
        const selected = c.id === value
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(c.id)}
            className={cn(
              "flex min-h-22 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center text-xs leading-tight transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "font-semibold" : "border-transparent bg-muted/60"
            )}
            style={selected ? { borderColor: c.color, backgroundColor: `${c.color}14` } : undefined}
          >
            <IconBadge icon={c.icon} color={c.color} shape="square" />
            <span className="line-clamp-2">{c.name}</span>
          </button>
        )
      })}
    </div>
  )
}
