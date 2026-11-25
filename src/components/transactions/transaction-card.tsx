import { ArrowLeftRight } from "lucide-react"

import { IconBadge } from "@/components/common/icon-badge"
import { MemberAvatar } from "@/components/common/member-avatar"
import { TransactionAmount } from "@/components/transactions/transaction-amount"
import type { Lookups } from "@/hooks/use-lookups"
import { formatShortDate } from "@/lib/format"
import type { Transaction } from "@/types"

interface TransactionCardProps {
  transaction: Transaction
  lookups: Lookups
  onClick?: (t: Transaction) => void
  showDate?: boolean
}

export function TransactionCard({
  transaction: t,
  lookups,
  onClick,
  showDate,
}: TransactionCardProps) {
  const category = t.category_id ? lookups.categories.get(t.category_id) : undefined
  const wallet = lookups.wallets.get(t.wallet_id)
  const toWallet = t.to_wallet_id ? lookups.wallets.get(t.to_wallet_id) : undefined
  const member = t.recorded_by ? lookups.members.get(t.recorded_by) : undefined

  const title =
    t.type === "transfer" ? "Transfer" : (category?.name ?? "Tanpa kategori")
  const source =
    t.type === "transfer"
      ? `${wallet?.name ?? "?"} → ${toWallet?.name ?? "?"}`
      : (wallet?.name ?? "")
  const details = [showDate ? formatShortDate(t.date) : null, t.note, source]
    .filter(Boolean)
    .join(" · ")

  return (
    <button
      type="button"
      onClick={() => onClick?.(t)}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left transition-colors outline-none hover:bg-muted active:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      {t.type === "transfer" ? (
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
          <ArrowLeftRight className="size-5" />
        </span>
      ) : (
        <IconBadge icon={category?.icon} color={category?.color ?? "#64748b"} shape="square" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{details}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <TransactionAmount type={t.type} amount={t.amount} />
        {member && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MemberAvatar name={member.name} color={member.color} size="sm" className="size-4 text-[0.6rem]" />
            {member.name}
          </span>
        )}
      </span>
    </button>
  )
}
