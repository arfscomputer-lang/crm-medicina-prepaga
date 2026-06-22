'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Badge, Empty } from '@/components/ui/Components'
import { useAuth } from '@/lib/auth-context'
import { supabase, exportToCsv } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type ReportType = 'cartera' | 'comisiones' | 'renovaciones' | 'canales'

type CarteraRow  = { agent: string; plans: number; prima: number; comision: number; clientes: number }
type ComisionRow = { period: string; agent: string; amount: number; pct: number; plans: number }
type RenovRow    = { client: string; phone: string; plan: string; agent: string; end_date: string; prima: number; days: number }
type CanalRow    = { canal: string; actividades: number; pct: number }

const PLAN_NAMES: Record<string, string> = {
  sana: 'Sana', confort: 'Confort', excellent: 'Excellent', adultos_mayores: 'Adultos Mayores',
}

function fmtGs(n: number) {
  if (n >= 1_000_000) return `Gs. ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Gs. ${Math.round(n / 1_000)}K`
  return `Gs. ${Math.round(n)}`
}

export default function ReportesPage() {
  const { permissions } = useAuth()
  const router = useRouter()
  const [report, setReport] = useState<ReportType>('cartera')
  const [loading, setLoading] = useState(false)

  const [cartera, setCartera]       = useState<CarteraRow[]>([])
  const [comisiones, setComisiones] = useState<ComisionRow[]>([])
  const [renovaciones, setRenovaciones] = useState<RenovRow[]>([])
  const [canales, setCanales]       = useState<CanalRow[]>([])
  const [renewDays, setRenewDays]   = useState(30)

  useEffect(() => {
    if (permissions && !permissions.can_view_reports) router.replace('/')
  }, [permissions, router])

  useEffect(() => { runReport(report) }, [report, renewDays])

  async function runReport(type: ReportType) {
    setLoading(true)
    try {
      if (type === 'cartera')      await loadCartera()
      if (type === 'comisiones')   await loadComisiones()
      if (type === 'renovaciones') await loadRenovaciones()
      if (type === 'canales')      await loadCanales()
    } finally {
      setLoading(false)
    }
  }

  async function loadCartera() {
    const { data } = await supabase
      .from('client_plans')
      .select('agent_id, monthly_premium, commission_pct, client_id, users(full_name)')
      .eq('status', 'activo')
    if (!data) return
    const map: Record<string, CarteraRow> = {}
    data.forEach((p: any) => {
      const key = p.agent_id
      if (!map[key]) map[key] = { agent: p.users?.full_name ?? 'Agente', plans: 0, prima: 0, comision: 0, clientes: 0 }
      map[key].plans++
      map[key].prima += p.monthly_premium || 0
      map[key].comision += ((p.monthly_premium || 0) * (p.commission_pct || 0)) / 100
    })
    // Count unique clients per agent
    const clientMap: Record<string, Set<string>> = {}
    data.forEach((p: any) => {
      if (!clientMap[p.agent_id]) clientMap[p.agent_id] = new Set()
      clientMap[p.agent_id].add(p.client_id)
    })
    Object.keys(map).forEach(k => { map[k].clientes = clientMap[k]?.size ?? 0 })
    setCartera(Object.values(map).sort((a, b) => b.prima - a.prima))
  }

  async function loadComisiones() {
    const { data } = await supabase
      .from('commissions')
      .select('period_month, period_year, commission_amount, commission_pct, agent_id, users(full_name)')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(200)
    if (!data) return
    const map: Record<string, ComisionRow> = {}
    data.forEach((c: any) => {
      const key = `${c.period_year}-${String(c.period_month).padStart(2, '0')}-${c.agent_id}`
      if (!map[key]) {
        const month = new Date(c.period_year, c.period_month - 1).toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
        map[key] = { period: month, agent: c.users?.full_name ?? 'Agente', amount: 0, pct: c.commission_pct, plans: 0 }
      }
      map[key].amount += c.commission_amount || 0
      map[key].plans++
    })
    setComisiones(Object.values(map).slice(0, 60))
  }

  async function loadRenovaciones() {
    const now = new Date()
    const future = new Date(now.getTime() + renewDays * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('client_plans')
      .select('end_date, plan_tier, monthly_premium, agent_id, client_id, clients(full_name, phone), users(full_name)')
      .eq('status', 'activo')
      .not('end_date', 'is', null)
      .gte('end_date', now.toISOString().slice(0, 10))
      .lte('end_date', future)
      .order('end_date')
    if (!data) return
    const rows: RenovRow[] = data.map((p: any) => {
      const days = Math.floor((new Date(p.end_date).getTime() - now.getTime()) / 86400000)
      return {
        client: p.clients?.full_name ?? '—',
        phone:  p.clients?.phone ?? '—',
        plan:   PLAN_NAMES[p.plan_tier] ?? p.plan_tier,
        agent:  p.users?.full_name ?? '—',
        end_date: p.end_date,
        prima: p.monthly_premium || 0,
        days,
      }
    })
    setRenovaciones(rows)
  }

  async function loadCanales() {
    const { data } = await supabase.from('activities').select('channel')
    if (!data) return
    const counts: Record<string, number> = {}
    data.forEach((a: any) => { counts[a.channel] = (counts[a.channel] || 0) + 1 })
    const total = data.length || 1
    const LABELS: Record<string, string> = {
      whatsapp: 'WhatsApp', messenger: 'Messenger', llamada: 'Llamada', email: 'Email', reunion: 'Reunión', otro: 'Otro',
    }
    setCanales(
      Object.entries(counts)
        .map(([canal, n]) => ({ canal: LABELS[canal] ?? canal, actividades: n, pct: Math.round((n / total) * 100) }))
        .sort((a, b) => b.actividades - a.actividades)
    )
  }

  function handleExport() {
    if (report === 'cartera') {
      exportToCsv('reporte_cartera.csv', cartera.map(r => ({
        'Agente': r.agent, 'Planes activos': r.plans, 'Clientes': r.clientes,
        'Prima mensual (Gs)': r.prima, 'Comisión mensual (Gs)': Math.round(r.comision),
      })))
    } else if (report === 'comisiones') {
      exportToCsv('reporte_comisiones.csv', comisiones.map(r => ({
        'Período': r.period, 'Agente': r.agent, 'Planes': r.plans,
        '% Comisión': r.pct, 'Comisión (Gs)': Math.round(r.amount),
      })))
    } else if (report === 'renovaciones') {
      exportToCsv('reporte_renovaciones.csv', renovaciones.map(r => ({
        'Cliente': r.client, 'Teléfono': r.phone, 'Plan': r.plan,
        'Agente': r.agent, 'Vencimiento': r.end_date, 'Días restantes': r.days, 'Prima (Gs)': r.prima,
      })))
    } else if (report === 'canales') {
      exportToCsv('reporte_canales.csv', canales.map(r => ({
        'Canal': r.canal, 'Actividades': r.actividades, '% del total': r.pct,
      })))
    }
  }

  if (permissions && !permissions.can_view_reports) return null

  const TABS: { id: ReportType; label: string; icon: string }[] = [
    { id: 'cartera',      label: 'Cartera activa',    icon: 'ShieldCheck' },
    { id: 'comisiones',   label: 'Comisiones',         icon: 'DollarSign'  },
    { id: 'renovaciones', label: 'Renovaciones',       icon: 'RefreshCw'   },
    { id: 'canales',      label: 'Conversión canales', icon: 'BarChart2'   },
  ]

  return (
    <AppShell>
      <Topbar
        title="Reportes"
        right={
          permissions?.can_export_data ? (
            <button className="btn" onClick={handleExport}><Icon name="Download" size={13} className="ic" />Exportar CSV</button>
          ) : undefined
        }
      />

      <div className="scroll-area">
        <div className="page">

          <div style={{ marginBottom: 20 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Reportes</div>
            <div className="fg-3" style={{ fontSize: 13 }}>Análisis predefinidos para gestión del equipo</div>
          </div>

          {/* Tab selector */}
          <div className="hstack" style={{ gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`btn ${report === t.id ? 'btn-primary' : ''}`}
                onClick={() => setReport(t.id)}
              >
                <Icon name={t.icon} size={13} className="ic" />{t.label}
              </button>
            ))}
          </div>

          {/* ── Cartera activa ── */}
          {report === 'cartera' && (
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="ttl">Cartera activa por agente</div>
                  <div className="sub">{cartera.length} agentes · {cartera.reduce((a, r) => a + r.plans, 0)} planes</div>
                </div>
              </div>
              {loading ? <TableSkeleton /> : cartera.length === 0 ? (
                <Empty icon="ShieldCheck" title="Sin datos" sub="No hay planes activos." />
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Agente</th>
                      <th className="num">Clientes</th>
                      <th className="num">Planes</th>
                      <th className="num">Prima/mes</th>
                      <th className="num">Comisión/mes</th>
                      <th style={{ width: 120 }}>Proporción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartera.map((r, i) => {
                      const maxPrima = cartera[0]?.prima || 1
                      const pct = Math.round((r.prima / maxPrima) * 100)
                      return (
                        <tr key={r.agent}>
                          <td className="mono" style={{ color: i === 0 ? 'var(--warning)' : 'var(--fg-3)', fontWeight: i === 0 ? 600 : 400 }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>{r.agent}</td>
                          <td className="num">{r.clientes}</td>
                          <td className="num">{r.plans}</td>
                          <td className="num">{fmtGs(r.prima)}</td>
                          <td className="num" style={{ color: 'var(--success)' }}>{fmtGs(r.comision)}</td>
                          <td>
                            <div className="progress" style={{ height: 5 }}>
                              <i style={{ width: `${pct}%`, background: i === 0 ? 'var(--warning)' : 'var(--accent)' }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: 'var(--bg-3)', fontWeight: 600 }}>
                      <td colSpan={3} style={{ paddingLeft: 12, color: 'var(--fg)' }}>TOTAL</td>
                      <td className="num">{cartera.reduce((a, r) => a + r.plans, 0)}</td>
                      <td className="num">{fmtGs(cartera.reduce((a, r) => a + r.prima, 0))}</td>
                      <td className="num" style={{ color: 'var(--success)' }}>{fmtGs(cartera.reduce((a, r) => a + r.comision, 0))}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Comisiones ── */}
          {report === 'comisiones' && (
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="ttl">Comisiones por período y agente</div>
                  <div className="sub">Últimos 6 meses</div>
                </div>
              </div>
              {loading ? <TableSkeleton /> : comisiones.length === 0 ? (
                <Empty icon="DollarSign" title="Sin comisiones registradas" sub="Las comisiones se generan al marcar pagos como pagados." />
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Agente</th>
                      <th className="num">Planes</th>
                      <th className="num">% Comisión</th>
                      <th className="num">Total comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comisiones.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{r.period}</td>
                        <td>{r.agent}</td>
                        <td className="num">{r.plans}</td>
                        <td className="num" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{r.pct}%</td>
                        <td className="num" style={{ color: 'var(--success)', fontWeight: 600 }}>{fmtGs(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Renovaciones ── */}
          {report === 'renovaciones' && (
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="ttl">Renovaciones próximas</div>
                  <div className="sub">{renovaciones.length} planes vencen en los próximos {renewDays} días</div>
                </div>
                <div className="hstack">
                  {[15, 30, 60, 90].map(d => (
                    <button
                      key={d}
                      className={`btn btn-sm ${renewDays === d ? 'btn-primary' : ''}`}
                      onClick={() => setRenewDays(d)}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              {loading ? <TableSkeleton /> : renovaciones.length === 0 ? (
                <Empty icon="RefreshCw" title="Sin renovaciones próximas" sub={`No hay planes que venzan en los próximos ${renewDays} días.`} />
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Plan</th>
                      <th>Agente</th>
                      <th className="num">Vencimiento</th>
                      <th className="num">Días</th>
                      <th className="num">Prima/mes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renovaciones.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{r.client}</td>
                        <td className="muted">{r.phone}</td>
                        <td className="muted">{r.plan}</td>
                        <td className="muted" style={{ fontSize: 12 }}>{r.agent}</td>
                        <td className="num muted">{r.end_date}</td>
                        <td className="num">
                          <Badge variant={r.days <= 7 ? 'error' : r.days <= 15 ? 'warning' : 'accent'}>
                            {r.days}d
                          </Badge>
                        </td>
                        <td className="num">{fmtGs(r.prima)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Canales ── */}
          {report === 'canales' && (
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="ttl">Conversión por canal</div>
                  <div className="sub">Distribución de actividades registradas</div>
                </div>
              </div>
              {loading ? <TableSkeleton /> : canales.length === 0 ? (
                <Empty icon="BarChart2" title="Sin actividades registradas" sub="Las actividades se registran en la sección Actividades." />
              ) : (
                <>
                  <div style={{ padding: '16px 16px 8px' }}>
                    {canales.map(r => (
                      <div key={r.canal} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.canal}</span>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                            {r.actividades} actividades · {r.pct}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                          <i style={{ width: `${r.pct}%`, background: 'var(--accent)', borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Canal</th>
                        <th className="num">Actividades</th>
                        <th className="num">% del total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {canales.map(r => (
                        <tr key={r.canal}>
                          <td style={{ fontWeight: 500 }}>{r.canal}</td>
                          <td className="num">{r.actividades}</td>
                          <td className="num" style={{ color: 'var(--accent)' }}>{r.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}

function TableSkeleton() {
  return (
    <div style={{ padding: '24px 16px' }}>
      {Array(5).fill(0).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="skel" style={{ width: '20%', height: 11 }} />
          <div className="skel" style={{ width: '30%', height: 11 }} />
          <div className="skel" style={{ width: '15%', height: 11, marginLeft: 'auto' }} />
          <div className="skel" style={{ width: '15%', height: 11 }} />
        </div>
      ))}
    </div>
  )
}
