import { createContext, useContext } from "react"

export type Theme = "light" | "dark" | "system"

export interface ThemeState {
  /** The user's choice */
  theme: Theme
  /** The theme actually applied (system → light/dark) */
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeState | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
