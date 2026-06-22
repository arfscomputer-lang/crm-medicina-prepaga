import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

// createBrowserClient stores the session in cookies instead of localStorage,
// which allows the server-side middleware to validate the session via getUser().
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

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

export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
