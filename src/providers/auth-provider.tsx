import { useEffect, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"

import { queryClient } from "@/lib/query-client"
import { supabase } from "@/lib/supabase"
import { AuthContext } from "@/providers/auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setIsLoading(false)
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true)
      if (event === "SIGNED_OUT") {
        setIsRecovery(false)
        queryClient.clear()
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isRecovery,
        finishRecovery: () => setIsRecovery(false),
        signOut: async () => {
          await supabase.auth.signOut()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
