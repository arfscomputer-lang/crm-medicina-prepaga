'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { SidePanel } from '@/components/ui/Components'
import { supabase, PlanCatalog, PlanCoverage } from '@/lib/supabase'

const PLAN_TONES: Record<string, string> = {
  sana: 'sana', confort: 'confort', excellent: 'excellent', adultos_mayores: 'adultos',
}

const PLAN_META: Record<string, { tagline: string; icon: string }> = {
  sana:           { tagline: 'Cobertura esencial para ti y tu familia',       icon: 'ShieldCheck' },
  confort:        { tagline: 'Mayor amplitud de red y beneficios adicionales', icon: 'Star' },
  excellent:      { tagline: 'El plan premium con cobertura máxima',           icon: 'Zap' },
  adultos_mayores:{ tagline: 'Diseñado especialmente para adultos mayores',    icon: 'Users' },
}

export default function CatalogoPage() {
  const [plans, setPlans] = useState<PlanCatalog[]>([])
  const [selected, setSelected] = useState<PlanCatalog | null>(null)
  const [coverages, setCoverages] = useState<PlanCoverage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('plan_catalog').select('*').order('sort_order')
    if (data) setPlans(data)
    setLoading(false)
  }

  async function selectPlan(plan: PlanCatalog) {
    setSelected(plan)
    const { data } = await supabase.from('plan_coverages').select('*').eq('plan_catalog_id', plan.id).order('sort_order')
    if (data) setCoverages(data)
  }

  function fmtGs(n: number) {
    if (n >= 1_000_000) return `Gs. ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `Gs. ${Math.round(n / 1_000)}K`
    return `Gs. ${n}`
  }

  return (
    <AppShell>
      <Topbar title="Catálogo EBSA" />

      <div className="scroll-area">
        <div className="page">
          <div style={{ marginBottom: 24 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Catálogo de planes</div>
            <div className="fg-3" style={{ fontSize: 13 }}>4 planes EBSA · Seleccioná un plan para ver coberturas completas</div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="card" style={{ minHeight: 200 }}>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="skel" style={{ width: '40%', height: 14 }} />
                    <div className="skel" style={{ width: '60%', height: 11 }} />
                    <div className="skel" style={{ width: '30%', height: 24 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {plans.map(plan => {
                const tone = PLAN_TONES[plan.tier] || 'confort'
                const meta = PLAN_META[plan.tier] || { tagline: plan.tagline, icon: 'Shield' }
                return (
                  <div
                    key={plan.id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      background: `linear-gradient(160deg, var(--plan-${tone}-soft) 0%, var(--bg-2) 50%)`,
                      transition: 'border-color 120ms',
                    }}
                    onClick={() => selectPlan(plan)}
                  >
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <div style={{ height: 3, background: `var(--plan-${tone})` }} />
                      <div style={{ padding: '20px 20px 16px' }}>
                        <div className="hstack" style={{ marginBottom: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9,
                            background: `var(--plan-${tone}-soft)`,
                            border: `1px solid var(--plan-${tone})`,
                            display: 'grid', placeItems: 'center',
                            color: `var(--plan-${tone})`,
                          }}>
                            <Icon name={meta.icon} size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{plan.name}</div>
                            <div style={{ fontSize: 11, color: `var(--plan-${tone})`, fontWeight: 500 }}>EBSA · Tier {plan.tier_level}</div>
                          </div>
                        </div>
                        <div className="fg-2" style={{ fontSize: 13, marginBottom: 16 }}>{meta.tagline}</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                          <div style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                            <div className="fg-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Prima/mes</div>
                            <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: `var(--plan-${tone})` }}>{fmtGs((plan as any).base_monthly_premium || (plan as any).monthly_premium || 0)}</div>
                          </div>
                          <div style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                            <div className="fg-3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Comisión</div>
                            <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--success)' }}>{plan.agent_commission_pct}%</div>
                          </div>
                        </div>

                        <div className="hstack" style={{ justifyContent: 'space-between' }}>
                          <span className="fg-3" style={{ fontSize: 12 }}>Ver coberturas completas</span>
                          <Icon name="ChevronRight" size={14} style={{ color: 'var(--fg-3)' } as any} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Compare note */}
          {!loading && plans.length > 0 && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="Info" size={14} style={{ color: 'var(--info)', flexShrink: 0 } as any} />
              <span className="fg-2" style={{ fontSize: 13 }}>Hacé clic en cualquier plan para ver la tabla completa de coberturas, descargar la cartilla médica y obtener el material de ventas.</span>
            </div>
          )}
        </div>
      </div>

      {/* Coverage side panel */}
      {selected && (
        <div className="scrim" onClick={() => setSelected(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-hd">
              <div>
                <div className="ttl" style={{ fontSize: 14, fontWeight: 500 }}>{selected.name}</div>
                <div className="sub" style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                  {fmtGs((selected as any).base_monthly_premium || 0)}/mes · {selected.agent_commission_pct}% comisión
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}><Icon name="X" size={14} /></button>
            </div>
            <div className="panel-body" style={{ padding: '16px 20px' }}>
              {coverages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                  Sin coberturas registradas aún.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {coverages.map((c, i) => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px',
                      borderBottom: i < coverages.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--success-soft)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Icon name="Check" size={11} style={{ color: 'var(--success)' } as any} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.category}</div>
                        {c.details && <div className="fg-3" style={{ fontSize: 12, marginTop: 2 }}>{c.details}</div>}
                        {c.quantity && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{c.quantity}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
