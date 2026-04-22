'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'supervisor' | 'agente' | 'superadmin' | 'asistente' | 'auditor'

export type User = {
  id: string
  org_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
}

export type Permissions = {
  can_delete_clients: boolean
  can_delete_plans: boolean
  can_delete_activities: boolean
  can_create_clients: boolean
  can_edit_clients: boolean
  can_create_plans: boolean
  can_edit_plans: boolean
  can_create_activities: boolean
  can_manage_users: boolean
  can_manage_org: boolean
  can_view_all_clients: boolean
  can_view_all_plans: boolean
  can_view_all_commissions: boolean
  can_view_all_activities: boolean
}

type AuthContextType = {
  user: User | null
  permissions: Permissions | null
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        loadUserProfile(session.user.email!)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadUserProfile(session.user.email!)
      } else {
        setUser(null)
        setPermissions(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, org_id, full_name, email, role, avatar_url')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (data) {
        const userData: User = {
          id: data.id,
          org_id: data.org_id,
          full_name: data.full_name,
          email: data.email,
          role: data.role as UserRole,
          avatar_url: data.avatar_url,
        }
        setUser(userData)
        await loadPermissions(userData.org_id, userData.role)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setLoading(false)
    }
  }

  async function loadPermissions(orgId: string, role: UserRole) {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('org_id', orgId)
        .eq('role', role)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setPermissions({
          can_delete_clients: data.can_delete_clients,
          can_delete_plans: data.can_delete_plans,
          can_delete_activities: data.can_delete_activities,
          can_create_clients: data.can_create_clients,
          can_edit_clients: data.can_edit_clients,
          can_create_plans: data.can_create_plans,
          can_edit_plans: data.can_edit_plans,
          can_create_activities: data.can_create_activities,
          can_manage_users: data.can_manage_users,
          can_manage_org: data.can_manage_org,
          can_view_all_clients: data.can_view_all_clients,
          can_view_all_plans: data.can_view_all_plans,
          can_view_all_commissions: data.can_view_all_commissions,
          can_view_all_activities: data.can_view_all_activities,
        })
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (data.user) {
        await loadUserProfile(data.user.email!)
      }
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setPermissions(null)
      setSession(null)
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, permissions, session, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
