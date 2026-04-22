'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase, Activity, formatDate, Client } from '@/lib/supabase'
import { Activity as ActivityIcon, Search, Plus, MessageCircle, X, Calendar, List } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type NewActivityForm = {
  client_id: string
  channel: string
  activity_type: string
  subject: string
  message: string
  requires_followup: boolean
  followup_date: string
}

export default function ActividadesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState({ total: 0, este_mes: 0, semana: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [formData, setFormData] = useState<NewActivityForm>({
    client_id: '',
    channel: 'whatsapp',
    activity_type: 'contacto_inicial',
    subject: '',
    message: '',
    requires_followup: false,
    followup_date: ''
  })

  useEffect(() => {
    loadActivities()
    loadClients()
  }, [])

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          client:clients(full_name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setActivities(data as any)

        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const esteMes = data.filter(a => new Date(a.created_at) >= thisMonth).length
        const semana = data.filter(a => new Date(a.created_at) >= thisWeek).length

        setStats({ total: data.length, este_mes: esteMes, semana })
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('full_name')

      if (error) throw error
      if (data) setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  async function handleSaveActivity() {
    if (!user || !formData.client_id || !formData.message.trim()) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          org_id: user.org_id,
          client_id: formData.client_id,
          agent_id: user.id,
          channel: formData.channel,
          activity_type: formData.activity_type,
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
          requires_followup: formData.requires_followup,
          followup_date: formData.requires_followup && formData.followup_date ? formData.followup_date : null
        })

      if (error) throw error

      await loadActivities()
      setShowForm(false)
      setFormData({
        client_id: '',
        channel: 'whatsapp',
        activity_type: 'contacto_inicial',
        subject: '',
        message: '',
        requires_followup: false,
        followup_date: ''
      })
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Error al guardar la actividad')
    } finally {
      setSaving(false)
    }
  }

  const channelConfig: {[key: string]: {color: string, icon: string, label: string}} = {
    whatsapp: { color: 'bg-[#25D366] text-white', icon: '💬', label: 'WhatsApp' },
    messenger: { color: 'bg-[#0084FF] text-white', icon: '📱', label: 'Messenger' },
    llamada: { color: 'bg-accent text-white', icon: '📞', label: 'Llamada' },
    call: { color: 'bg-accent text-white', icon: '📞', label: 'Llamada' },
    email: { color: 'bg-warning text-black', icon: '✉️', label: 'Email' },
    reunion: { color: 'bg-success text-white', icon: '🤝', label: 'Reunión' },
    meeting: { color: 'bg-success text-white', icon: '🤝', label: 'Reunión' }
  }

  const channelCounts = activities.reduce((acc, a) => {
    acc[a.channel] = (acc[a.channel] || 0) + 1
    return acc
  }, {} as {[key: string]: number})

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChannel = selectedChannel === 'all' || a.channel === selectedChannel
    return matchesSearch && matchesChannel
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredActivities.filter(activity => {
      const activityDate = new Date(activity.created_at).toISOString().split('T')[0]
      return activityDate === dateStr
    })
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  if (!user) return null

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Actividades CRM</h1>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'calendar' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Calendar size={20} />
                </button>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Actividad
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <ActivityIcon className="text-accent" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono">{stats.total}</p>
              <p className="text-sm text-gray-400 mt-1">Total Actividades</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="text-accent" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono">{stats.este_mes}</p>
              <p className="text-sm text-gray-400 mt-1">Este Mes</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <ActivityIcon className="text-accent" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono">{stats.semana}</p>
              <p className="text-sm text-gray-400 mt-1">Última Semana</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="text-accent" size={24} />
              </div>
              <p className="text-3xl font-bold font-mono">
                {Object.keys(channelCounts).length > 0
                  ? Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0][0]
                  : '—'}
              </p>
              <p className="text-sm text-gray-400 mt-1">Canal Más Usado</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Distribución por Canal</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedChannel('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedChannel === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-border text-gray-300 hover:bg-border/80'
                }`}
              >
                Todos ({activities.length})
              </button>
              {Object.entries(channelCounts).map(([channel, count]) => {
                const config = channelConfig[channel] || { color: 'bg-border text-white', icon: '📋', label: channel }
                return (
                  <button
                    key={channel}
                    onClick={() => setSelectedChannel(channel)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      selectedChannel === channel
                        ? config.color
                        : 'bg-border text-gray-300 hover:bg-border/80'
                    }`}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <span className="font-mono">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar actividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {filteredActivities.length} resultado{filteredActivities.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : viewMode === 'list' ? (
            filteredActivities.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <p className="text-gray-400 text-lg">No hay actividades registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity: any) => {
                  const config = channelConfig[activity.channel] || { color: 'bg-border text-white', icon: '📋', label: activity.channel }
                  return (
                    <div
                      key={activity.id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-accent transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold">{activity.client?.full_name || 'Cliente'}</p>
                            <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                              {config.label}
                            </span>
                            {activity.activity_type && (
                              <span className="px-2 py-0.5 rounded text-xs bg-border text-gray-300">
                                {activity.activity_type.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          {activity.subject && (
                            <p className="font-medium text-white mb-1">{activity.subject}</p>
                          )}
                          <p className="text-gray-300 mb-2">{activity.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{formatDate(activity.created_at)}</span>
                            {activity.requires_followup && (
                              <span className="text-warning">
                                📅 Seguimiento: {activity.followup_date ? new Date(activity.followup_date).toLocaleDateString('es-PY') : 'Pendiente'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-border p-4 flex items-center justify-between">
                <button
                  onClick={previousMonth}
                  className="px-4 py-2 bg-background rounded-lg hover:bg-background/80 transition-colors"
                >
                  ← Anterior
                </button>
                <h2 className="text-xl font-bold">
                  {currentMonth.toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={nextMonth}
                  className="px-4 py-2 bg-background rounded-lg hover:bg-background/80 transition-colors"
                >
                  Siguiente →
                </button>
              </div>

              <div className="grid grid-cols-7 bg-border">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="p-3 text-center font-bold text-sm border-r border-background last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {(() => {
                  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
                  const cells = []

                  for (let i = 0; i < startingDayOfWeek; i++) {
                    cells.push(
                      <div key={`empty-${i}`} className="min-h-[120px] bg-background/50 border border-border"></div>
                    )
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day)
                    const dayActivities = getActivitiesForDate(date)
                    const isToday = new Date().toDateString() === date.toDateString()

                    cells.push(
                      <div
                        key={day}
                        className={`min-h-[120px] p-2 border border-border hover:bg-border/30 transition-colors ${
                          isToday ? 'bg-accent/10 border-accent' : ''
                        }`}
                      >
                        <div className={`text-sm font-bold mb-2 ${isToday ? 'text-accent' : ''}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayActivities.slice(0, 3).map((activity: any) => {
                            const config = channelConfig[activity.channel] || { color: 'bg-border text-white', icon: '📋', label: activity.channel }
                            return (
                              <div
                                key={activity.id}
                                className={`text-xs p-1 rounded ${config.color} truncate cursor-pointer hover:opacity-80`}
                                title={`${activity.client?.full_name}: ${activity.message}`}
                              >
                                <span className="mr-1">{config.icon}</span>
                                {activity.client?.full_name}
                              </div>
                            )
                          })}
                          {dayActivities.length > 3 && (
                            <div className="text-xs text-gray-400 pl-1">
                              +{dayActivities.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }

                  return cells
                })()}
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Nueva Actividad</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cliente *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Canal *</label>
                    <select
                      value={formData.channel}
                      onChange={(e) => setFormData({...formData, channel: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="messenger">Messenger</option>
                      <option value="llamada">Llamada</option>
                      <option value="email">Email</option>
                      <option value="reunion">Reunión</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Actividad *</label>
                    <select
                      value={formData.activity_type}
                      onChange={(e) => setFormData({...formData, activity_type: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                    >
                      <option value="contacto_inicial">Contacto Inicial</option>
                      <option value="seguimiento">Seguimiento</option>
                      <option value="cotizacion">Cotización</option>
                      <option value="recordatorio">Recordatorio</option>
                      <option value="renovacion">Renovación</option>
                      <option value="reclamo">Reclamo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Asunto</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Ej: Consulta sobre plan Confort"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mensaje *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Describe la interacción con el cliente..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followup"
                    checked={formData.requires_followup}
                    onChange={(e) => setFormData({...formData, requires_followup: e.target.checked})}
                    className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent"
                  />
                  <label htmlFor="followup" className="text-sm font-medium">
                    Requiere seguimiento
                  </label>
                </div>

                {formData.requires_followup && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha de Seguimiento</label>
                    <input
                      type="date"
                      value={formData.followup_date}
                      onChange={(e) => setFormData({...formData, followup_date: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-border text-white px-6 py-3 rounded-lg font-medium hover:bg-border/80 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveActivity}
                    disabled={saving}
                    className="flex-1 bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
