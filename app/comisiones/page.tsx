'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase, ClientPlan, formatCurrency } from '@/lib/supabase'
import { DollarSign, TrendingUp, FileText, Users } from 'lucide-react'

type ComisionRow = {
  plan_id: string
  client_name: string
  plan_tier: string
  monthly_premium: number
  commission_pct: number
  monthly_commission: number
  annual_commission: number
}

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<ComisionRow[]>([])
  const [totales, setTotales] = useState({
    mensual: 0,
    anual: 0,
    primas: 0,
    planes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComisiones()
  }, [])

  async function loadComisiones() {
    try {
      const { data, error } = await supabase
        .from('client_plans')
        .select('*')
        .eq('status', 'activo')

      if (error) throw error
      if (data) {
        const rows: ComisionRow[] = data.map((plan: ClientPlan) => ({
          plan_id: plan.id,
          client_name: 'Cliente',
          plan_tier: plan.plan_tier,
          monthly_premium: plan.monthly_premium,
          commission_pct: plan.commission_pct,
          monthly_commission: (plan.monthly_premium * plan.commission_pct) / 100,
          annual_commission: (plan.monthly_premium * plan.commission_pct * 12) / 100
        }))

        const totales = rows.reduce((acc, row) => ({
          mensual: acc.mensual + row.monthly_commission,
          anual: acc.anual + row.annual_commission,
          primas: acc.primas + row.monthly_premium,
          planes: acc.planes + 1
        }), { mensual: 0, anual: 0, primas: 0, planes: 0 })

        setComisiones(rows)
        setTotales(totales)
      }
    } catch (error) {
      console.error('Error loading comisiones:', error)
    } finally {
      setLoading(false)
    }
  }

  const planColors: {[key: string]: string} = {
    sana: 'bg-sana text-white',
    confort: 'bg-confort text-black',
    excellent: 'bg-excellent text-white',
    adultos_mayores: 'bg-adultos text-white'
  }

  const planIcons: {[key: string]: string} = {
    sana: '🌿',
    confort: '⭐',
    excellent: '💎',
    adultos_mayores: '🤝'
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Comisiones</h1>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-success" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono text-success">{formatCurrency(totales.mensual)}</p>
              <p className="text-sm text-gray-400 mt-1">Comisión Mensual</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="text-success" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono text-success">{formatCurrency(totales.anual)}</p>
              <p className="text-sm text-gray-400 mt-1">Comisión Anual</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="text-accent" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono">{formatCurrency(totales.primas)}</p>
              <p className="text-sm text-gray-400 mt-1">Primas Anuales</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-accent" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono">{totales.planes}</p>
              <p className="text-sm text-gray-400 mt-1">Planes Activos</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : comisiones.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">No hay comisiones activas</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-border">
                  <tr>
                    <th className="text-left p-4">Cliente</th>
                    <th className="text-left p-4">Plan</th>
                    <th className="text-right p-4">Prima</th>
                    <th className="text-center p-4">%</th>
                    <th className="text-right p-4">Comisión/Mes</th>
                    <th className="text-right p-4">Comisión/Año</th>
                    <th className="text-right p-4">Proporción</th>
                  </tr>
                </thead>
                <tbody>
                  {comisiones.map((row) => {
                    const porcentaje = totales.mensual > 0 ? (row.monthly_commission / totales.mensual) * 100 : 0
                    return (
                      <tr
                        key={row.plan_id}
                        className="border-t border-border hover:bg-border transition-colors"
                      >
                        <td className="p-4 font-medium">{row.client_name}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{planIcons[row.plan_tier]}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${planColors[row.plan_tier]}`}>
                              {row.plan_tier.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono">{formatCurrency(row.monthly_premium)}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-mono">
                            {row.commission_pct}%
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-success">
                          {formatCurrency(row.monthly_commission)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-success">
                          {formatCurrency(row.annual_commission)}
                        </td>
                        <td className="p-4">
                          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-success to-accent rounded-full"
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-accent bg-accent/10">
                    <td className="p-4 font-bold" colSpan={4}>TOTAL</td>
                    <td className="p-4 text-right font-mono font-bold text-success text-lg">
                      {formatCurrency(totales.mensual)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-success text-lg">
                      {formatCurrency(totales.anual)}
                    </td>
                    <td className="p-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
