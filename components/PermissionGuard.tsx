'use client'

import { useAuth } from '@/lib/auth-context'

type PermissionGuardProps = {
  children: React.ReactNode
  permission: keyof import('@/lib/auth-context').Permissions
  fallback?: React.ReactNode
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { permissions } = useAuth()

  if (!permissions || !permissions[permission]) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function RoleBadge() {
  const { user } = useAuth()

  if (!user) return null

  const roleConfig: {[key: string]: {label: string, color: string}} = {
    admin: { label: 'ADMIN', color: 'bg-error text-white' },
    supervisor: { label: 'SUPERVISOR', color: 'bg-accent text-white' },
    agente: { label: 'AGENTE', color: 'bg-success text-white' },
    superadmin: { label: 'SUPER', color: 'bg-excellent text-white' },
    asistente: { label: 'ASISTENTE', color: 'bg-warning text-black' },
    auditor: { label: 'AUDITOR', color: 'bg-border text-white' }
  }

  const config = roleConfig[user.role] || roleConfig.agente

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
      {config.label}
    </span>
  )
}
