'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { supabase, PlanCatalog, PlanCoverage } from '@/lib/supabase'
import { Grid3x3, Table2, FileText, Plus, X, Upload, Trash2, ExternalLink } from 'lucide-react'

export default function CatalogoPage() {
  return (
    <ProtectedRoute>
      <CatalogoContent />
    </ProtectedRoute>
  )
}

function CatalogoContent() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<PlanCatalog[]>([])
  const [selectedPlan, setSelectedPlan] = useState<PlanCatalog | null>(null)
  const [coverages, setCoverages] = useState<PlanCoverage[]>([])
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    tier: 'basic' as 'basic' | 'standard' | 'premium',
    tier_level: 1,
    tagline: '',
    description: '',
    base_monthly_premium: 0,
    base_annual_premium: 0,
    agent_commission_pct: 15,
    renewal_commission_pct: 10,
    icon: '💊',
    color: '#3B82F6',
    provider_name: '',
    provider_network: ''
  })

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      const { data, error } = await supabase
        .from('plan_catalog')
        .select('*')
        .order('sort_order')

      if (error) throw error
      if (data) setPlans(data)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCoverages(planId: string) {
    try {
      const { data, error } = await supabase
        .from('plan_coverages')
        .select('*')
        .eq('plan_catalog_id', planId)
        .order('sort_order')

      if (error) throw error
      if (data) setCoverages(data)
    } catch (error) {
      console.error('Error loading coverages:', error)
    }
  }

  function handlePlanClick(plan: PlanCatalog) {
    setSelectedPlan(plan)
    loadCoverages(plan.id)
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data: orgData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!orgData?.org_id) throw new Error('No organization found')

      const { data, error } = await supabase
        .from('plan_catalog')
        .insert({
          org_id: orgData.org_id,
          ...formData,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setPlans([...plans, data])
      setShowCreateModal(false)
      resetForm()
      alert('Plan creado exitosamente')
    } catch (error) {
      console.error('Error creating plan:', error)
      alert('Error al crear el plan')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, planId: string) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('El archivo no puede superar los 4MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = 'pdf'
      const fileName = `${planId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('plan-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('plan-documents')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('plan_catalog')
        .update({ pdf_document_url: publicUrl })
        .eq('id', planId)

      if (updateError) throw updateError

      if (selectedPlan) {
        setSelectedPlan({ ...selectedPlan, pdf_document_url: publicUrl })
      }

      alert('PDF cargado exitosamente')
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al cargar el archivo')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeletePDF(planId: string, pdfUrl: string) {
    if (!confirm('¿Estás seguro de eliminar este PDF?')) return

    try {
      const fileName = pdfUrl.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('plan-documents')
          .remove([fileName])
      }

      const { error } = await supabase
        .from('plan_catalog')
        .update({ pdf_document_url: null })
        .eq('id', planId)

      if (error) throw error

      if (selectedPlan) {
        setSelectedPlan({ ...selectedPlan, pdf_document_url: null })
      }

      alert('PDF eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting PDF:', error)
      alert('Error al eliminar el PDF')
    }
  }

  function resetForm() {
    setFormData({
      code: '',
      name: '',
      tier: 'basic',
      tier_level: 1,
      tagline: '',
      description: '',
      base_monthly_premium: 0,
      base_annual_premium: 0,
      agent_commission_pct: 15,
      renewal_commission_pct: 10,
      icon: '💊',
      color: '#3B82F6',
      provider_name: '',
      provider_network: ''
    })
  }

  const categoryLabels: {[key: string]: string} = {
    consultas: 'Consultas',
    urgencias: 'Urgencias',
    analisis: 'Análisis',
    imagenes: 'Imágenes',
    internacion: 'Internación',
    cirugia: 'Cirugías',
    maternidad: 'Maternidad',
    fisioterapia: 'Fisioterapia',
    odontologia: 'Odontología',
    ambulancia: 'Ambulancia',
    salud_mental: 'Salud Mental',
    procedimientos: 'Procedimientos'
  }

  const categoryIcons: {[key: string]: string} = {
    consultas: '👨‍⚕️',
    urgencias: '🚨',
    analisis: '🧪',
    imagenes: '🏥',
    internacion: '🛏️',
    cirugia: '⚕️',
    maternidad: '👶',
    fisioterapia: '💆',
    odontologia: '🦷',
    ambulancia: '🚑',
    salud_mental: '🧠',
    procedimientos: '💉'
  }

  if (selectedPlan) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-accent hover:underline mb-6"
            >
              ← Volver al catálogo
            </button>

            <div
              className="bg-card border border-border rounded-xl p-8 mb-8"
              style={{ borderBottomColor: selectedPlan.color }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-6xl">{selectedPlan.icon}</span>
                <div>
                  <h1 className="text-4xl font-bold" style={{ color: selectedPlan.color }}>
                    {selectedPlan.name}
                  </h1>
                  <p className="text-xl text-gray-400 mt-2">{selectedPlan.tagline}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <span className="px-3 py-1 bg-border rounded-full text-sm">Tier {selectedPlan.tier_level}</span>
                <span className="px-3 py-1 bg-border rounded-full text-sm">{selectedPlan.provider_name || 'Sin proveedor'}</span>
                {selectedPlan.provider_network && (
                  <span className="px-3 py-1 bg-border rounded-full text-sm">{selectedPlan.provider_network}</span>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-accent" size={24} />
                  <h2 className="text-xl font-bold">Documento PDF de Referencia</h2>
                </div>
                {selectedPlan.pdf_document_url && (
                  <button
                    onClick={() => handleDeletePDF(selectedPlan.id, selectedPlan.pdf_document_url!)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <Trash2 size={16} />
                    Eliminar PDF
                  </button>
                )}
              </div>

              {selectedPlan.pdf_document_url ? (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={32} className="text-red-500" />
                      <div>
                        <p className="font-medium">Documento de referencia</p>
                        <p className="text-sm text-gray-400">PDF cargado</p>
                      </div>
                    </div>
                    <a
                      href={selectedPlan.pdf_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                    >
                      <ExternalLink size={16} />
                      Ver PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-400 mb-2">No hay PDF cargado para este plan</p>
                  <p className="text-sm text-gray-500 mb-4">Arrastrá un archivo PDF aquí o hacé clic para seleccionar (máx. 4MB)</p>
                  <label className="inline-block px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg cursor-pointer transition-colors">
                    {uploading ? 'Cargando...' : 'Seleccionar archivo'}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, selectedPlan.id)}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Coberturas del Plan</h2>
              {coverages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay coberturas configuradas para este plan</p>
              ) : (
                <div className="space-y-4">
                  {coverages.map((coverage) => (
                    <div key={coverage.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{categoryIcons[coverage.category]}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{categoryLabels[coverage.category]}</h3>
                          <p className="font-mono font-bold mb-1" style={{ color: selectedPlan.color }}>
                            {coverage.quantity}
                          </p>
                          <p className="text-sm text-gray-400 mb-2">
                            Carencia: <span className="font-medium">{coverage.waiting_period}</span>
                          </p>
                          {coverage.details && (
                            <p className="text-sm text-gray-300">{coverage.details}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Catálogo de Planes</h1>
              <p className="text-sm text-gray-400 mt-1">Gestiona planes de EBSA y otras aseguradoras</p>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-accent text-white' : 'text-gray-400'}`}
                >
                  <Grid3x3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-accent text-white' : 'text-gray-400'}`}
                >
                  <Table2 size={20} />
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Crear Plan
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanClick(plan)}
                  className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-accent transition-all"
                  style={{ borderBottomColor: plan.color }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl">{plan.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: plan.color }}>
                        {plan.name}
                      </h2>
                      <p className="text-gray-400">{plan.tagline}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <span className="px-2 py-1 bg-border rounded text-xs">Tier {plan.tier_level}</span>
                    <span className="px-2 py-1 bg-border rounded text-xs">Comisión {plan.agent_commission_pct}%</span>
                    {plan.provider_name && (
                      <span className="px-2 py-1 bg-border rounded text-xs">{plan.provider_name}</span>
                    )}
                  </div>
                  <p className="text-accent text-sm">Ver cobertura completa →</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-border">
                  <tr>
                    <th className="text-left p-4">Plan</th>
                    <th className="text-left p-4">Tier</th>
                    <th className="text-left p-4">Comisión</th>
                    <th className="text-left p-4">Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      onClick={() => handlePlanClick(plan)}
                      className="border-t border-border hover:bg-border cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{plan.icon}</span>
                          <div>
                            <p className="font-bold">{plan.name}</p>
                            <p className="text-sm text-gray-400">{plan.tagline}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">Nivel {plan.tier_level}</td>
                      <td className="p-4 font-mono">{plan.agent_commission_pct}%</td>
                      <td className="p-4 text-sm text-gray-400">{plan.provider_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Crear Nuevo Plan</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Código del Plan *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="PLAN001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre del Plan *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Plan Básico"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Proveedor *</label>
                  <input
                    type="text"
                    required
                    value={formData.provider_name}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="EBSA, IPS, Privado, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Red de Prestadores</label>
                  <input
                    type="text"
                    value={formData.provider_network}
                    onChange={(e) => setFormData({ ...formData, provider_network: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Centro Médico Bautista, La Costa, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción corta</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Cobertura esencial para toda la familia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción completa</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent h-24"
                    placeholder="Descripción detallada del plan..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="basic">Básico</option>
                      <option value="standard">Estándar</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Nivel</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.tier_level}
                      onChange={(e) => setFormData({ ...formData, tier_level: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Ícono</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-center text-2xl"
                      placeholder="💊"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prima Mensual (Gs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.base_monthly_premium}
                      onChange={(e) => setFormData({ ...formData, base_monthly_premium: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Prima Anual (Gs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.base_annual_premium}
                      onChange={(e) => setFormData({ ...formData, base_annual_premium: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Comisión Agente (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.agent_commission_pct}
                      onChange={(e) => setFormData({ ...formData, agent_commission_pct: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Comisión Renovación (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.renewal_commission_pct}
                      onChange={(e) => setFormData({ ...formData, renewal_commission_pct: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10 bg-background border border-border rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 bg-border hover:bg-border/80 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors"
                  >
                    Crear Plan
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
