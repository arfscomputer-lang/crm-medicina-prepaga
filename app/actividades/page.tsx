'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Avatar, Badge, Modal, Segmented } from '@/components/ui/Components'
import { supabase, Client } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type ActivityRow = {
  id: string
  channel: string
  activity_type: string
  subject?: string
  message: string
  created_at: string
  client_id: string
  client?: { full_name: string; phone: string }
}

const CHANNEL_MAP: Record<string, { ic: string; label: string; color: string }> = {
  whatsapp:  { ic: 'MessageCircle', label: 'WhatsApp',  color: 'var(--success)' },
  messenger: { ic: 'MessageSquare', label: 'Messenger', color: 'var(--info)' },
  llamada:   { ic: 'Phone',         label: 'Llamada',   color: 'var(--warning)' },
  call:      { ic: 'Phone',         label: 'Llamada',   color: 'var(--warning)' },
  email:     { ic: 'Mail',          label: 'Email',     color: 'var(--accent)' },
  reunion:   { ic: 'Users',         label: 'Reunión',   color: 'var(--fg-2)' },
  meeting:   { ic: 'Users',         label: 'Reunión',   color: 'var(--fg-2)' },
}

type ActivityForm = {
  client_id: string; channel: string; activity_type: string
  subject: string; message: string; requires_followup: boolean; followup_date: string
}

export default function ActividadesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ActivityForm>({
    client_id: '', channel: 'whatsapp', activity_type: 'contacto_inicial',
    subject: '', message: '', requires_followup: false, followup_date: '',
  })

  useEffect(() => {
    Promise.all([loadActivities(), loadClients()])
  }, [])

  async function loadActivities() {
    try {
      const { data } = await supabase
        .from('activities')
        .select('*, client:clients(full_name, phone)')
        .order('created_at', { ascending: false })
      if (data) setActivities(data as any)
    } finally {
      setLoading(false)
    }
  }

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('full_name')
    if (data) setClients(data)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.client_id || !form.message.trim()) return
    setSaving(true)
    try {
      await supabase.from('activities').insert({
        org_id: user.org_id, client_id: form.client_id, agent_id: user.id,
        channel: form.channel, activity_type: form.activity_type,
        subject: form.subject.trim() || null, message: form.message.trim(),
        requires_followup: form.requires_followup,
        followup_date: form.requires_followup && form.followup_date ? form.followup_date : null,
      })
      await loadActivities()
      setShowModal(false)
      setForm({ client_id: '', channel: 'whatsapp', activity_type: 'contacto_inicial', subject: '', message: '', requires_followup: false, followup_date: '' })
    } finally {
      setSaving(false)
    }
  }

  const filtered = activities.filter(a => {
    const matchSearch = !search || a.message.toLowerCase().includes(search.toLowerCase()) || a.client?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchCh = channelFilter === 'all' || a.channel === channelFilter
    return matchSearch && matchCh
  })

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  function groupByDay(list: ActivityRow[]) {
    const groups: { dateStr: string; label: string; items: ActivityRow[] }[] = []
    const map = new Map<string, ActivityRow[]>()
    list.forEach(a => {
      const d = a.created_at.split('T')[0]
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(a)
    })
    map.forEach((items, dateStr) => {
      const d = new Date(dateStr + 'T12:00:00')
      const today = new Date(); today.setHours(0,0,0,0)
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
      d.setHours(0,0,0,0)
      const label = d.getTime() === today.getTime() ? 'Hoy'
        : d.getTime() === yesterday.getTime() ? 'Ayer'
        : d.toLocaleDateString('es-PY', { day: 'numeric', month: 'long' })
      groups.push({ dateStr, label, items })
    })
    return groups.sort((a, b) => b.dateStr.localeCompare(a.dateStr))
  }

  const grouped = groupByDay(filtered)
  const channels = ['all', ...Array.from(new Set(activities.map(a => a.channel)))]

  return (
    <AppShell>
      <Topbar
        title="Actividades"
        right={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icon name="Plus" size={13} className="ic" />Nueva actividad
          </button>
        }
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Actividades CRM</div>
              <div className="fg-3" style={{ fontSize: 13 }}>
                {activities.length} registros · {activities.filter(a => new Date(a.created_at) >= thisMonth).length} este mes · {activities.filter(a => new Date(a.created_at) >= thisWeek).length} esta semana
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div className="input-with-icon" style={{ width: 300 }}>
              <Icon name="Search" size={13} className="ic" />
              <input className="input" placeholder="Buscar actividades..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="seg">
              {channels.slice(0, 5).map(ch => {
                const info = CHANNEL_MAP[ch]
                return (
                  <button key={ch} className={channelFilter === ch ? 'active' : ''} onClick={() => setChannelFilter(ch)}>
                    {ch === 'all' ? 'Todos' : info?.label ?? ch}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Timeline */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="card" style={{ padding: 14, display: 'flex', gap: 12 }}>
                  <div className="skel" style={{ width: 28, height: 28, borderRadius: 7 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel" style={{ width: '30%', height: 11, marginBottom: 6 }} />
                    <div className="skel" style={{ width: '70%', height: 11 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--fg-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Sin actividades</div>
              <div style={{ fontSize: 13 }}>Registrá tu primera actividad con un cliente.</div>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.dateStr} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.items.map(a => {
                    const ch = CHANNEL_MAP[a.channel] || CHANNEL_MAP.llamada
                    const time = new Date(a.created_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={a.id} className="card" style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, background: 'var(--bg-3)',
                          border: '1px solid var(--border-soft)', display: 'grid', placeItems: 'center',
                          color: ch.color, flexShrink: 0,
                        }}>
                          <Icon name={ch.ic} size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{a.client?.full_name ?? 'Cliente'}</div>
                            <span className="fg-3 mono" style={{ fontSize: 11, flexShrink: 0 }}>{time}</span>
                          </div>
                          {a.subject && (
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-1)', marginTop: 2 }}>{a.subject}</div>
                          )}
                          <div className="fg-2" style={{ fontSize: 12, marginTop: 2 }}>{a.message}</div>
                          <div style={{ marginTop: 6 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, color: ch.color, background: 'var(--bg-3)',
                              border: '1px solid var(--border-soft)', borderRadius: 999,
                              padding: '2px 8px',
                            }}>
                              <Icon name={ch.ic} size={10} />
                              {ch.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva actividad"
        subtitle="Registrá una interacción con un cliente"
        footer={
          <div className="hstack" style={{ marginLeft: 'auto' }}>
            <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={e => handleSave(e as any)} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label">Cliente *</label>
              <select className="select" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Canal</label>
                <select className="select" value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="messenger">Messenger</option>
                  <option value="llamada">Llamada</option>
                  <option value="email">Email</option>
                  <option value="reunion">Reunión</option>
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="select" value={form.activity_type} onChange={e => setForm(p => ({ ...p, activity_type: e.target.value }))}>
                  <option value="contacto_inicial">Contacto inicial</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="cotizacion">Cotización</option>
                  <option value="cierre">Cierre</option>
                  <option value="renovacion">Renovación</option>
                  <option value="reclamo">Reclamo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Asunto</label>
              <input className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Resumen corto (opcional)" />
            </div>
            <div>
              <label className="label">Notas *</label>
              <textarea className="input" rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required placeholder="Detallá la interacción..." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" className="chk" checked={form.requires_followup} onChange={e => setForm(p => ({ ...p, requires_followup: e.target.checked }))} id="followup" />
              <label htmlFor="followup" style={{ fontSize: 13, cursor: 'pointer' }}>Requiere seguimiento</label>
              {form.requires_followup && (
                <input className="input" type="date" value={form.followup_date} onChange={e => setForm(p => ({ ...p, followup_date: e.target.value }))} style={{ width: 160 }} />
              )}
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
