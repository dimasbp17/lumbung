import { useMemo, useState } from "react"
import { Plus, Receipt, Search, SlidersHorizontal, X } from "lucide-react"

import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { PageHeader } from "@/components/layout/page-header"
import { PeriodNavigator } from "@/components/period/period-navigator"
import { SignedAmount } from "@/components/transactions/transaction-amount"
import {
  countFilters,
  emptyFilters,
  type TransactionFilterValues,
} from "@/components/transactions/transaction-filter-values"
import { TransactionFiltersForm } from "@/components/transactions/transaction-filters"
import { TransactionList } from "@/components/transactions/transaction-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useLookups } from "@/hooks/use-lookups"
import { usePeriod } from "@/hooks/use-settings"
import {
  SEARCH_LIMIT,
  summarizeTransactions,
  useTransactionSearch,
  type TransactionFilters,
} from "@/hooks/use-transactions"
import { errorMessage } from "@/lib/error"
import { formatRupiah, formatShortDate } from "@/lib/format"
import { useTransactionForm } from "@/providers/transaction-form-context"

const typeLabels = { expense: "Pengeluaran", income: "Pemasukan", transfer: "Transfer" } as const

export function TransactionsPage() {
  const [offset, setOffset] = useState(0)
  const period = usePeriod(offset)
  const { openForm } = useTransactionForm()
  const { lookups } = useLookups()

  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query.trim())
  const [filters, setFilters] = useState<TransactionFilterValues>(emptyFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersKey, setFiltersKey] = useState(0)

  // Categories whose name matches the search text also count as a match.
  const queryCategoryIds = useMemo(() => {
    if (!debouncedQuery) return undefined
    const q = debouncedQuery.toLowerCase()
    return [...lookups.categories.values()].filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.id)
  }, [debouncedQuery, lookups.categories])

  const searchFilters: TransactionFilters = {
    type: filters.type,
    categoryId: filters.categoryId,
    walletId: filters.walletId,
    memberId: filters.memberId,
    query: debouncedQuery || undefined,
    queryCategoryIds,
    ...(filters.scope === "period"
      ? { start: period.start, end: period.end }
      : filters.scope === "custom"
        ? { start: filters.start, end: filters.end }
        : {}),
  }

  const { data = [], isPending, isFetching, error } = useTransactionSearch(searchFilters)
  const summary = summarizeTransactions(data)
  const activeCount = countFilters(filters)
  const isFiltering = activeCount > 0 || Boolean(debouncedQuery)

  const chips: { key: keyof TransactionFilterValues | "range"; label: string; clear: Partial<TransactionFilterValues> }[] = []
  if (filters.type) chips.push({ key: "type", label: typeLabels[filters.type], clear: { type: undefined } })
  if (filters.categoryId)
    chips.push({
      key: "categoryId",
      label: lookups.categories.get(filters.categoryId)?.name ?? "Kategori",
      clear: { categoryId: undefined },
    })
  if (filters.walletId)
    chips.push({
      key: "walletId",
      label: lookups.wallets.get(filters.walletId)?.name ?? "Dompet",
      clear: { walletId: undefined },
    })
  if (filters.memberId)
    chips.push({
      key: "memberId",
      label: `Oleh ${lookups.members.get(filters.memberId)?.name ?? "?"}`,
      clear: { memberId: undefined },
    })
  if (filters.scope === "all") chips.push({ key: "range", label: "Semua waktu", clear: { scope: "period" } })
  if (filters.scope === "custom")
    chips.push({
      key: "range",
      label: `${filters.start ? formatShortDate(filters.start, true) : "Awal"} – ${filters.end ? formatShortDate(filters.end, true) : "Sekarang"}`,
      clear: { scope: "period", start: undefined, end: undefined },
    })

  return (
    <>
      {/* On phones the add button lives in the bottom dock. */}
      <div className="hidden md:block">
        <PageHeader
          action={
            <Button onClick={() => openForm()}>
              <Plus /> Catat transaksi
            </Button>
          }
        />
      </div>

      <div className="space-y-5">
        {/* Search + filters */}
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari catatan atau kategori…"
                aria-label="Cari transaksi"
                className="h-12 rounded-xl bg-card pl-11 text-base"
              />
            </div>
            <Button
              variant="outline"
              className="relative h-12 rounded-xl px-4"
              onClick={() => {
                setFiltersKey((k) => k + 1)
                setFiltersOpen(true)
              }}
              aria-label="Filter"
            >
              <SlidersHorizontal className="size-5" />
              <span className="hidden sm:inline">Filter</span>
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, ...c.clear }))}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-accent pr-2 pl-3 text-sm text-accent-foreground outline-none hover:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Hapus filter ${c.label}`}
                >
                  {c.label}
                  <X className="size-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilters(emptyFilters)}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Hapus semua
              </button>
            </div>
          )}
        </div>

        {filters.scope === "period" && (
          <PeriodNavigator period={period} offset={offset} onOffsetChange={setOffset} />
        )}

        <dl className="surface grid grid-cols-3 divide-x p-4 text-center text-sm">
          <div>
            <dt className="text-muted-foreground">Pemasukan</dt>
            <dd className="font-semibold tabular-nums">{formatRupiah(summary.income)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pengeluaran</dt>
            <dd className="font-semibold tabular-nums">{formatRupiah(summary.expense)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Selisih</dt>
            <dd>
              <SignedAmount value={summary.net} />
            </dd>
          </div>
        </dl>

        {error && <ErrorMessage message={errorMessage(error)} />}

        {isFiltering && !isPending && (
          <p className="px-1 text-sm text-muted-foreground" aria-live="polite">
            {isFetching
              ? "Mencari…"
              : data.length >= SEARCH_LIMIT
                ? `Menampilkan ${SEARCH_LIMIT} transaksi terbaru. Persempit pencarian untuk hasil lebih tepat.`
                : `${data.length} transaksi ditemukan`}
          </p>
        )}

        {isPending ? (
          <Loading />
        ) : data.length === 0 ? (
          isFiltering ? (
            <EmptyState
              icon={Search}
              title="Tidak ditemukan"
              description="Coba kata kunci lain atau longgarkan filter."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("")
                    setFilters(emptyFilters)
                  }}
                >
                  Hapus pencarian & filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="Tidak ada transaksi"
              description={`Belum ada transaksi di periode ${period.label}.`}
              action={<Button onClick={() => openForm()}>Catat transaksi</Button>}
            />
          )
        ) : (
          <TransactionList transactions={data} lookups={lookups} onSelect={openForm} />
        )}
      </div>

      <ResponsiveSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filter transaksi"
        description="Saring transaksi berdasarkan jenis, kategori, dompet, pencatat, dan waktu."
        width="md"
      >
        <TransactionFiltersForm
          key={filtersKey}
          value={filters}
          onApply={(next) => {
            setFilters(next)
            setFiltersOpen(false)
          }}
        />
      </ResponsiveSheet>
    </>
  )
}
