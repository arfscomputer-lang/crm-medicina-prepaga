'use client'

import { useEffect, useState, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Badge, Modal, Empty } from '@/components/ui/Components'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type Campaign = {
  id: string
  name: string
  description: string | null
  channel: string
  status: string
  scheduled_at: string | null
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  created_at: string
  target_statuses: string[] | null
  target_plan_tiers: string[] | null
}

type CampaignForm = {
  name: string
  description: string
  channel: 'whatsapp' | 'messenger'
  target_statuses: string[]
  target_plan_tiers: string[]
  template_text: string
  scheduled_at: string
}

const CLIENT_STATUSES = [
  { id: 'prospecto',   label: 'Prospecto' },
  { id: 'contactado',  label: 'Contactado' },
  { id: 'cotizado',    label: 'Cotizado' },
  { id: 'negociacion', label: 'Negociación' },
  { id: 'activo',      label: 'Activo' },
  { id: 'vencido',     label: 'Vencido' },
]

const PLAN_TIERS = [
  { id: 'sana',           label: 'Sana' },
  { id: 'confort',        label: 'Confort' },
  { id: 'excellent',      label: 'Excellent' },
  { id: 'adultos_mayores',label: 'Adultos Mayores' },
]

const TEMPLATES = [
  { name: 'Bienvenida',        text: '¡Hola {nombre}! Soy tu asesor EBSA. ¿Te puedo ayudar a encontrar el plan de salud ideal?' },
  { name: 'Cotización',        text: 'Hola {nombre}, te comparto tu cotización del plan {plan}. ¿Tenés alguna consulta?' },
  { name: 'Recordatorio pago', text: 'Hola {nombre}, te recordamos que el pago de tu plan {plan} está próximo a vencer.' },
  { name: 'Renovación',        text: 'Hola {nombre}, tu plan {plan} vence pronto. ¿Conversamos sobre la renovación?' },
  { name: 'Cumpleaños',        text: '¡Feliz cumpleaños {nombre}! 🎂 Que tengas mucha salud en este nuevo año de vida. — Equipo EBSA.' },
]

const TIENDA_CATEGORIAS = [
  { id: 'electronica',     label: 'Electrónica',            emoji: '💻', url: 'https://ebsamultitienda.click/categoria/electronica' },
  { id: 'cocina',          label: 'Cocina',                 emoji: '🍳', url: 'https://ebsamultitienda.click/categoria/cocina' },
  { id: 'farmacia',        label: 'Farmacia',               emoji: '💊', url: 'https://ebsamultitienda.click/categoria/farmacia' },
  { id: 'bienestar',       label: 'Bienestar',              emoji: '🌿', url: 'https://ebsamultitienda.click/categoria/bienestar' },
  { id: 'cuidado_personal',label: 'Cuidado Personal',       emoji: '🧴', url: 'https://ebsamultitienda.click/categoria/cuidado-personal' },
  { id: 'equipos_medicos', label: 'Equipos Médicos',        emoji: '🩺', url: 'https://ebsamultitienda.click/categoria/equipos-medicos' },
  { id: 'promociones',     label: 'Promociones',            emoji: '🏷️', url: 'https://ebsamultitienda.click/promociones' },
  { id: 'todos',           label: 'Toda la tienda',         emoji: '🛍️', url: 'https://ebsamultitienda.click' },
]

type PromoForm = {
  titulo: string
  categoria: string
  descuento: string
  mensaje: string
  target_statuses: string[]
  target_plan_tiers: string[]
  scheduled_at: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'neutral' | 'accent' | 'warning' | 'success' | 'error' }> = {
  borrador:   { label: 'Borrador',    variant: 'neutral'  },
  programada: { label: 'Programada',  variant: 'accent'   },
  enviando:   { label: 'Enviando…',   variant: 'warning'  },
  completada: { label: 'Completada',  variant: 'success'  },
  cancelada:  { label: 'Cancelada',   variant: 'error'    },
}

const EMPTY_FORM: CampaignForm = {
  name: '', description: '', channel: 'whatsapp',
  target_statuses: [], target_plan_tiers: [],
  template_text: TEMPLATES[0].text, scheduled_at: '',
}

const EMPTY_PROMO: PromoForm = {
  titulo: '', categoria: 'todos', descuento: '', mensaje: '',
  target_statuses: [], target_plan_tiers: [], scheduled_at: '',
}

function toggleArr<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

export default function CampanasPage() {
  const { user, permissions } = useAuth()
  const [tab, setTab] = useState<'campanas' | 'tienda'>('campanas')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [launching, setLaunching] = useState<string | null>(null)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO)
  const [promoPreview, setPromoPreview] = useState<number | null>(null)
  const [savingPromo, setSavingPromo] = useState(false)

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    if (data) setCampaigns(data)
    setLoading(false)
  }

  // Debounced preview count
  useEffect(() => {
    if (!showModal) return
    const t = setTimeout(fetchPreview, 400)
    return () => clearTimeout(t)
  }, [form.target_statuses, form.target_plan_tiers, showModal])

  async function fetchPreview() {
    // If plan tiers selected, resolve matching client IDs first
    let clientIdFilter: string[] | null = null
    if (form.target_plan_tiers.length > 0) {
      const { data: planRows } = await supabase
        .from('client_plans')
        .select('client_id')
        .in('plan_tier', form.target_plan_tiers)
        .eq('status', 'activo')
      const ids = [...new Set((planRows ?? []).map((p: any) => p.client_id as string))]
      clientIdFilter = ids
      if (ids.length === 0) { setPreviewCount(0); return }
    }

    let q = supabase.from('clients').select('id', { count: 'exact', head: true })
    if (form.target_statuses.length > 0) q = q.in('status', form.target_statuses)
    if (clientIdFilter) q = q.in('id', clientIdFilter)

    const { count } = await q
    setPreviewCount(count ?? 0)
  }

  async function handleSave() {
    if (!user || !form.name.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('campaigns').insert({
        org_id: user.org_id,
        created_by: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        channel: form.channel,
        target_statuses: form.target_statuses.length > 0 ? form.target_statuses : null,
        target_plan_tiers: form.target_plan_tiers.length > 0 ? form.target_plan_tiers : null,
        status: form.scheduled_at ? 'programada' : 'borrador',
        scheduled_at: form.scheduled_at || null,
        total_recipients: previewCount ?? 0,
      })
      if (!error) {
        await loadCampaigns()
        closeModal()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleLaunch(campaign: Campaign) {
    if (!confirm(`¿Lanzar "${campaign.name}"? Se enviará a ${campaign.total_recipients} contactos.`)) return
    setLaunching(campaign.id)
    try {
      // Build client list from segment filters
      let clientIdFilter: string[] | null = null
      if (campaign.target_plan_tiers?.length) {
        const { data: planRows } = await supabase
          .from('client_plans').select('client_id')
          .in('plan_tier', campaign.target_plan_tiers).eq('status', 'activo')
        const ids = [...new Set((planRows ?? []).map((p: any) => p.client_id as string))]
        clientIdFilter = ids.length > 0 ? ids : []
      }

      let q = supabase.from('clients').select('id, full_name, first_name, last_name, phone')
      if (campaign.target_statuses?.length) q = q.in('status', campaign.target_statuses)
      if (clientIdFilter !== null) {
        if (clientIdFilter.length === 0) { alert('Sin contactos con esos filtros.'); return }
        q = q.in('id', clientIdFilter)
      }

      const { data: clients } = await q
      if (!clients?.length) { alert('No se encontraron contactos.'); return }

      // Save recipients + set status = enviando
      await supabase.from('campaign_recipients').insert(
        clients.map((c: any) => ({ campaign_id: campaign.id, client_id: c.id, status: 'pendiente' }))
      )
      await supabase.from('campaigns').update({
        status: 'enviando', started_at: new Date().toISOString(), total_recipients: clients.length,
      }).eq('id', campaign.id)

      // Call WA bulk API
      const contacts = clients.map((c: any) => ({
        id: c.id,
        name: c.full_name || `${c.first_name} ${c.last_name}`,
        phone: c.phone,
      }))
      const res = await fetch('/api/whatsapp/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts, templateName: 'bienvenida_ebsa' }),
      })
      const result = await res.json()

      await supabase.from('campaigns').update({
        status: 'completada',
        completed_at: new Date().toISOString(),
        sent_count: result.sent ?? clients.length,
        failed_count: result.failed ?? 0,
      }).eq('id', campaign.id)

      await loadCampaigns()
    } catch (e: any) {
      alert(`Error al enviar: ${e.message}`)
    } finally {
      setLaunching(null)
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('¿Cancelar esta campaña?')) return
    await supabase.from('campaigns').update({ status: 'cancelada' }).eq('id', id)
    await loadCampaigns()
  }

  function closeModal() {
    setShowModal(false)
    setForm(EMPTY_FORM)
    setPreviewCount(null)
  }

  useEffect(() => {
    if (!showPromoModal) return
    const t = setTimeout(fetchPromoPreview, 400)
    return () => clearTimeout(t)
  }, [promoForm.target_statuses, promoForm.target_plan_tiers, showPromoModal])

  async function fetchPromoPreview() {
    let clientIdFilter: string[] | null = null
    if (promoForm.target_plan_tiers.length > 0) {
      const { data: planRows } = await supabase
        .from('client_plans').select('client_id')
        .in('plan_tier', promoForm.target_plan_tiers).eq('status', 'activo')
      const ids = [...new Set((planRows ?? []).map((p: any) => p.client_id as string))]
      clientIdFilter = ids
      if (ids.length === 0) { setPromoPreview(0); return }
    }
    let q = supabase.from('clients').select('id', { count: 'exact', head: true })
    if (promoForm.target_statuses.length > 0) q = q.in('status', promoForm.target_statuses)
    if (clientIdFilter) q = q.in('id', clientIdFilter)
    const { count } = await q
    setPromoPreview(count ?? 0)
  }

  function buildPromoMessage(pf: PromoForm): string {
    const cat = TIENDA_CATEGORIAS.find(c => c.id === pf.categoria) ?? TIENDA_CATEGORIAS[7]
    const descLine = pf.descuento ? `🏷️ *${pf.descuento}% OFF* en ${cat.label}\n\n` : ''
    const tituloLine = pf.titulo ? `*${pf.titulo}*\n\n` : ''
    const mensajeLine = pf.mensaje ? `${pf.mensaje}\n\n` : ''
    return `${tituloLine}${descLine}${mensajeLine}🛒 Comprá ahora: ${cat.url}\n\n_Respondé este mensaje para consultar con un asesor._`
  }

  async function handleSavePromo() {
    if (!user || !promoForm.titulo.trim()) return
    const cat = TIENDA_CATEGORIAS.find(c => c.id === promoForm.categoria) ?? TIENDA_CATEGORIAS[7]
    setSavingPromo(true)
    try {
      const { error } = await supabase.from('campaigns').insert({
        org_id: user.org_id,
        created_by: user.id,
        name: `🛒 ${promoForm.titulo.trim()}`,
        description: `Promo Tienda · ${cat.emoji} ${cat.label}${promoForm.descuento ? ` · ${promoForm.descuento}% OFF` : ''}`,
        channel: 'whatsapp',
        target_statuses: promoForm.target_statuses.length > 0 ? promoForm.target_statuses : null,
        target_plan_tiers: promoForm.target_plan_tiers.length > 0 ? promoForm.target_plan_tiers : null,
        status: promoForm.scheduled_at ? 'programada' : 'borrador',
        scheduled_at: promoForm.scheduled_at || null,
        total_recipients: promoPreview ?? 0,
      })
      if (!error) {
        await loadCampaigns()
        setShowPromoModal(false)
        setPromoForm(EMPTY_PROMO)
        setPromoPreview(null)
        setTab('campanas')
      }
    } finally {
      setSavingPromo(false)
    }
  }

  const statTotals = campaigns.reduce((a, c) => ({
    total: a.total + 1,
    enviadas: a.enviadas + (c.status === 'completada' ? 1 : 0),
    destinatarios: a.destinatarios + (c.sent_count || 0),
  }), { total: 0, enviadas: 0, destinatarios: 0 })

  const catActual = TIENDA_CATEGORIAS.find(c => c.id === promoForm.categoria) ?? TIENDA_CATEGORIAS[7]

  return (
    <AppShell>
      <Topbar
        title="Campañas"
        right={
          permissions?.can_create_campaigns ? (
            tab === 'tienda'
              ? <button className="btn btn-primary" onClick={() => setShowPromoModal(true)}>
                  <Icon name="Plus" size={13} className="ic" />Nueva promoción
                </button>
              : <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  <Icon name="Plus" size={13} className="ic" />Nueva campaña
                </button>
          ) : undefined
        }
      />

      <div className="scroll-area">
        <div className="page">

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-soft)', paddingBottom: 0 }}>
            {[
              { id: 'campanas', label: 'Campañas masivas', icon: 'Send' },
              { id: 'tienda',   label: '🛒 Promociones Tienda', icon: 'ShoppingBag' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: tab === t.id ? 600 : 400,
                  color: tab === t.id ? 'var(--accent)' : 'var(--fg-3)',
                  borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: -1,
                }}
              >{t.label}</button>
            ))}
          </div>

          {tab === 'tienda' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
                {TIENDA_CATEGORIAS.map(cat => (
                  <a
                    key={cat.id}
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '14px 10px', background: 'var(--bg-2)',
                      border: '1px solid var(--border-soft)', borderRadius: 10, textDecoration: 'none',
                      color: 'var(--fg-1)', fontSize: 12, fontWeight: 500, textAlign: 'center',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                    {cat.label}
                  </a>
                ))}
              </div>
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 16, fontSize: 13, color: 'var(--fg-3)' }}>
                <Icon name="Info" size={13} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent)' }} />
                Las promociones se envían por WhatsApp con link directo a la categoría. Cuando el cliente responde, el bot de EBSA lo atiende automáticamente.
              </div>
            </div>
          )}

          {tab === 'campanas' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Campañas masivas</div>
              <div className="fg-3" style={{ fontSize: 13 }}>
                {statTotals.total} campañas · {statTotals.enviadas} completadas · {statTotals.destinatarios.toLocaleString()} mensajes enviados
              </div>
            </div>
          </div>
          )}

          {tab === 'campanas' && loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div className="skel" style={{ width: '65%', height: 14, marginBottom: 8 }} />
                  <div className="skel" style={{ width: '35%', height: 20, borderRadius: 999, marginBottom: 16 }} />
                  <div className="skel" style={{ width: '100%', height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : tab === 'campanas' && campaigns.length === 0 ? (
            <Empty
              icon="Send"
              title="Sin campañas todavía"
              sub="Creá tu primera campaña para enviar mensajes segmentados a clientes."
              action={
                permissions?.can_create_campaigns ? (
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Icon name="Plus" size={13} className="ic" />Nueva campaña
                  </button>
                ) : undefined
              }
            />
          ) : tab === 'campanas' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {campaigns.map(c => {
                const sc = STATUS_CONFIG[c.status] ?? { label: c.status, variant: 'neutral' as const }
                const canLaunch = (c.status === 'borrador' || c.status === 'programada') && permissions?.can_send_campaigns
                return (
                  <div key={c.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                        <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                          <Badge variant="neutral">{c.channel === 'whatsapp' ? 'WhatsApp' : 'Messenger'}</Badge>
                        </div>
                      </div>
                      <div style={{ color: c.channel === 'whatsapp' ? 'var(--success)' : 'var(--info)', flexShrink: 0 }}>
                        <Icon name={c.channel === 'whatsapp' ? 'MessageCircle' : 'MessageSquare'} size={18} />
                      </div>
                    </div>

                    {c.status === 'completada' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
                        {[
                          { label: 'Enviados',   val: c.sent_count,      color: 'var(--success)' },
                          { label: 'Entregados', val: c.delivered_count, color: 'var(--accent)'  },
                          { label: 'Fallidos',   val: c.failed_count,    color: 'var(--error)'   },
                        ].map(s => (
                          <div key={s.label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
                            <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 14 }}>
                        <Icon name="Users" size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {c.total_recipients} destinatarios ·{' '}
                        {new Date(c.created_at).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}

                    <div className="hstack" style={{ gap: 6 }}>
                      {canLaunch && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLaunch(c)}
                          disabled={!!launching}
                          style={{ flex: 1 }}
                        >
                          {launching === c.id
                            ? <><div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />Enviando…</>
                            : <><Icon name="Send" size={12} className="ic" />Lanzar</>
                          }
                        </button>
                      )}
                      {(c.status === 'borrador' || c.status === 'programada') && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Cancelar campaña" onClick={() => handleCancel(c.id)}>
                          <Icon name="X" size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal Promoción Tienda */}
      <Modal
        open={showPromoModal}
        onClose={() => { setShowPromoModal(false); setPromoForm(EMPTY_PROMO); setPromoPreview(null) }}
        title="Nueva Promoción Tienda"
        subtitle="Enviá una oferta segmentada con link directo a la categoría"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: 13, color: promoPreview !== null && promoPreview > 0 ? 'var(--success)' : 'var(--fg-3)' }}>
              {promoPreview === null
                ? 'Seleccioná filtros para ver el alcance'
                : promoPreview === 0
                  ? 'Sin contactos con esos filtros'
                  : <><Icon name="Users" size={13} className="ic" /><b>{promoPreview}</b> contactos</>
              }
            </div>
            <div className="hstack">
              <button className="btn" onClick={() => { setShowPromoModal(false); setPromoForm(EMPTY_PROMO); setPromoPreview(null) }} disabled={savingPromo}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSavePromo} disabled={savingPromo || !promoForm.titulo.trim()}>
                {savingPromo ? 'Guardando…' : 'Guardar promoción'}
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Título de la promoción *</label>
            <input className="input" value={promoForm.titulo} onChange={e => setPromoForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Semana Santa — 30% OFF Electrodomésticos" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Categoría</label>
              <select className="select" value={promoForm.categoria} onChange={e => setPromoForm(f => ({ ...f, categoria: e.target.value }))}>
                {TIENDA_CATEGORIAS.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Descuento % (opcional)</label>
              <input className="input" type="number" min={0} max={99} value={promoForm.descuento} onChange={e => setPromoForm(f => ({ ...f, descuento: e.target.value }))} placeholder="Ej: 30" />
            </div>
          </div>

          <div>
            <label className="label">Mensaje adicional (opcional)</label>
            <textarea className="input" rows={2} value={promoForm.mensaje} onChange={e => setPromoForm(f => ({ ...f, mensaje: e.target.value }))} placeholder="Ej: Solo por esta semana. Cuotas sin interés." style={{ resize: 'vertical' }} />
          </div>

          {/* Vista previa del mensaje */}
          <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vista previa del mensaje WhatsApp</div>
            <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--fg-1)', lineHeight: 1.6 }}>
              {buildPromoMessage(promoForm)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Segmentar por estado <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(vacío = todos)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {CLIENT_STATUSES.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" className="chk"
                      checked={promoForm.target_statuses.includes(s.id)}
                      onChange={() => setPromoForm(f => ({ ...f, target_statuses: toggleArr(f.target_statuses, s.id) }))}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Segmentar por plan activo <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(vacío = todos)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {PLAN_TIERS.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" className="chk"
                      checked={promoForm.target_plan_tiers.includes(p.id)}
                      onChange={() => setPromoForm(f => ({ ...f, target_plan_tiers: toggleArr(f.target_plan_tiers, p.id) }))}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Programar envío (opcional)</label>
            <input className="input" type="datetime-local" value={promoForm.scheduled_at} onChange={e => setPromoForm(f => ({ ...f, scheduled_at: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Create campaign modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Nueva campaña"
        subtitle="Segmentá destinatarios y elegí el mensaje"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: 13, color: previewCount !== null && previewCount > 0 ? 'var(--success)' : 'var(--fg-3)' }}>
              {previewCount === null
                ? 'Seleccioná filtros para ver el alcance'
                : previewCount === 0
                  ? 'Sin contactos con esos filtros'
                  : <><Icon name="Users" size={13} className="ic" /><b>{previewCount}</b> contactos encontrados</>
              }
            </div>
            <div className="hstack">
              <button className="btn" onClick={closeModal} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Guardando…' : 'Guardar campaña'}
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name + channel + schedule */}
          <div>
            <label className="label">Nombre de la campaña *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Renovaciones junio 2026" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Canal</label>
              <select className="select" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as any }))}>
                <option value="whatsapp">WhatsApp</option>
                <option value="messenger">Messenger</option>
              </select>
            </div>
            <div>
              <label className="label">Programar envío (opcional)</label>
              <input className="input" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
          </div>

          {/* Segmentation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Segmentar por estado <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(vacío = todos)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {CLIENT_STATUSES.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" className="chk"
                      checked={form.target_statuses.includes(s.id)}
                      onChange={() => setForm(f => ({ ...f, target_statuses: toggleArr(f.target_statuses, s.id) }))}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Segmentar por plan activo <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(vacío = todos)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {PLAN_TIERS.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" className="chk"
                      checked={form.target_plan_tiers.includes(p.id)}
                      onChange={() => setForm(f => ({ ...f, target_plan_tiers: toggleArr(f.target_plan_tiers, p.id) }))}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="label">Plantilla de mensaje</label>
            <div className="hstack" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {TEMPLATES.map(t => (
                <button key={t.name}
                  className={`btn btn-sm ${form.template_text === t.text ? 'btn-primary' : ''}`}
                  onClick={() => setForm(f => ({ ...f, template_text: t.text }))}
                >{t.name}</button>
              ))}
            </div>
            <textarea
              className="input"
              rows={3}
              value={form.template_text}
              onChange={e => setForm(f => ({ ...f, template_text: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
              Variables disponibles: <code>{'{nombre}'}</code>, <code>{'{plan}'}</code>
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
