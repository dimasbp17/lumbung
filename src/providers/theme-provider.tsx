import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"

import { STORAGE_KEYS } from "@/lib/storage"
import { ThemeContext, type Theme } from "@/providers/theme-context"

const media = () => window.matchMedia("(prefers-color-scheme: dark)")

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(STORAGE_KEYS.theme)
    if (t === "light" || t === "dark" || t === "system") return t
  } catch {
    // storage blocked
  }
  return "system"
}

function subscribeSystem(cb: () => void) {
  const mq = media()
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** Light/dark mode. The choice is stored per device. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const systemDark = useSyncExternalStore(subscribeSystem, () => media().matches, () => false)
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", resolvedTheme === "dark")
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_KEYS.theme, t)
    } catch {
      // ignore
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
