import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

type AuthState = {
  session: Session | null
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, is_platform_admin")
    .eq("id", userId)
    .maybeSingle()
  if (error) {
    console.error(error)
    return null
  }
  return data
}

async function fetchIsDealershipAdmin(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("dealership_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "dealership_admin")
  if (error) {
    console.error(error)
    return false
  }
  return (count ?? 0) > 0
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isDealershipAdmin, setIsDealershipAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      setIsDealershipAdmin(false)
      return
    }
    const [p, admin] = await Promise.all([
      fetchProfile(userId),
      fetchIsDealershipAdmin(userId),
    ])
    setProfile(p)
    setIsDealershipAdmin(admin)
  }, [session?.user?.id])

  useEffect(() => {
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: Boolean(profile?.is_platform_admin) || isDealershipAdmin,
      loading,
      refreshProfile,
      signOut,
    }),
    [session, profile, isDealershipAdmin, loading, refreshProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
