import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isConfigured } from '../lib/supabase'

interface UserAuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null; needsConfirm?: boolean }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const UserAuthContext = createContext<UserAuthState | null>(null)

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured || !supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured || !supabase) return { error: 'Demo mode' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!isConfigured || !supabase) return { error: 'Demo mode' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })
    if (error) return { error: error.message }
    // If email confirmation is required, user is not in session yet
    const needsConfirm = !data.session
    return { error: null, needsConfirm }
  }

  const signInWithGoogle = async () => {
    if (!isConfigured || !supabase) return { error: 'Demo mode' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/mon-compte` },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    if (!isConfigured || !supabase) return
    await supabase.auth.signOut()
  }

  return (
    <UserAuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </UserAuthContext.Provider>
  )
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext)
  if (!ctx) throw new Error('useUserAuth must be inside UserAuthProvider')
  return ctx
}
