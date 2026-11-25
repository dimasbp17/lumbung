import { useState, type ReactNode } from "react"

import { Field } from "@/components/common/field"
import { MemberAvatar } from "@/components/common/member-avatar"
import { WalletPicker } from "@/components/transactions/wallet-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCategories } from "@/hooks/use-categories"
import { useMembers } from "@/hooks/use-members"
import { useWallets } from "@/hooks/use-wallets"
import { cn } from "@/lib/utils"
import type { TransactionType } from "@/types"
import {
  emptyFilters,
  type DateScope,
  type TransactionFilterValues,
} from "@/components/transactions/transaction-filter-values"

const ALL = "__all__"

const typeOptions: { value: TransactionType | undefined; label: string }[] = [
  { value: undefined, label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
]

const scopeOptions: { value: DateScope; label: string }[] = [
  { value: "period", label: "Per periode" },
  { value: "all", label: "Semua waktu" },
  { value: "custom", label: "Pilih tanggal" },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-full px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-accent font-semibold text-accent-foreground ring-1 ring-primary/30" : "bg-muted/60 hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

interface TransactionFiltersFormProps {
  value: TransactionFilterValues
  onApply: (value: TransactionFilterValues) => void
}

export function TransactionFiltersForm({ value, onApply }: TransactionFiltersFormProps) {
  const { data: categories = [] } = useCategories()
  const { data: wallets = [] } = useWallets()
  const { data: members = [] } = useMembers()
  const [draft, setDraft] = useState<TransactionFilterValues>(value)

  const set = (patch: Partial<TransactionFilterValues>) => setDraft((d) => ({ ...d, ...patch }))

  // Transfers have no category; otherwise only show categories of the chosen type.
  const categoryOptions = categories.filter((c) => !draft.type || c.type === draft.type)
  const selectedCategory = categories.find((c) => c.id === draft.categoryId)

  return (
    <div className="grid gap-5">
      <Field label="Jenis">
        <div role="radiogroup" aria-label="Jenis" className="flex flex-wrap gap-2">
          {typeOptions.map((o) => (
            <Chip
              key={o.label}
              active={draft.type === o.value}
              onClick={() => {
                const keepCategory =
                  o.value !== "transfer" && (!o.value || selectedCategory?.type === o.value)
                set({ type: o.value, categoryId: keepCategory ? draft.categoryId : undefined })
              }}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </Field>

      {draft.type !== "transfer" && (
        <Field label="Kategori" htmlFor="filter-category">
          <Select
            value={draft.categoryId ?? ALL}
            onValueChange={(v) => set({ categoryId: v === ALL || typeof v !== "string" ? undefined : v })}
          >
            <SelectTrigger id="filter-category" className="h-12! w-full">
              <SelectValue>{() => selectedCategory?.name ?? "Semua kategori"}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={ALL}>Semua kategori</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {!draft.type && (
                    <span className="text-xs text-muted-foreground">
                      {c.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="Dompet" htmlFor="filter-wallet">
        <WalletPicker
          id="filter-wallet"
          wallets={wallets}
          value={draft.walletId ?? null}
          onChange={(id) => set({ walletId: id ?? undefined })}
          noneLabel="Semua dompet"
        />
      </Field>

      {members.length > 0 && (
        <Field label="Dicatat oleh">
          <div role="radiogroup" aria-label="Dicatat oleh" className="flex flex-wrap gap-2">
            <Chip active={!draft.memberId} onClick={() => set({ memberId: undefined })}>
              Semua
            </Chip>
            {members.map((m) => (
              <Chip key={m.id} active={draft.memberId === m.id} onClick={() => set({ memberId: m.id })}>
                <MemberAvatar name={m.name} color={m.color} size="sm" />
                {m.name}
              </Chip>
            ))}
          </div>
        </Field>
      )}

      <Field label="Waktu">
        <div role="radiogroup" aria-label="Waktu" className="flex flex-wrap gap-2">
          {scopeOptions.map((o) => (
            <Chip key={o.value} active={draft.scope === o.value} onClick={() => set({ scope: o.value })}>
              {o.label}
            </Chip>
          ))}
        </div>
        {draft.scope === "custom" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input
              type="date"
              aria-label="Dari tanggal"
              value={draft.start ?? ""}
              onChange={(e) => set({ start: e.target.value || undefined })}
              className="h-11 text-base"
            />
            <Input
              type="date"
              aria-label="Sampai tanggal"
              value={draft.end ?? ""}
              onChange={(e) => set({ end: e.target.value || undefined })}
              className="h-11 text-base"
            />
          </div>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="lg" onClick={() => onApply(emptyFilters)}>
          Reset
        </Button>
        <Button type="button" size="lg" onClick={() => onApply(draft)}>
          Terapkan
        </Button>
      </div>
    </div>
  )
}
