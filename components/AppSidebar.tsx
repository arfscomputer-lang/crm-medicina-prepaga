'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Icon from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Components'

const NAV_MAIN = [
  { id: '/',             label: 'Dashboard',    icon: 'Home' },
  { id: '/clientes',     label: 'Clientes',     icon: 'Users' },
  { id: '/planes',       label: 'Planes',       icon: 'ShieldCheck' },
  { id: '/catalogo',     label: 'Catálogo',     icon: 'BookOpen' },
  { id: '/comisiones',   label: 'Comisiones',   icon: 'DollarSign' },
  { id: '/actividades',  label: 'Actividades',  icon: 'Activity' },
]

const NAV_CHANNELS = [
  { id: '/whatsapp',  label: 'WhatsApp',  icon: 'MessageCircle' },
  { id: '/messenger', label: 'Messenger', icon: 'MessageSquare' },
  { id: '/campanas',  label: 'Campañas',  icon: 'Send' },
]

const NAV_SYSTEM = [
  { id: '/configuracion', label: 'Configuración', icon: 'Settings' },
]

function NavItem({ item, active, onClick }: { item: { id: string; label: string; icon: string; count?: number }; active: boolean; onClick: () => void }) {
  return (
    <div className={'sb-link ' + (active ? 'active' : '')} onClick={onClick}>
      <Icon name={item.icon} size={15} />
      <span>{item.label}</span>
      {item.count != null ? <span className="count">{item.count}</span> : null}
    </div>
  )
}

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function go(path: string) {
    router.push(path)
  }

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const isActive = (id: string) => id === '/' ? pathname === '/' : pathname.startsWith(id)

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">SC</div>
        <div className="sb-brand-text">
          <span className="nm">SeguroCRM</span>
          <span className="sb">Medicina prepaga</span>
        </div>
      </div>

      <div className="sb-org">
        <span className="ic">EB</span>
        <span className="nm">EBSA Asunción Centro</span>
        <Icon name="ChevronsUpDown" size={12} className="chev" />
      </div>

      <div className="sb-section">Principal</div>
      <div className="sb-nav">
        {NAV_MAIN.map(item => (
          <NavItem key={item.id} item={item} active={isActive(item.id)} onClick={() => go(item.id)} />
        ))}
      </div>

      <div className="sb-section">Canales</div>
      <div className="sb-nav">
        {NAV_CHANNELS.map(item => (
          <NavItem key={item.id} item={item} active={isActive(item.id)} onClick={() => go(item.id)} />
        ))}
      </div>

      <div className="sb-section">Sistema</div>
      <div className="sb-nav">
        {NAV_SYSTEM.map(item => (
          <NavItem key={item.id} item={item} active={isActive(item.id)} onClick={() => go(item.id)} />
        ))}
      </div>

      <div className="sb-footer">
        <div className="sb-user" onClick={handleLogout} title="Cerrar sesión">
          {user ? (
            <>
              <Avatar name={user.full_name} />
              <div className="meta">
                <span className="nm">{user.full_name}</span>
                <span className="em">{user.email}</span>
              </div>
              <Icon name="LogOut" size={14} className="more" />
            </>
          ) : (
            <span className="nm" style={{ fontSize: 12, color: 'var(--fg-3)' }}>No conectado</span>
          )}
        </div>
      </div>
    </aside>
  )
}
