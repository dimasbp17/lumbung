import { useSyncExternalStore } from "react"

/** Chrome/Edge/Android event that lets the app show its own "install" button. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((cb) => cb())

// Captured at start-up: the event can fire before the settings page is opened.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    installed = true
    notify()
  })
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac with touch
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const getSnapshot = () => deferred

export type InstallState =
  /** Already running as an installed app */
  | "installed"
  /** The browser offered an install prompt: show a button */
  | "available"
  /** iPhone/iPad: must be added manually via the Share menu */
  | "ios"
  /** Browser doesn't support installing, or it was already dismissed */
  | "unsupported"

export function useInstallPrompt() {
  const event = useSyncExternalStore(subscribe, getSnapshot, () => null)

  const state: InstallState =
    installed || isStandalone() ? "installed" : event ? "available" : isIos() ? "ios" : "unsupported"

  const install = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    notify()
    return outcome === "accepted"
  }

  return { state, install }
}
