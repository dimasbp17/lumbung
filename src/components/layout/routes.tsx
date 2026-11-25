import { Navigate, Outlet, useLocation } from "react-router"

import { SplashScreen } from "@/components/common/status"
import { useAuth } from "@/providers/auth-context"

/** Signed-in users only. */
export function ProtectedRoute() {
  const { session, isLoading, isRecovery } = useAuth()
  const location = useLocation()

  if (isLoading) return <SplashScreen />
  if (isRecovery) return <Navigate to="/reset-password" replace />
  if (!session) return <Navigate to="/masuk" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Guests only (signed out): sign in, sign up, forgot password. */
export function GuestRoute() {
  const { session, isLoading } = useAuth()
  if (isLoading) return <SplashScreen />
  if (session) return <Navigate to="/beranda" replace />
  return <Outlet />
}
