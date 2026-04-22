'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase, ClientPlan, formatCurrency, formatDate } from '@/lib/supabase'
import { Plus, Trash2, X } from 'lucide-react'

type Client = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

type PlanCatalog = {
  id: string
  plan_tier: string
  plan_name: string
  monthly_premium: number
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<ClientPlan[]>([])
  const [filter, setFilter] = useState<'all' | 'activo' | 'cotizado' | 'vencido'>('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [catalogPlans, setCatalogPlans] = useState<PlanCatalog[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    plan_catalog_id: '',
    num_beneficiaries: 1,
    monthly_premium: 0,
    commission_pct: 25,
    status: 'cotizado' as 'cotizado' | 'activo',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    loadPlans()
    loadClients()
    loadCatalogPlans()
  }, [])

  async function loadPlans() {
    try {
      const { data, error } = await supabase
        .from('client_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setPlans(data)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone')
        .order('first_name')

      if (error) throw error
      if (data) setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  async function loadCatalogPlans() {
    try {
      const { data, error } = await supabase
        .from('plan_catalog')
        .select('id, plan_tier, plan_name, monthly_premium')
        .order('plan_tier')

      if (error) throw error
      if (data) setCatalogPlans(data)
    } catch (error) {
      console.error('Error loading catalog plans:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const selectedPlan = catalogPlans.find(p => p.id === formData.plan_catalog_id)
      if (!selectedPlan) return

      const { error } = await supabase
        .from('client_plans')
        .insert({
          client_id: formData.client_id,
          plan_catalog_id: formData.plan_catalog_id,
          plan_tier: selectedPlan.plan_tier,
          num_beneficiaries: formData.num_beneficiaries,
          monthly_premium: formData.monthly_premium,
          commission_pct: formData.commission_pct,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })

      if (error) throw error

      setShowModal(false)
      setFormData({
        client_id: '',
        plan_catalog_id: '',
        num_beneficiaries: 1,
        monthly_premium: 0,
        commission_pct: 25,
        status: 'cotizado',
        start_date: '',
        end_date: ''
      })
      loadPlans()
    } catch (error) {
      console.error('Error creating plan:', error)
    }
  }

  function handlePlanSelect(planId: string) {
    const selectedPlan = catalogPlans.find(p => p.id === planId)
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        plan_catalog_id: planId,
        monthly_premium: selectedPlan.monthly_premium
      }))
    }
  }

  const filteredPlans = filter === 'all'
    ? plans
    : plans.filter(p => p.status === filter)

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

  const statusColors: {[key: string]: string} = {
    cotizado: 'bg-accent text-white',
    activo: 'bg-success text-white',
    vencido: 'bg-error text-white',
    suspendido: 'bg-warning text-black',
    cancelado: 'bg-gray-600 text-white'
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Planes Activos</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Asignar Plan
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {(['all', 'activo', 'cotizado', 'vencido'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-accent text-white'
                    : 'bg-card border border-border text-gray-300 hover:bg-border'
                }`}
              >
                {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">No hay planes {filter !== 'all' ? filter + 's' : 'registrados'}</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-border">
                  <tr>
                    <th className="text-left p-4">Cliente</th>
                    <th className="text-left p-4">Plan</th>
                    <th className="text-left p-4">Beneficiarios</th>
                    <th className="text-right p-4">Prima/Mes</th>
                    <th className="text-center p-4">Comisión</th>
                    <th className="text-left p-4">Vigencia</th>
                    <th className="text-center p-4">Estado</th>
                    <th className="text-center p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => {
                    const comisionMensual = (plan.monthly_premium * plan.commission_pct) / 100
                    return (
                      <tr
                        key={plan.id}
                        className="border-t border-border hover:bg-border transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-medium">Cliente</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{planIcons[plan.plan_tier]}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${planColors[plan.plan_tier]}`}>
                              {plan.plan_tier.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono">{plan.num_beneficiaries}</td>
                        <td className="p-4 text-right font-mono font-bold">{formatCurrency(plan.monthly_premium)}</td>
                        <td className="p-4 text-center">
                          <div>
                            <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-mono">
                              {plan.commission_pct}%
                            </span>
                            <p className="text-xs text-success mt-1 font-mono">
                              {formatCurrency(comisionMensual)}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {plan.start_date && plan.end_date ? (
                            <div>
                              <p>{formatDate(plan.start_date)}</p>
                              <p className="text-gray-400">{formatDate(plan.end_date)}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin definir</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[plan.status]}`}>
                            {plan.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button className="text-error hover:text-error/80 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-2xl font-bold">Asignar Plan</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Cliente</label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Plan</label>
                  <select
                    required
                    value={formData.plan_catalog_id}
                    onChange={(e) => handlePlanSelect(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Seleccionar plan</option>
                    {catalogPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - {formatCurrency(plan.monthly_premium)}/mes
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Beneficiarios</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.num_beneficiaries}
                      onChange={(e) => setFormData({ ...formData, num_beneficiaries: parseInt(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Prima Mensual</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.monthly_premium}
                      onChange={(e) => setFormData({ ...formData, monthly_premium: parseFloat(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Comisión (%)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.commission_pct}
                      onChange={(e) => setFormData({ ...formData, commission_pct: parseFloat(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'cotizado' | 'activo' })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="cotizado">Cotizado</option>
                      <option value="activo">Activo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-border transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
                  >
                    Asignar Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
