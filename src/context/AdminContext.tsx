import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

interface AdminUser {
  id: string
  email: string
}

interface AdminContextValue {
  user: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      // Local preview only: Vite removes this branch from production builds.
      if (import.meta.env.DEV) {
        setUser({ id: 'demo', email: email || 'demo@bks.local' })
        return { error: null }
      }
      return { error: 'Supabase Auth — configurez vos identifiants dans .env.local' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!isConfigured) { setUser(null); return }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AdminContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
