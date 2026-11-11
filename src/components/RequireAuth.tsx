import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/lib/auth"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }
  return children
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
