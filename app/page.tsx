'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { KPI, Avatar } from '@/components/ui/Components'
import { supabase, formatCurrency } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type Stats = {
  totalClients: number
  planesActivos: number
  primaMensual: number
  comisionMensual: number
  polizasEsteMes: number
  polizasCrecimiento: number
  primaPromedio: number
  primaCrecimiento: number
  tasaCierre: number
  tasaCierreDelta: number
  leadsActivos: number
  leadsCrecimiento: number
  porRenovar: number
  porRenovarNombres: string[]
  porRenovarPrimas: number
}

type PipelineStage = { id: string; label: string; count: number; monto: number }

type RecentActivity = {
  id: string
  client_name?: string
  channel: string
  summary: string
  created_at: string
  agent_name?: string
}

const PLAN_TONES: Record<string, string> = {
  sana: 'sana', confort: 'confort', excellent: 'excellent', adultos_mayores: 'adultos',
}
const PLAN_NAMES: Record<string, string> = {
  sana: 'Sana', confort: 'Confort', excellent: 'Excellent', adultos_mayores: 'Adultos Mayores',
}
const PLAN_COMMISSIONS: Record<string, string> = {
  sana: '15', confort: '18', excellent: '20', adultos_mayores: '12',
}
const CHANNEL_ICONS: Record<string, { ic: string; label: string; color: string }> = {
  whatsapp:  { ic: 'MessageCircle', label: 'WhatsApp', color: 'var(--success)' },
  messenger: { ic: 'MessageSquare', label: 'Messenger', color: 'var(--info)' },
  llamada:   { ic: 'Phone',         label: 'Llamada',   color: 'var(--warning)' },
  email:     { ic: 'Mail',          label: 'Email',     color: 'var(--accent)' },
  reunion:   { ic: 'Users',         label: 'Reunión',   color: 'var(--fg-2)' },
  otro:      { ic: 'FileText',      label: 'Otro',      color: 'var(--fg-3)' },
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'prospecto',  label: 'Prospecto',  count: 0, monto: 0 },
  { id: 'contactado', label: 'Contactado', count: 0, monto: 0 },
  { id: 'cotizado',   label: 'Cotizado',   count: 0, monto: 0 },
  { id: 'negociando', label: 'Negociando', count: 0, monto: 0 },
  { id: 'cerrado',    label: 'Cerrado',    count: 0, monto: 0 },
]

export default function Dashboard() {
  const { user, permissions } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [planDist, setPlanDist] = useState<{ tier: string; count: number; pct: number }[]>([])
  const [pipeline, setPipeline] = useState<PipelineStage[]>(PIPELINE_STAGES)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<{ id: string; full_name: string }[]>([])
  const [selectedAgent, setSelectedAgent] = useState('todos')
  const [ranking, setRanking] = useState<{ agent_id: string; name: string; plans: number; prima: number; comision: number }[]>([])

  const greet = user?.full_name?.split(' ')[0] ?? 'Usuario'
  const today = new Date().toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  useEffect(() => {
    loadData(selectedAgent === 'todos' ? undefined : selectedAgent)
  }, [selectedAgent])

  useEffect(() => {
    if (permissions?.can_view_all_clients) {
      loadAgents()
      loadRanking()
    }
  }, [permissions?.can_view_all_clients])

  async function loadAgents() {
    const { data } = await supabase.from('users').select('id, full_name').eq('is_active', true).order('full_name')
    if (data) setAgents(data)
  }

  async function loadRanking() {
    const { data } = await supabase
      .from('client_plans')
      .select('agent_id, monthly_premium, commission_pct, users(full_name)')
      .eq('status', 'activo')
    if (!data) return
    const map: Record<string, { name: string; plans: number; prima: number; comision: number }> = {}
    data.forEach((p: any) => {
      if (!map[p.agent_id]) map[p.agent_id] = { name: p.users?.full_name ?? 'Agente', plans: 0, prima: 0, comision: 0 }
      map[p.agent_id].plans++
      map[p.agent_id].prima += p.monthly_premium || 0
      map[p.agent_id].comision += ((p.monthly_premium || 0) * (p.commission_pct || 0)) / 100
    })
    setRanking(Object.entries(map).map(([id, v]) => ({ agent_id: id, ...v })).sort((a, b) => b.prima - a.prima))
  }

  async function loadData(agentId?: string) {
    setLoading(true)
    try {
      const now = new Date()
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const lastLastMonth  = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

      let clientsQ    = supabase.from('clients').select('id, full_name, status, created_at')
      let plansQ      = supabase.from('client_plans').select('id, plan_tier, status, monthly_premium, commission_pct, end_date, created_at').eq('status', 'activo')
      let actsQ       = supabase.from('activities').select('id, client_id, channel, message, created_at, agent_id').order('created_at', { ascending: false }).limit(6)
      let clientsLastQ = supabase.from('clients').select('id').gte('created_at', firstLastMonth).lte('created_at', lastLastMonth)
      if (agentId) {
        clientsQ     = clientsQ.eq('agent_id', agentId)
        plansQ       = plansQ.eq('agent_id', agentId)
        actsQ        = actsQ.eq('agent_id', agentId)
        clientsLastQ = clientsLastQ.eq('agent_id', agentId)
      }

      const [clientsRes, plansRes, activitiesRes, clientsLastRes] = await Promise.all([
        clientsQ, plansQ, actsQ, clientsLastQ,
      ])

      const clients = clientsRes.data ?? []
      const plans = plansRes.data ?? []
      const acts = activitiesRes.data ?? []

      // Pipeline counts
      const statusCounts: Record<string, number> = {}
      clients.forEach((c: any) => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1 })
      const updatedPipeline = PIPELINE_STAGES.map(s => ({
        ...s,
        count: s.id === 'cerrado' ? plans.length : (statusCounts[s.id] || 0),
        monto: s.id === 'cerrado' ? plans.reduce((a: number, p: any) => a + (p.monthly_premium || 0), 0) : 0,
      }))
      setPipeline(updatedPipeline)

      // Plan distribution
      const dist: Record<string, number> = {}
      plans.forEach((p: any) => { dist[p.plan_tier] = (dist[p.plan_tier] || 0) + 1 })
      const total = plans.length || 1
      setPlanDist(
        Object.entries(dist).map(([tier, count]) => ({
          tier, count, pct: Math.round((count / total) * 100),
        }))
      )

      // KPI calcs
      const primaMensual = plans.reduce((a: number, p: any) => a + (p.monthly_premium || 0), 0)
      const comisionMensual = plans.reduce((a: number, p: any) => a + ((p.monthly_premium || 0) * (p.commission_pct || 0) / 100), 0)
      const primaPromedio = plans.length > 0 ? primaMensual / plans.length : 0
      const polizasEsteMes = clients.filter((c: any) => c.created_at >= firstThisMonth).length
      const polizasLastMonth = clientsLastRes.data?.length ?? 0
      const leadsActivos = clients.filter((c: any) => c.status === 'prospecto' || c.status === 'cotizado').length
      const leadsLastMonth = (clientsLastRes.data?.length ?? 0)
      const polRenovar = plans.filter((p: any) => {
        if (!p.end_date) return false
        const d = Math.floor((new Date(p.end_date).getTime() - now.getTime()) / 86400000)
        return d >= 0 && d <= 14
      })

      // Get client names for renewal banner
      const renewalClientIds = polRenovar.map((p: any) => p.client_id).filter(Boolean)
      let renewalNames: string[] = []
      if (renewalClientIds.length > 0) {
        const { data } = await supabase.from('clients').select('full_name').in('id', renewalClientIds).limit(3)
        renewalNames = data?.map((c: any) => c.full_name) ?? []
      }

      setStats({
        totalClients: clients.length,
        planesActivos: plans.length,
        primaMensual,
        comisionMensual,
        polizasEsteMes,
        polizasCrecimiento: polizasLastMonth > 0 ? Math.round(((polizasEsteMes - polizasLastMonth) / polizasLastMonth) * 100) : 0,
        primaPromedio,
        primaCrecimiento: 12,
        tasaCierre: clients.length > 0 ? Math.round((plans.length / clients.length) * 100) : 0,
        tasaCierreDelta: -3,
        leadsActivos,
        leadsCrecimiento: leadsLastMonth > 0 ? Math.round(((leadsActivos - leadsLastMonth) / leadsLastMonth) * 100) : 14,
        porRenovar: polRenovar.length,
        porRenovarNombres: renewalNames,
        porRenovarPrimas: polRenovar.reduce((a: number, p: any) => a + (p.monthly_premium || 0), 0),
      })

      // Map activities with client names
      const clientIds = [...new Set(acts.map((a: any) => a.client_id).filter(Boolean))]
      let clientMap: Record<string, string> = {}
      if (clientIds.length > 0) {
        const { data } = await supabase.from('clients').select('id, full_name').in('id', clientIds)
        data?.forEach((c: any) => { clientMap[c.id] = c.full_name })
      }
      setActivities(acts.map((a: any) => ({
        id: a.id,
        client_name: clientMap[a.client_id],
        channel: a.channel,
        summary: a.message,
        created_at: a.created_at,
      })))
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  function fmtGs(n: number) {
    if (n >= 1_000_000) return `Gs. ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `Gs. ${Math.round(n / 1_000)}K`
    return `Gs. ${n}`
  }

  const pipelineTotal = pipeline.reduce((a, s) => a + s.count, 0)

  if (loading) {
    return (
      <AppShell>
        <Topbar title="Dashboard" />
        <div className="scroll-area">
          <div className="page">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="kpi" style={{ gap: 10 }}>
                  <div className="skel" style={{ width: '60%', height: 11 }} />
                  <div className="skel" style={{ width: '45%', height: 28 }} />
                  <div className="skel" style={{ width: '70%', height: 11 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Topbar
        title="Dashboard"
        right={
          <>
            <div className="input-with-icon" style={{ width: 260 }}>
              <Icon name="Search" size={13} className="ic" />
              <input className="input" placeholder="Buscar clientes, planes..." />
            </div>
            <button className="btn"><Icon name="Calendar" size={13} className="ic" />
              {new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}
            </button>
            <button className="btn btn-icon" data-tip="Notificaciones"><Icon name="Bell" size={14} /></button>
          </>
        }
      />

      <div className="scroll-area">
        <div className="page">

          {/* Greeting */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Hola, {greet}</div>
              <div className="fg-3" style={{ fontSize: 13 }}>{todayCapitalized}</div>
            </div>
            <div className="hstack">
              {permissions?.can_view_all_clients && agents.length > 0 && (
                <select
                  className="select"
                  style={{ width: 200 }}
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                >
                  <option value="todos">Todo el equipo</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              )}
              <button className="btn btn-primary" onClick={() => router.push('/clientes')}>
                <Icon name="Plus" size={13} className="ic" />Nuevo cliente
              </button>
            </div>
          </div>

          {/* Top KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            <KPI label="Pólizas este mes"  icon="Shield"      value={String(stats?.polizasEsteMes ?? 0)}       delta={stats?.polizasCrecimiento}   spark={[3,4,4,6,7,5,8,9,8,11,stats?.polizasEsteMes ?? 0]} />
            <KPI label="Prima promedio"    icon="DollarSign"  value={fmtGs(stats?.primaPromedio ?? 0)}          delta={stats?.primaCrecimiento}     spark={[420,440,500,510,560,580,600,stats?.primaPromedio ?? 0]} />
            <KPI label="Tasa de cierre"    icon="TrendingUp"  value={String(stats?.tasaCierre ?? 0)} unit="%"   delta={stats?.tasaCierreDelta}      spark={[32,30,29,31,27,28,stats?.tasaCierre ?? 0]} />
            <KPI label="Leads activos"     icon="Users"       value={String(stats?.leadsActivos ?? 0)}          delta={stats?.leadsCrecimiento}     spark={[22,28,30,35,40,42,stats?.leadsActivos ?? 0]} />
          </div>

          {/* Bottom KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            <KPI label="Clientes totales"  icon="Users"       value={String(stats?.totalClients ?? 0)}          delta={4}  spark={[160,164,170,175,178,182,stats?.totalClients ?? 0]} />
            <KPI label="Planes activos"    icon="ShieldCheck" value={String(stats?.planesActivos ?? 0)}          delta={5}  spark={[150,154,158,162,164,166,stats?.planesActivos ?? 0]} />
            <KPI label="Prima mensual"     icon="DollarSign"  value={fmtGs(stats?.primaMensual ?? 0)}           delta={6}  spark={[70,72,76,78,82,85,stats?.primaMensual ?? 0]} />
            <KPI label="Comisión mensual"  icon="CreditCard"  value={fmtGs(stats?.comisionMensual ?? 0)}        delta={11} spark={[9,10,10,11,11,12,stats?.comisionMensual ?? 0]} />
          </div>

          {/* Renewal banner */}
          {(stats?.porRenovar ?? 0) > 0 && (
            <div className="banner banner-warning" style={{ marginBottom: 20 }}>
              <Icon name="AlertTriangle" size={16} />
              <div style={{ flex: 1 }}>
                <span className="lbl">
                  <b>{stats!.porRenovar} plan{stats!.porRenovar !== 1 ? 'es' : ''} vence{stats!.porRenovar === 1 ? '' : 'n'} en los próximos 14 días</b>
                </span>
                {stats!.porRenovarNombres.length > 0 && (
                  <span className="sub" style={{ marginLeft: 8 }}>
                    {stats!.porRenovarNombres.join(', ')} — {fmtGs(stats!.porRenovarPrimas)} en primas
                  </span>
                )}
              </div>
              <button className="btn btn-sm" onClick={() => router.push('/planes')}>
                Ver detalle <Icon name="ChevronRight" size={12} className="ic" />
              </button>
            </div>
          )}

          {/* Pipeline */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-hd">
              <div>
                <div className="ttl">Pipeline de ventas</div>
                <div className="sub">{pipelineTotal} oportunidades activas · {fmtGs(pipeline.find(s => s.id === 'cerrado')?.monto ?? 0)} en cartera</div>
              </div>
            </div>
            <div className="card-body">
              <div className="pipeline">
                {pipeline.map((s, i) => {
                  const pct = pipelineTotal > 0 ? Math.round((s.count / pipelineTotal) * 100) : 0
                  return (
                    <div key={s.id} className={`pipe-stage s-${i + 1}`}>
                      <div className="lbl">{s.label}</div>
                      <div className="val">{s.count}</div>
                      <div className="pct">{pct}%{s.monto ? ` · ${fmtGs(s.monto)}` : ''}</div>
                      <div className="bar"><i style={{ width: `${pct * 3.5}%`, maxWidth: '100%' }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Two-col: plan dist + recent activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>

            {/* Plan distribution */}
            <div className="card">
              <div className="card-hd">
                <div className="ttl">Distribución de planes activos</div>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push('/planes')}>
                  Ver todos <Icon name="ArrowRight" size={12} className="ic" />
                </button>
              </div>
              <div className="card-body">
                {planDist.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                    Sin planes activos
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                    {planDist.map(p => {
                      const tone = PLAN_TONES[p.tier] || 'confort'
                      return (
                        <div key={p.tier} style={{
                          padding: 14,
                          border: '1px solid var(--border)',
                          background: `linear-gradient(180deg, var(--plan-${tone}-soft) 0%, transparent 100%)`,
                          borderRadius: 'var(--r-md)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `var(--plan-${tone})` }} />
                          <div className="hstack" style={{ marginBottom: 6 }}>
                            <span className={`plan-dot plan-${tone}`} />
                            <span style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 500 }}>{PLAN_NAMES[p.tier] ?? p.tier}</span>
                          </div>
                          <div className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>{p.count}</div>
                          <div className="hstack" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                            <span className="fg-3" style={{ fontSize: 11 }}>{p.pct}% del total</span>
                            <span className="mono" style={{ fontSize: 11, color: `var(--plan-${tone})` }}>{PLAN_COMMISSIONS[p.tier] ?? '—'}% com.</span>
                          </div>
                          <div className="progress" style={{ marginTop: 10, height: 4 }}>
                            <i style={{ width: `${p.pct * 2.5}%`, background: `var(--plan-${tone})` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent activity */}
            <div className="card">
              <div className="card-hd">
                <div className="ttl">Actividad reciente</div>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push('/actividades')}>
                  Ver todo <Icon name="ArrowRight" size={12} className="ic" />
                </button>
              </div>
              <div style={{ padding: '4px 0' }}>
                {activities.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                    Sin actividad registrada
                  </div>
                ) : (
                  activities.map((a, i) => {
                    const canal = CHANNEL_ICONS[a.channel] || CHANNEL_ICONS.otro
                    const date = new Date(a.created_at).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })
                    return (
                      <div key={a.id} style={{
                        padding: '10px 16px',
                        borderBottom: i === activities.length - 1 ? 'none' : '1px solid var(--border-soft)',
                        display: 'flex', gap: 10,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: 'var(--bg-3)', display: 'grid', placeItems: 'center',
                          color: canal.color, flexShrink: 0,
                          border: '1px solid var(--border-soft)',
                        }}>
                          <Icon name={canal.ic} size={13} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.client_name ?? 'Cliente'}</div>
                            <span className="fg-3 mono" style={{ fontSize: 11 }}>{date}</span>
                          </div>
                          <div className="fg-2" style={{ fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.summary}
                          </div>
                          <div className="hstack" style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-3)' }}>
                            <span>{canal.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>

          {/* Team ranking — visible for supervisor/admin */}
          {permissions?.can_view_all_clients && ranking.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-hd">
                <div>
                  <div className="ttl">Ranking del equipo</div>
                  <div className="sub">{ranking.length} agentes · planes activos este mes</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push('/reportes')}>
                  Ver reportes <Icon name="ArrowRight" size={12} className="ic" />
                </button>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Agente</th>
                    <th className="num">Planes</th>
                    <th className="num">Prima/mes</th>
                    <th className="num">Comisión/mes</th>
                    <th style={{ width: 160 }}>Proporción</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => {
                    const maxPrima = ranking[0]?.prima || 1
                    const pct = Math.round((r.prima / maxPrima) * 100)
                    return (
                      <tr key={r.agent_id} className={selectedAgent === r.agent_id ? 'selected' : ''}>
                        <td className="mono" style={{ color: i === 0 ? 'var(--warning)' : 'var(--fg-3)', fontWeight: i === 0 ? 600 : 400 }}>
                          {i + 1}
                        </td>
                        <td style={{ fontWeight: 500 }}>{r.name}</td>
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
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
