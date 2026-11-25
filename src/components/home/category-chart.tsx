import { useMemo, useState } from "react"
import { Cell, Pie, PieChart } from "recharts"

import { IconBadge } from "@/components/common/icon-badge"
import type { Lookups } from "@/hooks/use-lookups"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

interface Slice {
  id: string
  name: string
  value: number
  color: string
  icon: string
  percent: number
}

const MAX_SLICES = 5
const OTHER_COLOR = "#94a3b8"

/**
 * Expense donut by category. Only the 5 largest categories get their own
 * slice; the rest are merged into "others" so colors stay distinguishable.
 * The legend shows name, amount, and percentage so identity does not depend
 * on color alone. Hovering a slice or legend row shows its details in the
 * center of the donut.
 */
export function CategoryChart({
  transactions,
  lookups,
}: {
  transactions: Transaction[]
  lookups: Lookups
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const { slices, total } = useMemo(() => {
    const byCategory = new Map<string, number>()
    let total = 0
    for (const t of transactions) {
      if (t.type !== "expense" || !t.category_id) continue
      byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount)
      total += t.amount
    }
    const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, MAX_SLICES)
    const rest = sorted.slice(MAX_SLICES).reduce((s, [, v]) => s + v, 0)

    const slices: Slice[] = top.map(([id, value]) => {
      const c = lookups.categories.get(id)
      return {
        id,
        name: c?.name ?? "Tanpa kategori",
        value,
        color: c?.color ?? OTHER_COLOR,
        icon: c?.icon ?? "package",
        percent: total ? (value / total) * 100 : 0,
      }
    })
    if (rest > 0) {
      slices.push({
        id: "others",
        name: `${sorted.length - MAX_SLICES} kategori lainnya`,
        value: rest,
        color: OTHER_COLOR,
        icon: "package",
        percent: (rest / total) * 100,
      })
    }
    return { slices, total }
  }, [transactions, lookups])

  if (slices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada pengeluaran di periode ini.
      </p>
    )
  }

  const highlighted = slices.find((s) => s.id === activeId)

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative size-52 shrink-0">
        <PieChart width={208} height={208}>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={100}
            paddingAngle={slices.length > 1 ? 1.5 : 0}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
            onMouseEnter={(_, i) => setActiveId(slices[i]?.id ?? null)}
            onMouseLeave={() => setActiveId(null)}
          >
            {slices.map((s) => (
              <Cell
                key={s.id}
                fill={s.color}
                opacity={activeId && activeId !== s.id ? 0.35 : 1}
              />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">
            {highlighted ? highlighted.name : "Total"}
          </span>
          <span className="max-w-28 text-sm font-semibold tabular-nums">
            {formatRupiah(highlighted ? highlighted.value : total)}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-1">
        {slices.map((s) => (
          <li
            key={s.id}
            onMouseEnter={() => setActiveId(s.id)}
            onMouseLeave={() => setActiveId(null)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-opacity",
              activeId && activeId !== s.id && "opacity-50"
            )}
          >
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            <IconBadge icon={s.icon} color={s.color} size="sm" shape="square" />
            <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
            <span className="text-right text-sm tabular-nums">
              <span className="font-medium">{formatRupiah(s.value)}</span>
              <span className="ml-2 inline-block w-9 text-muted-foreground">
                {s.percent.toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
