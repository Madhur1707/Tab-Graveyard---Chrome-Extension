import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export type AuthUser = {
  id: string
  email: string
  is_pro: boolean
} | null

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email ?? '')
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes.
    // IMPORTANT: do NOT await Supabase calls directly inside this callback —
    // Supabase holds an internal auth lock while it runs, so awaiting another
    // Supabase query here deadlocks (getSession never resolves → stuck loading).
    // Defer the profile fetch to a separate task instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const { id, email } = session.user
          setTimeout(() => {
            if (active) fetchUserProfile(id, email ?? '')
          }, 0)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(id: string, email: string) {
    if (!supabase) {
      setUser({ id, email, is_pro: false })
      setLoading(false)
      return
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('id, email, is_pro')
        .eq('id', id)
        .single()

      if (data) {
        setUser(data as AuthUser)
      } else {
        setUser({ id, email, is_pro: false })
      }
    } catch {
      setUser({ id, email, is_pro: false })
    }
    setLoading(false)
  }

  async function signInWithEmail(email: string) {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured for this extension.' } }
    }

    // No emailRedirectTo: we use the 6-digit code from the email (verifyOtp),
    // which avoids the magic-link redirect that can't return to an extension.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    return { error }
  }

  // DEV/TEST sign-in: email + password against a user you created in the
  // Supabase dashboard (Authentication → Users → Add user, Auto Confirm ON).
  // No email delivery needed — fastest way to get a real session for testing.
  async function signInWithPassword(email: string, password: string) {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured for this extension.' } }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { error }
  }

  async function verifyOtp(email: string, token: string) {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured for this extension.' } }
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'email',
    })
    // On success, onAuthStateChange fires and populates the user.
    return { error }
  }

  async function signOut() {
    if (!supabase) {
      setUser(null)
      return
    }

    await supabase.auth.signOut()
    setUser(null)
  }

  // DEV/TEST ONLY: flips the current user's is_pro flag in the DB so we can test
  // the Pro experience without Stripe. In production, is_pro must only be set by
  // the Stripe webhook (service role) — see supabase/schema.sql warning.
  async function setPro(isPro: boolean) {
    if (!supabase || !user) {
      return { error: { message: 'You must be signed in first.' } }
    }

    const { error } = await supabase
      .from('users')
      .upsert({ id: user.id, email: user.email, is_pro: isPro }, { onConflict: 'id' })

    if (!error) {
      setUser({ ...user, is_pro: isPro })
    }
    return { error }
  }

  return { user, loading, signInWithEmail, signInWithPassword, verifyOtp, signOut, setPro }
}
