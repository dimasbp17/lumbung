import { IconBadge } from "@/components/common/icon-badge"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { WalletWithBalance } from "@/types"

interface WalletChipsProps {
  wallets: WalletWithBalance[]
  value: string | null
  onChange: (id: string) => void
  label: string
  invalid?: boolean
  /** Wallet that may not be selected (e.g. the source wallet in a transfer) */
  exclude?: string | null
}

/** All wallets as always-visible chips, so the chosen wallet can't be overlooked. */
export function WalletChips({ wallets, value, onChange, label, invalid, exclude }: WalletChipsProps) {
  if (wallets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada dompet. Tambahkan di halaman Dompet.
      </p>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={cn(
        // Scrolls sideways when there are many wallets; bleeds to the sheet edge.
        "-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]",
        invalid && "rounded-lg ring-2 ring-destructive/40"
      )}
    >
      {wallets.map((w) => {
        const selected = w.id === value
        const disabled = w.id === exclude
        return (
          <button
            key={w.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(w.id)}
            className={cn(
              "flex h-14 shrink-0 items-center gap-2 rounded-2xl border-2 pr-4 pl-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
              selected ? "font-semibold" : "border-transparent bg-muted/60"
            )}
            style={selected ? { borderColor: w.color, backgroundColor: `${w.color}14` } : undefined}
          >
            <IconBadge icon={w.icon} color={w.color} size="sm" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm whitespace-nowrap">{w.name}</span>
              <span className="text-xs font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                {formatRupiah(w.balance)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
