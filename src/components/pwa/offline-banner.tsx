import { WifiOff } from "lucide-react"

import { useOnlineStatus } from "@/hooks/use-online-status"

/** Thin notice under the top bar while the device is offline. */
export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
    >
      <WifiOff className="size-4 shrink-0" />
      Anda sedang offline. Data mungkin belum terbaru dan transaksi baru belum bisa disimpan.
    </div>
  )
}
