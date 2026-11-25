import { createContext, useContext } from "react"
import type { Session } from "@supabase/supabase-js"

export interface AuthState {
  session: Session | null
  isLoading: boolean
  /** true after the user opens the password reset link from the email */
  isRecovery: boolean
  finishRecovery: () => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
