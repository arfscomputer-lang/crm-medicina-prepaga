'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Badge, Modal, Segmented, Empty, SortHeader } from '@/components/ui/Components'
import { supabase, ClientPlan, formatCurrency, formatDate } from '@/lib/supabase'

type Client = { id: string; first_name: string; last_name: string; full_name?: string }
type CatalogPlan = { id: string; plan_tier: string; plan_name: string; monthly_premium: number }

const PLAN_TONES: Record<string, string> = {
  sana: 'sana', confort: 'confort', excellent: 'excellent', adultos_mayores: 'adultos',
}
const PLAN_NAMES: Record<string, string> = {
  sana: 'Sana', confort: 'Confort', excellent: 'Excellent', adultos_mayores: 'Adultos Mayores',
}
const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'accent' | 'error' | 'warning' | 'neutral' }> = {
  activo:     { label: 'Activo',     variant: 'success' },
  cotizado:   { label: 'Cotizado',   variant: 'accent'  },
  vencido:    { label: 'Vencido',    variant: 'error'   },
  suspendido: { label: 'Suspendido', variant: 'warning' },
  cancelado:  { label: 'Cancelado',  variant: 'neutral' },
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<ClientPlan[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_id: '', plan_catalog_id: '', num_beneficiaries: 1,
    monthly_premium: 0, commission_pct: 25, status: 'cotizado', start_date: '', end_date: '',
  })

  useEffect(() => {
    Promise.all([loadPlans(), loadClients(), loadCatalog()])
  }, [])

  async function loadPlans() {
    const { data } = await supabase.from('client_plans').select('*').order('created_at', { ascending: false })
    if (data) setPlans(data)
    setLoading(false)
  }

  async function loadClients() {
    const { data } = await supabase.from('clients').select('id, first_name, last_name, full_name').order('first_name')
    if (data) setClients(data)
  }

  async function loadCatalog() {
    const { data } = await supabase.from('plan_catalog').select('id, plan_tier, plan_name, monthly_premium').order('plan_tier')
    if (data) setCatalog(data)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const selected = catalog.find(p => p.id === form.plan_catalog_id)
    if (!selected) return
    setSaving(true)
    try {
      await supabase.from('client_plans').insert({
        client_id: form.client_id, plan_catalog_id: form.plan_catalog_id,
        plan_tier: selected.plan_tier, num_beneficiaries: form.num_beneficiaries,
        monthly_premium: form.monthly_premium, commission_pct: form.commission_pct,
        status: form.status, start_date: form.start_date || null, end_date: form.end_date || null,
      })
      await loadPlans()
      setShowModal(false)
      setForm({ client_id: '', plan_catalog_id: '', num_beneficiaries: 1, monthly_premium: 0, commission_pct: 25, status: 'cotizado', start_date: '', end_date: '' })
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'todos' ? plans : plans.filter(p => p.status === filter)
  const now = new Date()
  const infoRenovar = filtered.filter(p => {
    if (!p.end_date || p.status !== 'activo') return false
    const d = Math.floor((new Date(p.end_date).getTime() - now.getTime()) / 86400000)
    return d >= 0 && d <= 14
  })

  function fmtGs(n: number) {
    if (n >= 1_000_000) return `Gs. ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `Gs. ${Math.round(n / 1_000)}K`
    return `Gs. ${n}`
  }

  const urgency = (p: ClientPlan) => {
    if (!p.end_date || p.status !== 'activo') return null
    const d = Math.floor((new Date(p.end_date).getTime() - now.getTime()) / 86400000)
    if (d < 0) return 'vencido'
    if (d <= 7) return 'urgent'
    if (d <= 14) return 'warning'
    return null
  }

  return (
    <AppShell>
      <Topbar
        title="Planes"
        right={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icon name="Plus" size={13} className="ic" />Asignar plan
          </button>
        }
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Planes contratados</div>
              <div className="fg-3" style={{ fontSize: 13 }}>
                {plans.filter(p => p.status === 'activo').length} activos · {plans.filter(p => p.status === 'cotizado').length} cotizados · {fmtGs(plans.filter(p => p.status === 'activo').reduce((a, p) => a + (p.monthly_premium || 0), 0))} prima mensual
              </div>
            </div>
            <Segmented
              options={[
                { value: 'todos',   label: 'Todos'    },
                { value: 'activo',  label: 'Activos'  },
                { value: 'cotizado',label: 'Cotizados'},
                { value: 'vencido', label: 'Vencidos' },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>

          {infoRenovar.length > 0 && (
            <div className="banner banner-warning" style={{ marginBottom: 16 }}>
              <Icon name="AlertTriangle" size={16} />
              <div style={{ flex: 1 }}>
                <b>{infoRenovar.length} plan{infoRenovar.length !== 1 ? 'es' : ''} vence{infoRenovar.length === 1 ? '' : 'n'} en los próximos 14 días</b>
                <span className="sub" style={{ marginLeft: 8 }}>Gs. {fmtGs(infoRenovar.reduce((a, p) => a + (p.monthly_premium || 0), 0))} en primas</span>
              </div>
            </div>
          )}

          <div className="tbl-wrap">
            {loading ? (
              <div style={{ padding: '40px 16px' }}>
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }}>
                    <div className="skel" style={{ width: '20%', height: 11 }} />
                    <div className="skel" style={{ width: '15%', height: 20, borderRadius: 999 }} />
                    <div className="skel" style={{ width: '10%', height: 11 }} />
                    <div className="skel" style={{ width: '15%', height: 11, marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Empty
                icon="ShieldCheck"
                title={`No hay planes ${filter !== 'todos' ? filter + 's' : 'registrados'}`}
                sub="Asigná un plan a un cliente para que aparezca aquí."
                action={<button className="btn btn-primary" onClick={() => setShowModal(true)}><Icon name="Plus" size={13} className="ic" />Asignar plan</button>}
              />
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Plan</th>
                    <th>Benef.</th>
                    <th className="num">Prima/mes</th>
                    <th className="num">Com. %</th>
                    <th className="num">Com./mes</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(plan => {
                    const tone = PLAN_TONES[plan.plan_tier] || 'confort'
                    const statusInfo = STATUS_MAP[plan.status] || { label: plan.status, variant: 'neutral' as const }
                    const urg = urgency(plan)
                    const comMensual = ((plan.monthly_premium || 0) * (plan.commission_pct || 0)) / 100
                    return (
                      <tr key={plan.id}>
                        <td style={{ fontWeight: 500 }}>Cliente</td>
                        <td>
                          <div className="hstack">
                            <span className={`plan-dot plan-${tone}`} />
                            <span style={{ fontSize: 12, color: `var(--plan-${tone})`, fontWeight: 500 }}>{PLAN_NAMES[plan.plan_tier] ?? plan.plan_tier}</span>
                          </div>
                        </td>
                        <td className="num muted">{plan.num_beneficiaries}</td>
                        <td className="num">{fmtGs(plan.monthly_premium || 0)}</td>
                        <td className="num">
                          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{plan.commission_pct}%</span>
                        </td>
                        <td className="num" style={{ color: 'var(--success)' }}>{fmtGs(comMensual)}</td>
                        <td className="muted" style={{ fontSize: 12 }}>
                          {plan.start_date && plan.end_date
                            ? `${formatDate(plan.start_date)} → ${formatDate(plan.end_date)}`
                            : plan.end_date ? formatDate(plan.end_date) : '—'}
                          {urg === 'urgent' && <span style={{ marginLeft: 6, color: 'var(--error)', fontSize: 11 }}>· Urgente</span>}
                          {urg === 'warning' && <span style={{ marginLeft: 6, color: 'var(--warning)', fontSize: 11 }}>· Por vencer</span>}
                        </td>
                        <td><Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {!loading && filtered.length > 0 && (
              <div className="tbl-foot">
                <span>{filtered.length} planes</span>
                <span>Prima total: {fmtGs(filtered.reduce((a, p) => a + (p.monthly_premium || 0), 0))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Asignar plan"
        subtitle="Asociá un plan de EBSA a un cliente"
        footer={
          <div className="hstack" style={{ marginLeft: 'auto' }}>
            <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={e => handleSave(e as any)} disabled={saving}>
              {saving ? 'Guardando...' : 'Asignar plan'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label">Cliente</label>
              <select className="select" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || `${c.first_name} ${c.last_name}`}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Plan EBSA</label>
              <select className="select" value={form.plan_catalog_id} onChange={e => {
                const p = catalog.find(x => x.id === e.target.value)
                setForm(prev => ({ ...prev, plan_catalog_id: e.target.value, monthly_premium: p?.monthly_premium ?? 0 }))
              }} required>
                <option value="">Seleccionar plan...</option>
                {catalog.map(p => <option key={p.id} value={p.id}>{p.plan_name} — {fmtGs(p.monthly_premium)}/mes</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Nº beneficiarios</label>
                <input className="input" type="number" min={1} value={form.num_beneficiaries} onChange={e => setForm(p => ({ ...p, num_beneficiaries: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Prima mensual (Gs.)</label>
                <input className="input" type="number" value={form.monthly_premium} onChange={e => setForm(p => ({ ...p, monthly_premium: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Comisión %</label>
                <input className="input" type="number" min={0} max={100} value={form.commission_pct} onChange={e => setForm(p => ({ ...p, commission_pct: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Estado</label>
                <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="cotizado">Cotizado</option>
                  <option value="activo">Activo</option>
                </select>
              </div>
              <div>
                <label className="label">Inicio vigencia</label>
                <input className="input" type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Fin vigencia</label>
                <input className="input" type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
