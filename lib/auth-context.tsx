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
  // Dashboard
  can_view_dashboard: boolean
  // Catálogo
  can_view_catalog: boolean
  can_manage_catalog: boolean
  can_upload_plan_pdfs: boolean
  // Clientes
  can_view_clients: boolean
  can_create_clients: boolean
  can_edit_clients: boolean
  can_delete_clients: boolean
  can_view_all_clients: boolean
  // Planes
  can_view_plans: boolean
  can_create_plans: boolean
  can_edit_plans: boolean
  can_delete_plans: boolean
  can_view_all_plans: boolean
  // Comisiones
  can_view_commissions: boolean
  can_view_all_commissions: boolean
  can_manage_commissions: boolean
  // Actividades
  can_view_activities: boolean
  can_create_activities: boolean
  can_view_all_activities: boolean
  can_delete_activities: boolean
  // Pagos
  can_view_payments: boolean
  can_create_payments: boolean
  can_edit_payments: boolean
  // Mensajería
  can_use_whatsapp: boolean
  can_use_messenger: boolean
  can_create_campaigns: boolean
  can_send_campaigns: boolean
  // Facturación
  can_view_invoices: boolean
  can_create_invoices: boolean
  // Administración
  can_view_reports: boolean
  can_export_data: boolean
  can_manage_users: boolean
  can_manage_org: boolean
  can_view_audit_log: boolean
}

// Thrown by login() when the user has MFA enabled
export class MfaRequiredError extends Error {
  factorId: string
  constructor(factorId: string) {
    super('MFA_REQUIRED')
    this.name = 'MfaRequiredError'
    this.factorId = factorId
  }
}

type AuthContextType = {
  user: User | null
  permissions: Permissions | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  verifyMfaLogin: (factorId: string, code: string) => Promise<void>
  enrollMfa: () => Promise<{ qrCode: string; secret: string; factorId: string }>
  unenrollMfa: (factorId: string) => Promise<void>
  logout: () => Promise<void>
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
          can_view_dashboard: data.can_view_dashboard,
          can_view_catalog: data.can_view_catalog,
          can_manage_catalog: data.can_manage_catalog,
          can_upload_plan_pdfs: data.can_upload_plan_pdfs,
          can_view_clients: data.can_view_clients,
          can_create_clients: data.can_create_clients,
          can_edit_clients: data.can_edit_clients,
          can_delete_clients: data.can_delete_clients,
          can_view_all_clients: data.can_view_all_clients,
          can_view_plans: data.can_view_plans,
          can_create_plans: data.can_create_plans,
          can_edit_plans: data.can_edit_plans,
          can_delete_plans: data.can_delete_plans,
          can_view_all_plans: data.can_view_all_plans,
          can_view_commissions: data.can_view_commissions,
          can_view_all_commissions: data.can_view_all_commissions,
          can_manage_commissions: data.can_manage_commissions,
          can_view_activities: data.can_view_activities,
          can_create_activities: data.can_create_activities,
          can_view_all_activities: data.can_view_all_activities,
          can_delete_activities: data.can_delete_activities,
          can_view_payments: data.can_view_payments,
          can_create_payments: data.can_create_payments,
          can_edit_payments: data.can_edit_payments,
          can_use_whatsapp: data.can_use_whatsapp,
          can_use_messenger: data.can_use_messenger,
          can_create_campaigns: data.can_create_campaigns,
          can_send_campaigns: data.can_send_campaigns,
          can_view_invoices: data.can_view_invoices,
          can_create_invoices: data.can_create_invoices,
          can_view_reports: data.can_view_reports,
          can_export_data: data.can_export_data,
          can_manage_users: data.can_manage_users,
          can_manage_org: data.can_manage_org,
          can_view_audit_log: data.can_view_audit_log,
        })
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Check if MFA verification is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.currentLevel !== aal.nextLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]
      if (totpFactor) throw new MfaRequiredError(totpFactor.id)
    }

    if (data.user) await loadUserProfile(data.user.email!)
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  async function verifyMfaLogin(factorId: string, code: string) {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) throw challengeError

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    if (error) throw error

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) await loadUserProfile(user.email)
  }

  async function enrollMfa() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) throw error
    return {
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    }
  }

  async function unenrollMfa(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) throw error
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setPermissions(null)
      setSession(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, permissions, session, loading,
      login, loginWithGoogle, verifyMfaLogin,
      enrollMfa, unenrollMfa, logout,
    }}>
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
