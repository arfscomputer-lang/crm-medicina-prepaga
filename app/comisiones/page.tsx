'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { KPI } from '@/components/ui/Components'
import { useAuth } from '@/lib/auth-context'
import { supabase, ClientPlan, exportToCsv } from '@/lib/supabase'

type ComisionRow = {
  plan_id: string
  client_name: string
  plan_tier: string
  monthly_premium: number
  commission_pct: number
  monthly_commission: number
  annual_commission: number
}

const PLAN_TONES: Record<string, string> = {
  sana: 'sana', confort: 'confort', excellent: 'excellent', adultos_mayores: 'adultos',
}
const PLAN_NAMES: Record<string, string> = {
  sana: 'Sana', confort: 'Confort', excellent: 'Excellent', adultos_mayores: 'Adultos Mayores',
}

export default function ComisionesPage() {
  const { permissions } = useAuth()
  const [rows, setRows] = useState<ComisionRow[]>([])
  const [totales, setTotales] = useState({ mensual: 0, anual: 0, primas: 0, planes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await supabase.from('client_plans').select('*').eq('status', 'activo')
      if (data) {
        const r: ComisionRow[] = data.map((p: ClientPlan) => ({
          plan_id: p.id, client_name: 'Cliente',
          plan_tier: p.plan_tier, monthly_premium: p.monthly_premium,
          commission_pct: p.commission_pct,
          monthly_commission: (p.monthly_premium * p.commission_pct) / 100,
          annual_commission: (p.monthly_premium * p.commission_pct * 12) / 100,
        }))
        setRows(r)
        setTotales(r.reduce((a, x) => ({
          mensual: a.mensual + x.monthly_commission,
          anual: a.anual + x.annual_commission,
          primas: a.primas + x.monthly_premium,
          planes: a.planes + 1,
        }), { mensual: 0, anual: 0, primas: 0, planes: 0 }))
      }
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    exportToCsv(`comisiones_${date}.csv`, rows.map(r => ({
      'Cliente':           r.client_name,
      'Plan':              PLAN_NAMES[r.plan_tier] ?? r.plan_tier,
      'Prima mensual (Gs)': r.monthly_premium,
      '% Comisión':        r.commission_pct,
      'Comisión/mes (Gs)': Math.round(r.monthly_commission),
      'Comisión/año (Gs)': Math.round(r.annual_commission),
    })))
  }

  function fmtGs(n: number) {
    if (n >= 1_000_000) return `Gs. ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `Gs. ${Math.round(n / 1_000)}K`
    return `Gs. ${Math.round(n)}`
  }

  const maxComision = rows.length > 0 ? Math.max(...rows.map(r => r.monthly_commission)) : 1

  return (
    <AppShell>
      <Topbar
        title="Comisiones"
        right={
          permissions?.can_export_data ? (
            <button className="btn" onClick={handleExport}><Icon name="Download" size={13} className="ic" />Exportar CSV</button>
          ) : undefined
        }
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ marginBottom: 24 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Comisiones</div>
            <div className="fg-3" style={{ fontSize: 13 }}>
              Resumen de comisiones para {new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* KPI summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            <KPI label="Comisión mensual"  icon="CreditCard"   value={fmtGs(totales.mensual)}  delta={11} spark={[9,10,10,11,11,12,totales.mensual]} />
            <KPI label="Proyección anual"  icon="TrendingUp"   value={fmtGs(totales.anual)}    delta={11} spark={[108,120,120,132,132,144,totales.anual]} />
            <KPI label="Prima total/mes"   icon="DollarSign"   value={fmtGs(totales.primas)}   delta={6}  spark={[70,72,76,78,82,85,totales.primas]} />
            <KPI label="Planes activos"    icon="ShieldCheck"  value={String(totales.planes)}  delta={5}  spark={[150,154,158,162,164,166,totales.planes]} />
          </div>

          {/* Bar chart + table */}
          <div className="card">
            <div className="card-hd">
              <div className="ttl">Detalle de comisiones por plan</div>
              <div className="sub">{rows.length} planes activos</div>
            </div>

            {loading ? (
              <div style={{ padding: '40px 16px' }}>
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div className="skel" style={{ width: '25%', height: 11 }} />
                    <div className="skel" style={{ width: '15%', height: 20, borderRadius: 999 }} />
                    <div className="skel" style={{ width: '10%', height: 11, marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                Sin planes activos aún.
              </div>
            ) : (
              <>
                {/* Horizontal bar chart */}
                <div style={{ padding: '16px 16px 8px' }}>
                  {rows.map(row => {
                    const tone = PLAN_TONES[row.plan_tier] || 'confort'
                    const pct = (row.monthly_commission / maxComision) * 100
                    return (
                      <div key={row.plan_id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div className="hstack">
                            <span className={`plan-dot plan-${tone}`} />
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{row.client_name}</span>
                            <span style={{ fontSize: 11, color: `var(--plan-${tone})`, fontWeight: 500 }}>{PLAN_NAMES[row.plan_tier] ?? row.plan_tier}</span>
                          </div>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--success)' }}>{fmtGs(row.monthly_commission)}</span>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <i style={{ width: `${pct}%`, background: `var(--plan-${tone})` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Table */}
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Plan</th>
                      <th className="num">Prima</th>
                      <th className="num">%</th>
                      <th className="num">Comisión/mes</th>
                      <th className="num">Comisión/año</th>
                      <th style={{ width: 120 }}>Proporción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => {
                      const tone = PLAN_TONES[row.plan_tier] || 'confort'
                      const pct = totales.mensual > 0 ? (row.monthly_commission / totales.mensual) * 100 : 0
                      return (
                        <tr key={row.plan_id}>
                          <td style={{ fontWeight: 500 }}>{row.client_name}</td>
                          <td>
                            <div className="hstack">
                              <span className={`plan-dot plan-${tone}`} />
                              <span style={{ fontSize: 12, color: `var(--plan-${tone})`, fontWeight: 500 }}>{PLAN_NAMES[row.plan_tier] ?? row.plan_tier}</span>
                            </div>
                          </td>
                          <td className="num">{fmtGs(row.monthly_premium)}</td>
                          <td className="num">
                            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row.commission_pct}%</span>
                          </td>
                          <td className="num" style={{ color: 'var(--success)' }}>{fmtGs(row.monthly_commission)}</td>
                          <td className="num" style={{ color: 'var(--success)' }}>{fmtGs(row.annual_commission)}</td>
                          <td>
                            <div className="progress" style={{ height: 4 }}>
                              <i style={{ width: `${pct}%`, background: `var(--plan-${tone})` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: 'var(--bg-3)' }}>
                      <td colSpan={4} style={{ fontWeight: 600, color: 'var(--fg)', paddingLeft: 12 }}>TOTAL</td>
                      <td className="num" style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>{fmtGs(totales.mensual)}</td>
                      <td className="num" style={{ color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>{fmtGs(totales.anual)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
