'use client'

import React from 'react'
import Icon from './Icon'

// ─── Avatar ──────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase()
}

export function avatarGradient(seed: string) {
  const palettes = [
    'linear-gradient(135deg,#4F7DFF,#7BA0FF)',
    'linear-gradient(135deg,#34D399,#60A5FA)',
    'linear-gradient(135deg,#A78BFA,#F87171)',
    'linear-gradient(135deg,#F4B95E,#F87171)',
    'linear-gradient(135deg,#60A5FA,#A78BFA)',
    'linear-gradient(135deg,#34D399,#FBBF24)',
    'linear-gradient(135deg,#F87171,#A78BFA)',
    'linear-gradient(135deg,#4F7DFF,#34D399)',
  ]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  gradient?: string
}

export function Avatar({ name, size = 'md', gradient }: AvatarProps) {
  const cls = size === 'sm' ? 'av av-sm' : size === 'lg' ? 'av av-lg' : size === 'xl' ? 'av av-xl' : 'av'
  return (
    <span className={cls} style={{ background: gradient || avatarGradient(name || '?') }}>
      {initials(name || '?')}
    </span>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────
interface SparklineProps {
  values: number[]
  up?: boolean
}

export function Sparkline({ values, up = true }: SparklineProps) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const w = 90, h = 36, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1)
    const y = h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2)
    return [x, y]
  })
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const fill = `${d} L${w - pad},${h} L${pad},${h} Z`
  const color = up ? 'var(--success)' : 'var(--error)'
  return (
    <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`}>
      <path d={fill} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────
interface KPIProps {
  label: string
  icon?: string
  value: string
  unit?: string
  delta?: number
  deltaLabel?: string
  spark?: number[]
}

export function KPI({ label, icon, value, unit, delta, deltaLabel = 'vs mes anterior', spark }: KPIProps) {
  const trend = delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'dn' : 'flat'
  const arrow = trend === 'up' ? 'ArrowUp' : trend === 'dn' ? 'ArrowDown' : 'ArrowRight'
  return (
    <div className="kpi">
      <div className="kpi-lbl">
        {icon ? <Icon name={icon} size={14} /> : null}
        <span>{label}</span>
      </div>
      <div className="kpi-val">
        {value}
        {unit ? <span style={{ fontSize: 16, color: 'var(--fg-3)', marginLeft: 4 }}>{unit}</span> : null}
      </div>
      <div className="kpi-foot">
        {trend ? (
          <span className={'kpi-trend ' + trend}>
            <Icon name={arrow} size={12} stroke={2.4} />
            {Math.abs(delta!)}%
          </span>
        ) : null}
        <span>{deltaLabel}</span>
      </div>
      {spark ? <Sparkline values={spark} up={trend !== 'dn'} /> : null}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  dot?: boolean
  className?: string
}

export function Badge({ children, variant = 'neutral', dot, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  )
}

interface RolePillProps { role: string }

export function RolePill({ role }: RolePillProps) {
  const map: Record<string, string> = {
    admin: 'admin', superadmin: 'admin',
    supervisor: 'supervisor',
    agente: 'agente',
    asistente: 'viewer', auditor: 'viewer',
  }
  return <span className={`role-pill role-${map[role] || 'viewer'}`}>{role}</span>
}

// ─── Modal ────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null
  return (
    <div className="scrim" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div className="ttl">{title}</div>
            {subtitle ? <div className="sub">{subtitle}</div> : null}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Cerrar">
            <Icon name="X" size={14} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}

// ─── Side Panel ──────────────────────────────────────────────────────────
interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function SidePanel({ open, onClose, title, subtitle, children, actions }: SidePanelProps) {
  if (!open) return null
  return (
    <div className="scrim" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-hd">
          <div>
            <div className="ttl" style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
            {subtitle ? <div className="sub" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{subtitle}</div> : null}
          </div>
          <div className="hstack">
            {actions}
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <Icon name="X" size={14} />
            </button>
          </div>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  )
}

// ─── Segmented ────────────────────────────────────────────────────────────
interface SegmentedOption { value: string; label: string }
interface SegmentedProps {
  options: SegmentedOption[]
  value: string
  onChange: (v: string) => void
}

export function Segmented({ options, value, onChange }: SegmentedProps) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────
interface TabDef { value: string; label: string; icon?: string; count?: number }
interface TabsProps {
  tabs: TabDef[]
  value: string
  onChange: (v: string) => void
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <div
          key={t.value}
          className={'tab ' + (value === t.value ? 'active' : '')}
          onClick={() => onChange(t.value)}
        >
          {t.icon ? <Icon name={t.icon} size={14} /> : null}
          {t.label}
          {t.count != null ? <span className="count">{t.count}</span> : null}
        </div>
      ))}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────
interface ToggleProps { on: boolean; onChange?: (v: boolean) => void }

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      className={'toggle ' + (on ? 'on' : '')}
      onClick={() => onChange?.(!on)}
      aria-pressed={on}
    />
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────
interface EmptyProps {
  icon?: string
  title: string
  sub?: string
  action?: React.ReactNode
}

export function Empty({ icon = 'Search', title, sub, action }: EmptyProps) {
  return (
    <div className="empty">
      <div className="empty-art"><Icon name={icon} size={28} /></div>
      <div className="empty-ttl">{title}</div>
      {sub ? <div className="empty-sub">{sub}</div> : null}
      {action}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
interface SkelProps { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }

export function Skel({ w = '100%', h = 12, r = 4, style }: SkelProps) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

// ─── Sort Header ──────────────────────────────────────────────────────────
interface SortHeaderProps {
  children: React.ReactNode
  active?: boolean
  dir?: 'asc' | 'desc'
  onClick?: () => void
}

export function SortHeader({ children, active, dir, onClick }: SortHeaderProps) {
  return (
    <th className="sortable" onClick={onClick}>
      {children}
      {active ? (
        <Icon name={dir === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={12} className="sort-ic active" />
      ) : (
        <Icon name="ChevronsUpDown" size={12} className="sort-ic" />
      )}
    </th>
  )
}
