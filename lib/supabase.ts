import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Client = {
  id: string
  org_id: string
  agent_id: string
  first_name: string
  last_name: string
  full_name?: string
  cedula?: string
  phone: string
  email?: string
  facebook_username?: string
  preferred_channel: string
  status: 'prospecto' | 'cotizado' | 'activo' | 'vencido' | 'cancelado' | 'inactivo'
  last_contact_at?: string
  created_at: string
}

export type PlanCatalog = {
  id: string
  org_id: string
  code: string
  name: string
  tier: 'sana' | 'confort' | 'excellent' | 'adultos_mayores'
  tier_level: number
  tagline?: string
  icon?: string
  color?: string
  agent_commission_pct: number
  provider_name?: string
  provider_network?: string
  pdf_document_url?: string | null
  is_active: boolean
}

export type PlanCoverage = {
  id: string
  plan_catalog_id: string
  category: string
  quantity: string
  waiting_period: string
  details?: string
  is_unlimited: boolean
  waiting_days: number
}

export type ClientPlan = {
  id: string
  org_id: string
  client_id: string
  agent_id: string
  plan_catalog_id?: string
  plan_tier: 'sana' | 'confort' | 'excellent' | 'adultos_mayores'
  status: 'cotizado' | 'pendiente' | 'activo' | 'suspendido' | 'vencido' | 'cancelado' | 'renovado'
  monthly_premium: number
  annual_premium: number
  commission_pct: number
  start_date?: string
  end_date?: string
  num_beneficiaries: number
  created_at: string
}

export type Activity = {
  id: string
  org_id: string
  client_id: string
  agent_id: string
  channel: string
  activity_type: string
  message: string
  created_at: string
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
