import { useWalletBreakdown } from "@/hooks/use-wallets"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { WalletWithBalance } from "@/types"

function signed(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatRupiah(Math.abs(value))}`
}

/**
 * Current balance of a wallet with the calculation behind it, so it is clear
 * that the initial balance stays the same while transactions move the total.
 */
export function WalletBalanceSummary({ wallet }: { wallet: WalletWithBalance }) {
  const { data: b, isPending } = useWalletBreakdown(wallet.id)

  const rows: { label: string; value: number; sign: boolean }[] = b
    ? [
        { label: "Saldo awal", value: wallet.initial_balance, sign: false },
        { label: "Pemasukan", value: b.income, sign: true },
        { label: "Pengeluaran", value: -b.expense, sign: true },
        { label: "Transfer masuk", value: b.transferIn, sign: true },
        { label: "Transfer keluar", value: -b.transferOut, sign: true },
        { label: "Tabungan", value: b.savings, sign: true },
        { label: "Utang-piutang", value: b.debts, sign: true },
      ].filter((r, i) => i === 0 || r.value !== 0)
    : []

  return (
    <section className="rounded-2xl bg-muted/60 p-4">
      <p className="text-sm text-muted-foreground">Saldo saat ini</p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums",
          wallet.balance < 0 && "text-red-600 dark:text-red-400"
        )}
      >
        {formatRupiah(wallet.balance)}
      </p>

      <dl className="mt-3 space-y-1 border-t border-foreground/10 pt-3 text-sm">
        {isPending ? (
          <p className="text-muted-foreground">Menghitung rincian…</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd
                className={cn(
                  "tabular-nums",
                  r.sign && r.value > 0 && "text-emerald-600 dark:text-emerald-400",
                  r.sign && r.value < 0 && "text-red-600 dark:text-red-400"
                )}
              >
                {r.sign ? signed(r.value) : formatRupiah(r.value)}
              </dd>
            </div>
          ))
        )}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Saldo berubah otomatis setiap kali Anda mencatat transaksi di dompet ini.
      </p>
    </section>
  )
}
