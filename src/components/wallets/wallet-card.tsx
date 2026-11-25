import { createElement } from "react"

import { walletTypeLabels } from "@/hooks/use-wallets"
import { formatRupiah } from "@/lib/format"
import { getIcon } from "@/lib/icons"
import type { WalletWithBalance } from "@/types"

interface WalletCardProps {
  wallet: WalletWithBalance
  onClick: (wallet: WalletWithBalance) => void
}

/**
 * Bank-card style wallet tile. The background is a gradient of the wallet's
 * own color, darkened enough that white text stays readable even for light
 * colors such as yellow or lime.
 */
export function WalletCard({ wallet, onClick }: WalletCardProps) {
  const background = `linear-gradient(135deg,
    color-mix(in oklch, ${wallet.color} 88%, black) 0%,
    color-mix(in oklch, ${wallet.color} 62%, black) 100%)`

  return (
    <button
      type="button"
      onClick={() => onClick(wallet)}
      className="group relative isolate flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl p-5 text-left text-white shadow-elevated transition-transform outline-none hover:-translate-y-0.5 active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring"
      style={{ background }}
    >
      {/* Ornaments */}
      <span aria-hidden className="pointer-events-none absolute -top-14 -right-10 -z-10 size-44 rounded-full bg-white/12" />
      <span aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 -z-10 size-52 rounded-full bg-white/8" />
      <span aria-hidden className="pointer-events-none absolute -bottom-10 -left-8 -z-10 size-28 rounded-full bg-black/10" />

      <span className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur-sm [&_svg]:size-5">
          {createElement(getIcon(wallet.icon))}
        </span>
        <span className="rounded-full bg-white/18 px-2.5 py-1 text-xs font-medium ring-1 ring-white/20">
          {walletTypeLabels[wallet.type]}
        </span>
      </span>

      <span className="mt-6 block">
        <span className="block truncate text-sm text-white/85">{wallet.name}</span>
        <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[1.65rem] leading-tight font-bold tracking-tight tabular-nums">
            {formatRupiah(wallet.balance)}
          </span>
          {wallet.balance < 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-red-600">
              Saldo minus
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
