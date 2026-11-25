import { useMemo } from "react"

import { useCategories } from "@/hooks/use-categories"
import { useMembers } from "@/hooks/use-members"
import { useWallets } from "@/hooks/use-wallets"
import type { Category, Member, WalletWithBalance } from "@/types"

export interface Lookups {
  categories: Map<string, Category>
  wallets: Map<string, WalletWithBalance>
  members: Map<string, Member>
}

/** id → row maps used to display category/wallet/member names on transactions. */
export function useLookups() {
  const categories = useCategories()
  const wallets = useWallets()
  const members = useMembers()

  const lookups = useMemo<Lookups>(
    () => ({
      categories: new Map((categories.data ?? []).map((c) => [c.id, c])),
      wallets: new Map((wallets.data ?? []).map((w) => [w.id, w])),
      members: new Map((members.data ?? []).map((m) => [m.id, m])),
    }),
    [categories.data, wallets.data, members.data]
  )

  return {
    lookups,
    isPending: categories.isPending || wallets.isPending || members.isPending,
    error: categories.error ?? wallets.error ?? members.error,
  }
}
