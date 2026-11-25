import { lazy, Suspense } from "react"
import { Link } from "react-router"
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronRight,
  Receipt,
  type LucideIcon,
} from "lucide-react"

import { MemberAvatar } from "@/components/common/member-avatar"
import { BudgetSummary } from "@/components/home/budget-summary"
import { UpcomingBills } from "@/components/home/upcoming-bills"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { TransactionCard } from "@/components/transactions/transaction-card"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLookups } from "@/hooks/use-lookups"
import { useLastMember, useMembers } from "@/hooks/use-members"
import { usePeriod } from "@/hooks/use-settings"
import {
  summarizeTransactions,
  useRecentTransactions,
  useTransactionsInRange,
} from "@/hooks/use-transactions"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { formatLongDate, formatRupiah, todayWib } from "@/lib/format"
import { timeGreeting } from "@/lib/greeting"
import { cn } from "@/lib/utils"
import { useTransactionForm } from "@/providers/transaction-form-context"
import type { TransactionType } from "@/types"

// recharts is fairly large; load it separately so the first page is faster.
const CategoryChart = lazy(() =>
  import("@/components/home/category-chart").then((m) => ({ default: m.CategoryChart }))
)

const quickActions: { type: TransactionType; label: string; icon: LucideIcon; className: string }[] = [
  {
    type: "expense",
    label: "Pengeluaran",
    icon: ArrowUpRight,
    className: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  },
  {
    type: "income",
    label: "Pemasukan",
    icon: ArrowDownLeft,
    className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    type: "transfer",
    label: "Transfer",
    icon: ArrowLeftRight,
    className: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  },
]

export function HomePage() {
  const period = usePeriod()
  const { openForm, openFormWithType } = useTransactionForm()
  const { lookups } = useLookups()
  const wallets = useWallets()
  const periodTransactions = useTransactionsInRange(period.start, period.end)
  const recent = useRecentTransactions(5)
  const { data: members = [] } = useMembers()
  const { memberId } = useLastMember()
  const member = members.find((m) => m.id === memberId)

  const totalBalance = (wallets.data ?? []).reduce((s, w) => s + w.balance, 0)
  const summary = summarizeTransactions(periodTransactions.data ?? [])
  const error = wallets.error ?? periodTransactions.error ?? recent.error

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header className="flex items-center gap-3">
        {member && <MemberAvatar name={member.name} color={member.color} size="lg" />}
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{formatLongDate(todayWib())}</p>
          <h2 className="truncate text-2xl font-bold">
            {timeGreeting()}
            {member ? `, ${member.name}` : ""}
          </h2>
        </div>
      </header>

      {error && <ErrorMessage message={errorMessage(error)} />}

      {/* Balance card */}
      <section
        aria-label="Ringkasan saldo"
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-elevated sm:p-7 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900"
      >
        {/* Decoration */}
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 size-64 rounded-full bg-white/5" />

        <div className="relative">
          <p className="text-sm text-white/80">Total saldo semua dompet</p>
          <p className="mt-1 text-[2.1rem] leading-tight font-bold tracking-tight tabular-nums sm:text-4xl">
            {wallets.isPending ? "…" : formatRupiah(totalBalance)}
          </p>
          <Link
            to="/dompet"
            className="mt-1 inline-flex items-center gap-0.5 text-sm text-white/80 underline-offset-4 hover:underline"
          >
            {wallets.data?.length ?? 0} dompet <ChevronRight className="size-4" />
          </Link>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
                  <ArrowDownLeft className="size-3.5" />
                </span>
                Pemasukan
              </p>
              <p className="mt-1 font-semibold tabular-nums">{formatRupiah(summary.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
                  <ArrowUpRight className="size-3.5" />
                </span>
                Pengeluaran
              </p>
              <p className="mt-1 font-semibold tabular-nums">{formatRupiah(summary.expense)}</p>
            </div>
          </div>
          <p className="mt-3 flex flex-wrap justify-between gap-x-3 text-sm text-white/80">
            <span>Periode {period.label}</span>
            <span>
              Selisih{" "}
              <span className="font-semibold text-white tabular-nums">
                {summary.net > 0 ? "+" : summary.net < 0 ? "−" : ""}
                {formatRupiah(Math.abs(summary.net))}
              </span>
            </span>
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section aria-label="Catat cepat" className="grid grid-cols-3 gap-3">
        {quickActions.map(({ type, label, icon: Icon, className }) => (
          <button
            key={type}
            type="button"
            onClick={() => openFormWithType(type)}
            className="surface flex flex-col items-center gap-2 px-2 py-4 text-sm font-medium transition-transform outline-none active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("flex size-11 items-center justify-center rounded-2xl", className)}>
              <Icon className="size-5.5" />
            </span>
            {label}
          </button>
        ))}
      </section>

      <UpcomingBills lookups={lookups} />

      <BudgetSummary transactions={periodTransactions.data ?? []} lookups={lookups} />

      {/* Expenses by category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Pengeluaran per kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {periodTransactions.isPending ? (
            <Loading />
          ) : (
            <Suspense fallback={<Loading />}>
              <CategoryChart transactions={periodTransactions.data ?? []} lookups={lookups} />
            </Suspense>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transaksi terakhir</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" className="text-primary" nativeButton={false} render={<Link to="/transaksi" />}>
              Lihat semua <ChevronRight />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-3">
          {recent.isPending ? (
            <Loading />
          ) : recent.data?.length ? (
            <div className="space-y-0.5">
              {recent.data.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  lookups={lookups}
                  onClick={openForm}
                  showDate
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Belum ada transaksi"
              description="Mulai catat pemasukan dan pengeluaran keluarga."
              action={<Button onClick={() => openForm()}>Catat transaksi pertama</Button>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
