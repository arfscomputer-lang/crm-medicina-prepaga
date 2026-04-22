'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, formatCurrency, PlanCatalog, Client, ClientPlan, Activity } from '@/lib/supabase'
import { Users, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

type DashboardStats = {
  totalClients: number
  prospectos: number
  planesActivos: number
  porRenovar: number
  primaMensual: number
  comisionMensual: number
  polizasEsteMes: number
  polizasCrecimiento: number
  primaPromedio: number
  primaCrecimiento: number
  tasaCierre: number
  tasaCierreTendencia: string
  leadsActivos: number
  leadsCrecimiento: number
}

type PipelineStage = {
  stage: string
  count: number
  value: number
  color: string
  icon: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    prospectos: 0,
    planesActivos: 0,
    porRenovar: 0,
    primaMensual: 0,
    comisionMensual: 0,
    polizasEsteMes: 0,
    polizasCrecimiento: 0,
    primaPromedio: 0,
    primaCrecimiento: 0,
    tasaCierre: 0,
    tasaCierreTendencia: 'sin cambios',
    leadsActivos: 0,
    leadsCrecimiento: 0,
  })
  const [planDistribution, setPlanDistribution] = useState<{[key: string]: number}>({})
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [pipeline, setPipeline] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const now = new Date()
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

      const [clientsRes, plansRes, activitiesRes, plansThisMonthRes, plansLastMonthRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('client_plans').select('*'),
        supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('client_plans').select('*').gte('created_at', firstDayThisMonth),
        supabase.from('client_plans').select('*').gte('created_at', firstDayLastMonth).lte('created_at', lastDayLastMonth)
      ])

      if (clientsRes.data) {
        const prospectos = clientsRes.data.filter((c: Client) => c.status === 'prospecto').length
        const leadsActivos = clientsRes.data.filter((c: Client) =>
          c.status === 'prospecto' || c.status === 'cotizado'
        ).length

        const clientsThisMonth = clientsRes.data.filter((c: Client) =>
          new Date(c.created_at) >= new Date(firstDayThisMonth)
        ).length
        const clientsLastMonth = clientsRes.data.filter((c: Client) =>
          new Date(c.created_at) >= new Date(firstDayLastMonth) &&
          new Date(c.created_at) <= new Date(lastDayLastMonth)
        ).length
        const leadsCrecimiento = clientsLastMonth > 0
          ? Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100)
          : 0

        setStats(prev => ({
          ...prev,
          totalClients: clientsRes.data.length,
          prospectos,
          leadsActivos,
          leadsCrecimiento
        }))
      }

      if (plansRes.data) {
        const activos = plansRes.data.filter((p: ClientPlan) => p.status === 'activo')
        const porRenovar = activos.filter((p: ClientPlan) => {
          if (!p.end_date) return false
          const daysUntil = Math.floor((new Date(p.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil <= 30 && daysUntil >= 0
        }).length

        const primaMensual = activos.reduce((sum: number, p: ClientPlan) => sum + (p.monthly_premium || 0), 0)
        const comisionMensual = activos.reduce((sum: number, p: ClientPlan) => {
          return sum + ((p.monthly_premium || 0) * (p.commission_pct || 0) / 100)
        }, 0)

        const distribution: {[key: string]: number} = {}
        activos.forEach((p: ClientPlan) => {
          distribution[p.plan_tier] = (distribution[p.plan_tier] || 0) + 1
        })

        const polizasEsteMes = plansThisMonthRes.data?.filter((p: ClientPlan) => p.status === 'activo').length || 0
        const polizasMesAnterior = plansLastMonthRes.data?.filter((p: ClientPlan) => p.status === 'activo').length || 0
        const polizasCrecimiento = polizasMesAnterior > 0
          ? Math.round(((polizasEsteMes - polizasMesAnterior) / polizasMesAnterior) * 100)
          : 0

        const primaPromedio = activos.length > 0 ? primaMensual / activos.length : 0
        const primaPromedioMesAnterior = plansLastMonthRes.data && plansLastMonthRes.data.length > 0
          ? plansLastMonthRes.data
              .filter((p: ClientPlan) => p.status === 'activo')
              .reduce((sum: number, p: ClientPlan) => sum + (p.monthly_premium || 0), 0) /
            plansLastMonthRes.data.filter((p: ClientPlan) => p.status === 'activo').length
          : 0
        const primaCrecimiento = primaPromedioMesAnterior > 0
          ? Math.round(((primaPromedio - primaPromedioMesAnterior) / primaPromedioMesAnterior) * 100)
          : 0

        const totalProspectos = clientsRes.data?.filter((c: Client) => c.status === 'prospecto').length || 1
        const planesVendidos = activos.length
        const tasaCierre = Math.round((planesVendidos / Math.max(totalProspectos, 1)) * 100)
        const tasaCierreTendencia = primaCrecimiento > 0 ? 'al alza' : primaCrecimiento < 0 ? 'a la baja' : 'sin cambios'

        setStats(prev => ({
          ...prev,
          planesActivos: activos.length,
          porRenovar,
          primaMensual,
          comisionMensual,
          polizasEsteMes,
          polizasCrecimiento,
          primaPromedio,
          primaCrecimiento,
          tasaCierre,
          tasaCierreTendencia
        }))
        setPlanDistribution(distribution)
      }

      if (activitiesRes.data) {
        setRecentActivities(activitiesRes.data)
      }

      if (plansRes.data && clientsRes.data) {
        const pipelineData: PipelineStage[] = [
          {
            stage: 'Prospecto',
            count: clientsRes.data.filter((c: Client) => c.status === 'prospecto').length,
            value: 0,
            color: 'bg-gray-500',
            icon: '👤'
          },
          {
            stage: 'Contactado',
            count: activitiesRes.data?.filter((a: Activity) =>
              a.channel === 'whatsapp' || a.channel === 'llamada' || a.channel === 'email'
            ).length || 0,
            value: 0,
            color: 'bg-blue-500',
            icon: '📞'
          },
          {
            stage: 'Cotizado',
            count: plansRes.data.filter((p: ClientPlan) => p.status === 'cotizado').length,
            value: plansRes.data
              .filter((p: ClientPlan) => p.status === 'cotizado')
              .reduce((sum: number, p: ClientPlan) => sum + (p.monthly_premium || 0), 0),
            color: 'bg-yellow-500',
            icon: '📋'
          },
          {
            stage: 'Negociación',
            count: activitiesRes.data?.filter((a: Activity) =>
              a.message.toLowerCase().includes('negociac') ||
              a.message.toLowerCase().includes('propuesta')
            ).length || 0,
            value: 0,
            color: 'bg-orange-500',
            icon: '🤝'
          },
          {
            stage: 'Cerrado',
            count: plansRes.data.filter((p: ClientPlan) => p.status === 'activo').length,
            value: plansRes.data
              .filter((p: ClientPlan) => p.status === 'activo')
              .reduce((sum: number, p: ClientPlan) => sum + (p.monthly_premium || 0), 0),
            color: 'bg-success',
            icon: '✅'
          }
        ]
        setPipeline(pipelineData)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const planColors: {[key: string]: {bg: string, text: string, icon: string}} = {
    sana: { bg: 'bg-sana/10', text: 'text-sana', icon: '🌿' },
    confort: { bg: 'bg-confort/10', text: 'text-confort', icon: '⭐' },
    excellent: { bg: 'bg-excellent/10', text: 'text-excellent', icon: '💎' },
    adultos_mayores: { bg: 'bg-adultos/10', text: 'text-adultos', icon: '🤝' }
  }

  const channelIcons: {[key: string]: string} = {
    whatsapp: '💬',
    messenger: '📱',
    llamada: '📞',
    call: '📞',
    reunion: '🤝',
    meeting: '🤝',
    email: '✉️',
    otro: '📋'
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-60 p-8 pt-16 lg:pt-8">
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Cargando dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Pólizas este mes</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono mb-2">{stats.polizasEsteMes}</p>
              <p className={`text-xs sm:text-sm ${stats.polizasCrecimiento >= 0 ? 'text-success' : 'text-red-400'}`}>
                {stats.polizasCrecimiento >= 0 ? '↑' : '↓'} {Math.abs(stats.polizasCrecimiento)}% vs mes anterior
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Prima promedio</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono mb-2">{formatCurrency(stats.primaPromedio)}</p>
              <p className={`text-xs sm:text-sm ${stats.primaCrecimiento >= 0 ? 'text-success' : 'text-red-400'}`}>
                {stats.primaCrecimiento >= 0 ? '↑' : '↓'} {Math.abs(stats.primaCrecimiento)}% vs mes anterior
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Tasa de cierre</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono mb-2">{stats.tasaCierre}%</p>
              <p className="text-xs sm:text-sm text-gray-400">
                Tendencia {stats.tasaCierreTendencia}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-400">Leads activos</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono mb-2">{stats.leadsActivos}</p>
              <p className={`text-xs sm:text-sm ${stats.leadsCrecimiento >= 0 ? 'text-success' : 'text-red-400'}`}>
                {stats.leadsCrecimiento >= 0 ? '↑' : '↓'} {Math.abs(stats.leadsCrecimiento)}% vs última semana
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-accent" size={20} />
                <span className="text-xs sm:text-sm text-gray-400">{stats.prospectos} prospectos</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono">{stats.totalClients}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Clientes Totales</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="text-accent" size={20} />
                <span className="text-xs sm:text-sm text-gray-400">+{stats.porRenovar} por renovar</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono">{stats.planesActivos}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Planes Activos</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="text-accent" size={20} />
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono">{formatCurrency(stats.primaMensual)}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Prima Mensual Total</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-success" size={20} />
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-success">{formatCurrency(stats.comisionMensual)}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Comisión Mensual</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Pipeline de Ventas</h2>
            <div className="space-y-4">
              {pipeline.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stage.icon}</span>
                      <div>
                        <p className="font-medium">{stage.stage}</p>
                        <p className="text-sm text-gray-400">
                          {stage.count} {stage.count === 1 ? 'oportunidad' : 'oportunidades'}
                        </p>
                      </div>
                    </div>
                    {stage.value > 0 && (
                      <p className="text-lg font-bold font-mono">{formatCurrency(stage.value)}</p>
                    )}
                  </div>
                  <div className="relative h-3 bg-border rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${stage.color} transition-all duration-500`}
                      style={{
                        width: `${Math.max(5, Math.min(100, (stage.count / Math.max(...pipeline.map(s => s.count))) * 100))}%`
                      }}
                    />
                  </div>
                  {index < pipeline.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="text-gray-600 text-xl">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex justify-between items-center">
                <p className="text-gray-400">Tasa de conversión total</p>
                <p className="text-2xl font-bold text-success">
                  {pipeline[0]?.count > 0
                    ? Math.round((pipeline[4]?.count / pipeline[0]?.count) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Distribución de Planes</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(planDistribution).map(([tier, count]) => {
                const config = planColors[tier] || planColors.sana
                return (
                  <div key={tier} className={`${config.bg} rounded-lg p-4 cursor-pointer hover:scale-105 transition-transform`}>
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <p className={`text-2xl font-bold font-mono ${config.text}`}>{count}</p>
                    <p className="text-sm text-gray-300 mt-1 capitalize">{tier.replace('_', ' ')}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {stats.porRenovar > 0 && (
            <div className="bg-warning/10 border border-warning rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-warning" size={20} />
                <h2 className="text-lg sm:text-xl font-bold">Alertas de Renovación</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-300">
                Tenés <span className="font-bold text-warning">{stats.porRenovar} planes</span> que vencen en los próximos 30 días
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Actividad Reciente</h2>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay actividades registradas</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-border transition-colors">
                    <div className="text-2xl">{channelIcons[activity.channel] || '📋'}</div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-gray-400">{new Date(activity.created_at).toLocaleDateString('es-PY')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}
