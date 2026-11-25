import { IconBadge } from "@/components/common/icon-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatRupiah } from "@/lib/format"
import type { WalletWithBalance } from "@/types"

const NONE = "__none__"

interface WalletPickerProps {
  id?: string
  wallets: WalletWithBalance[]
  value: string | null
  onChange: (id: string | null) => void
  invalid?: boolean
  /** When set, adds a first option that clears the selection (value null) */
  noneLabel?: string
  /** Wallet that may not be selected (e.g. the source wallet in a transfer) */
  exclude?: string | null
  placeholder?: string
}

export function WalletPicker({
  id,
  wallets,
  value,
  onChange,
  invalid,
  exclude,
  placeholder = "Pilih dompet",
  noneLabel,
}: WalletPickerProps) {
  const options = wallets.filter((w) => w.id !== exclude)
  const selected = wallets.find((w) => w.id === value)

  return (
    <Select
      value={value ?? (noneLabel ? NONE : null)}
      onValueChange={(v) => {
        if (v === NONE) onChange(null)
        else if (typeof v === "string") onChange(v)
      }}
    >
      <SelectTrigger
        id={id}
        className="h-12! w-full"
        aria-invalid={invalid || undefined}
      >
        <SelectValue placeholder={placeholder}>
          {() =>
            selected ? (
              <span className="flex items-center gap-2">
                <IconBadge icon={selected.icon} color={selected.color} size="sm" />
                <span className="text-base">{selected.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{noneLabel ?? placeholder}</span>
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {noneLabel && (
          <SelectItem value={NONE}>
            <span className="text-base text-muted-foreground">{noneLabel}</span>
          </SelectItem>
        )}
        {options.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            <IconBadge icon={w.icon} color={w.color} size="sm" />
            <span className="flex flex-col">
              <span className="text-base">{w.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatRupiah(w.balance)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
