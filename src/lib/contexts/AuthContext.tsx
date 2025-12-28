'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: number
  email: string
  name: string
  role_id: number
  role_name?: string
  branches: number[]  // Array of branch IDs user has access to
  status: string
}

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)

        if (session?.user) {
          await loadProfile(session.user.email)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)

      if (session?.user) {
        await loadProfile(session.user.email)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (email: string | undefined) => {
    if (!email) return

    try {
      // Get user profile from w_users table
      const { data: userData, error: userError } = await supabase
        .from('w_users')
        .select(`
          id,
          email,
          name,
          role_id,
          status,
          w_roles (name)
        `)
        .eq('email', email)
        .single()

      if (userError || !userData) {
        console.error('Error loading user profile:', userError)
        // Set a default profile with all branches for now
        const { data: branches } = await supabase
          .from('w_branches')
          .select('id')
          .eq('status', 'A')

        setProfile({
          id: 0,
          email: email,
          name: 'User',
          role_id: 0,
          branches: branches?.map(b => b.id) || [],
          status: 'A'
        })
        return
      }

      // Get user branches
      const { data: userBranches } = await supabase
        .from('w_user_branches')
        .select('branch_id')
        .eq('user_id', userData.id)

      setProfile({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role_id: userData.role_id,
        role_name: (userData.w_roles as any)?.name,
        branches: userBranches?.map(b => b.branch_id) || [],
        status: userData.status
      })
    } catch (error) {
      console.error('Error in loadProfile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return a default value if not wrapped in provider (for compatibility)
    return {
      user: null,
      profile: null,
      loading: false,
      signIn: async () => ({ error: new Error('AuthProvider not found') }),
      signOut: async () => {}
    }
  }
  return context
}
