import { useEffect } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "sonner"

/** How often an open app checks for a newly deployed version. */
const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Registers the service worker and, when a new version has been deployed,
 * asks the user to reload instead of reloading on its own.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => {})
      }, UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast("Versi baru Lumbung tersedia", {
      id: "pwa-update",
      description: "Muat ulang untuk memakai versi terbaru.",
      duration: Infinity,
      action: { label: "Muat ulang", onClick: () => updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
