'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Notebook,
  Users,
  FileText,
  DollarSign,
  Activity,
  MessageCircle,
  Facebook,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  BarChart2,
  Send,
  ShoppingBag,
} from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalogo', label: 'Catálogo EBSA', icon: Notebook },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/planes', label: 'Planes Activos', icon: FileText },
  { href: '/comisiones', label: 'Comisiones', icon: DollarSign },
  { href: '/actividades', label: 'Actividades', icon: Activity },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/messenger', label: 'Messenger', icon: Facebook },
  { href: '/campanas', label: 'Campañas', icon: Send },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, permissions, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  function closeSidebar() {
    setIsOpen(false)
  }

  const roleLabels: {[key: string]: string} = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    agente: 'Agente',
    superadmin: 'Super Admin',
    asistente: 'Asistente',
    auditor: 'Auditor'
  }

  const roleColors: {[key: string]: string} = {
    admin: 'from-error to-warning',
    supervisor: 'from-accent to-excellent',
    agente: 'from-success to-sana',
    superadmin: 'from-excellent to-error',
    asistente: 'from-confort to-warning',
    auditor: 'from-border to-accent'
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg text-white hover:bg-border transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        w-60 h-screen bg-card border-r border-border fixed left-0 top-0 flex flex-col z-40 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-border">
          <h1 className="text-xl lg:text-2xl font-bold text-accent">CRM Medicina Prepaga</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-1">Convierte Prospectos en Afiliados</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-gray-300 hover:bg-border hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
            {permissions?.can_view_reports && (
              <li>
                <Link
                  href="/reportes"
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    pathname === '/reportes'
                      ? 'bg-accent text-white'
                      : 'text-gray-300 hover:bg-border hover:text-white'
                  }`}
                >
                  <BarChart2 size={20} />
                  <span className="font-medium">Reportes</span>
                </Link>
              </li>
            )}
            {(permissions?.can_create_campaigns || permissions?.can_send_campaigns) && (
              <li>
                <Link
                  href="/campanas?tab=tienda"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-300 hover:bg-border hover:text-white"
                >
                  <ShoppingBag size={20} />
                  <span className="font-medium">Promo Tienda</span>
                </Link>
              </li>
            )}
            {permissions?.can_view_audit_log && (
              <li>
                <Link
                  href="/auditoria"
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    pathname === '/auditoria'
                      ? 'bg-accent text-white'
                      : 'text-gray-300 hover:bg-border hover:text-white'
                  }`}
                >
                  <ClipboardList size={20} />
                  <span className="font-medium">Auditoría</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColors[user.role] || 'from-accent to-excellent'} flex items-center justify-center text-white font-bold`}>
                  {user.full_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.full_name}</p>
                  <p className="text-xs text-gray-400">{roleLabels[user.role]}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-border hover:bg-error/20 hover:text-error rounded-lg transition-colors text-sm"
              >
                <LogOut size={16} />
                Salir
              </button>
            </>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              No conectado
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
