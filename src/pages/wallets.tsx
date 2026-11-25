import { useState } from "react"
import { ArrowLeftRight, Plus, Wallet as WalletIcon } from "lucide-react"

import { ResponsiveSheet } from "@/components/common/responsive-sheet"
import { EmptyState, ErrorMessage, Loading } from "@/components/common/status"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WalletCard } from "@/components/wallets/wallet-card"
import { WalletForm } from "@/components/wallets/wallet-form"
import { useWallets } from "@/hooks/use-wallets"
import { errorMessage } from "@/lib/error"
import { formatRupiah } from "@/lib/format"
import { useTransactionForm } from "@/providers/transaction-form-context"
import type { WalletWithBalance } from "@/types"

export function WalletsPage() {
  const { data = [], isPending, error } = useWallets()
  const { openFormWithType } = useTransactionForm()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<WalletWithBalance | null>(null)
  const [formKey, setFormKey] = useState(0)

  const openSheet = (w: WalletWithBalance | null) => {
    setSelected(w)
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const total = data.reduce((s, w) => s + w.balance, 0)

  return (
    <>
      <PageHeader
        description="Sumber dana keluarga: tunai, rekening, dan e-wallet."
        action={
          <Button onClick={() => openSheet(null)}>
            <Plus /> Tambah dompet
          </Button>
        }
      />

      {error && <ErrorMessage message={errorMessage(error)} />}

      {isPending ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="Belum ada dompet"
          action={<Button onClick={() => openSheet(null)}>Tambah dompet</Button>}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Total saldo</p>
                <p className="text-2xl font-semibold tabular-nums">{formatRupiah(total)}</p>
              </div>
              <Button variant="outline" onClick={() => openFormWithType("transfer")}>
                <ArrowLeftRight /> Transfer / tarik tunai
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((w) => (
              <WalletCard key={w.id} wallet={w} onClick={openSheet} />
            ))}
          </div>
        </div>
      )}

      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={selected ? "Ubah dompet" : "Tambah dompet"}
        description="Atur nama, jenis, saldo awal, warna, dan ikon dompet."
      >
        <WalletForm key={formKey} wallet={selected} onDone={() => setOpen(false)} />
      </ResponsiveSheet>
    </>
  )
}
