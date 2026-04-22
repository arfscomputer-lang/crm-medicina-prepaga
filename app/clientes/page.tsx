'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useAuth } from '@/lib/auth-context'
import { supabase, Client, formatDate } from '@/lib/supabase'
import { Search, Plus, Phone, Mail, CreditCard as Edit2, Trash2 } from 'lucide-react'

type NewClientForm = {
  first_name: string
  last_name: string
  cedula: string
  phone: string
  email: string
  facebook_username: string
  status: 'prospecto' | 'cotizado' | 'activo' | 'vencido' | 'cancelado' | 'inactivo'
  preferred_channel: string
}

export default function ClientesPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<NewClientForm>({
    first_name: '',
    last_name: '',
    cedula: '',
    phone: '',
    email: '',
    facebook_username: '',
    status: 'prospecto',
    preferred_channel: 'whatsapp'
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEditClient(client: Client) {
    setEditingClient(client)
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      cedula: client.cedula || '',
      phone: client.phone,
      email: client.email || '',
      facebook_username: client.facebook_username || '',
      status: client.status,
      preferred_channel: client.preferred_channel
    })
    setShowForm(true)
  }

  async function handleSaveClient(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.phone.trim()) {
      alert('El teléfono es obligatorio')
      return
    }

    if (!user) {
      alert('Usuario no autenticado')
      return
    }

    setSaving(true)

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            cedula: formData.cedula.trim() || null,
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            facebook_username: formData.facebook_username.trim() || null,
            status: formData.status,
            preferred_channel: formData.preferred_channel
          })
          .eq('id', editingClient.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({
            org_id: user.org_id,
            agent_id: user.id,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            cedula: formData.cedula.trim() || null,
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            facebook_username: formData.facebook_username.trim() || null,
            status: formData.status,
            preferred_channel: formData.preferred_channel
          })

        if (error) throw error
      }

      await loadClients()
      setShowForm(false)
      setEditingClient(null)
      setFormData({
        first_name: '',
        last_name: '',
        cedula: '',
        phone: '',
        email: '',
        facebook_username: '',
        status: 'prospecto',
        preferred_channel: 'whatsapp'
      })
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Error al guardar el cliente')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingClient(null)
    setFormData({
      first_name: '',
      last_name: '',
      cedula: '',
      phone: '',
      email: '',
      facebook_username: '',
      status: 'prospecto',
      preferred_channel: 'whatsapp'
    })
  }

  async function handleDeleteClient() {
    if (!editingClient) return

    const confirmed = window.confirm(
      `¿Estás seguro que querés eliminar a ${editingClient.full_name}? Esta acción no se puede deshacer.`
    )

    if (!confirmed) return

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', editingClient.id)

      if (error) throw error

      await loadClients()
      setShowForm(false)
      setEditingClient(null)
      setFormData({
        first_name: '',
        last_name: '',
        cedula: '',
        phone: '',
        email: '',
        facebook_username: '',
        status: 'prospecto',
        preferred_channel: 'whatsapp'
      })
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error al eliminar el cliente')
    } finally {
      setDeleting(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.cedula?.includes(searchTerm)
  )

  const statusColors: {[key: string]: string} = {
    prospecto: 'bg-warning text-black',
    cotizado: 'bg-accent text-white',
    activo: 'bg-success text-white',
    vencido: 'bg-error text-white',
    cancelado: 'bg-excellent text-white',
    inactivo: 'bg-gray-600 text-white'
  }

  const statusLabels: {[key: string]: string} = {
    prospecto: 'Prospecto',
    cotizado: 'Cotizado',
    activo: 'Activo',
    vencido: 'Vencido',
    cancelado: 'Cancelado',
    inactivo: 'Inactivo'
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
              <PermissionGuard permission="can_create_clients">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <Plus size={18} />
                  Nuevo Cliente
                </button>
              </PermissionGuard>
            </div>

          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 sm:py-20">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-accent hover:underline"
                >
                  Agregá tu primer cliente
                </button>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-border">
                    <tr>
                      <th className="text-left p-4 text-sm">Cliente</th>
                      <th className="text-left p-4 text-sm">Contacto</th>
                      <th className="text-left p-4 text-sm">Estado</th>
                      <th className="text-left p-4 text-sm">Último Contacto</th>
                      <th className="text-left p-4 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-t border-border hover:bg-border transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-excellent flex items-center justify-center text-white font-bold text-sm">
                              {client.first_name[0]}{client.last_name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{client.full_name}</p>
                              {client.cedula && (
                                <p className="text-xs text-gray-400">CI: {client.cedula}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={14} className="text-gray-400" />
                              <span>{client.phone}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Mail size={14} />
                                <span>{client.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[client.status]}`}>
                            {statusLabels[client.status]}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {client.last_contact_at ? formatDate(client.last_contact_at) : 'Sin contacto'}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-accent"
                            title="Editar cliente"
                          >
                            <Edit2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-border">
                {filteredClients.map((client) => (
                  <div key={client.id} className="p-4 hover:bg-border transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-excellent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {client.first_name[0]}{client.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{client.full_name}</p>
                          {client.cedula && (
                            <p className="text-xs text-gray-400">CI: {client.cedula}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditClient(client)}
                        className="p-2 hover:bg-accent/20 rounded-lg transition-colors text-accent flex-shrink-0"
                        title="Editar cliente"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail size={14} />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[client.status]}`}>
                          {statusLabels[client.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {client.last_contact_at ? formatDate(client.last_contact_at) : 'Sin contacto'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <form onSubmit={handleSaveClient} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Nombre</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Apellido</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Cédula</label>
                      <input
                        type="text"
                        value={formData.cedula}
                        onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Teléfono *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Facebook Messenger</label>
                    <input
                      type="text"
                      value={formData.facebook_username}
                      onChange={(e) => setFormData({...formData, facebook_username: e.target.value})}
                      placeholder="@usuario"
                      className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Estado</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                      >
                        <option value="prospecto">Prospecto</option>
                        <option value="cotizado">Cotizado</option>
                        <option value="activo">Activo</option>
                        <option value="vencido">Vencido</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Canal Preferido</label>
                      <select
                        value={formData.preferred_channel}
                        onChange={(e) => setFormData({...formData, preferred_channel: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-accent"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="messenger">Messenger</option>
                        <option value="telefono">Teléfono</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                    {editingClient && (
                      <button
                        type="button"
                        onClick={handleDeleteClient}
                        disabled={saving || deleting}
                        className="bg-error text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        {deleting ? (
                          <>
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <Trash2 size={18} />
                            Eliminar
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      disabled={saving || deleting}
                      className="flex-1 bg-border text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-border/80 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || deleting}
                      className="flex-1 bg-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Guardando...
                        </>
                      ) : (
                        editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}
