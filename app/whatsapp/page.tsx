'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { ExternalLink, Send, Users, MessageSquare, CheckSquare, Square } from 'lucide-react'

type Message = {
  id: string
  text: string
  sent: boolean
  timestamp: string
}

type Client = {
  id: string
  name: string
  phone: string
  plan?: string
}

export default function WhatsAppPage() {
  return (
    <ProtectedRoute>
      <WhatsAppContent />
    </ProtectedRoute>
  )
}

function WhatsAppContent() {
  const { user } = useAuth()
  const [mode, setMode] = useState<'individual' | 'masivo'>('individual')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const templates = [
    { name: 'Bienvenida', text: '¡Hola {nombre}! 👋 Soy tu asesor de seguros médicos EBSA. Estoy para ayudarte a encontrar el plan ideal para vos y tu familia.' },
    { name: 'Cotización', text: 'Hola {nombre}, te comparto tu cotización: 📋 Plan: {plan}, Prima mensual: {monto}. ¿Avanzamos?' },
    { name: 'Recordatorio pago', text: 'Hola {nombre}, te recuerdo que tu pago del plan {plan} está próximo. Podés pagar por QR Bancard o Tigo Money.' },
    { name: 'Renovación', text: 'Hola {nombre}, tu plan {plan} vence pronto. ¿Conversamos sobre la renovación?' },
    { name: 'Cumpleaños', text: '¡Feliz cumpleaños {nombre}! 🎂🎉 Que tengas mucha salud en este nuevo año de vida.' },
  ]

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          client_plans!inner(
            plans(name)
          )
        `)
        .eq('is_active', true)

      if (error) throw error

      const formattedClients = data?.map((client: any) => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        phone: client.phone || '',
        plan: client.client_plans?.[0]?.plans?.name || 'Sin plan'
      })) || []

      setClients(formattedClients)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSend() {
    if (!message.trim()) return

    if (mode === 'individual' && selectedContact) {
      const contact = clients.find(c => c.id === selectedContact)
      if (!contact || !contact.phone) return

      const phoneFormatted = formatPhone(contact.phone)
      const personalizedMessage = message
        .replace('{nombre}', contact.name.split(' ')[0])
        .replace('{plan}', contact.plan || '')

      const encodedMessage = encodeURIComponent(personalizedMessage)
      window.open(`https://wa.me/${phoneFormatted}?text=${encodedMessage}`, '_blank')

      const newMessage: Message = {
        id: Date.now().toString(),
        text: personalizedMessage,
        sent: true,
        timestamp: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
      }

      setMessages([...messages, newMessage])
      setMessage('')
    } else if (mode === 'masivo' && selectedContacts.length > 0) {
      selectedContacts.forEach((contactId, index) => {
        const contact = clients.find(c => c.id === contactId)
        if (!contact || !contact.phone) return

        const phoneFormatted = formatPhone(contact.phone)
        const personalizedMessage = message
          .replace('{nombre}', contact.name.split(' ')[0])
          .replace('{plan}', contact.plan || '')

        const encodedMessage = encodeURIComponent(personalizedMessage)

        setTimeout(() => {
          window.open(`https://wa.me/${phoneFormatted}?text=${encodedMessage}`, '_blank')
        }, index * 2000)
      })

      setMessage('')
      setSelectedContacts([])
      alert(`Se abrirán ${selectedContacts.length} conversaciones de WhatsApp`)
    }
  }

  function formatPhone(phone: string): string {
    if (phone.startsWith('595')) return phone
    if (phone.startsWith('0')) return '595' + phone.substring(1)
    return '595' + phone
  }

  function handleTemplateClick(template: string) {
    setMessage(template)
  }

  function toggleContactSelection(contactId: string) {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  function toggleSelectAll() {
    const filtered = filteredClients
    if (selectedContacts.length === filtered.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filtered.map(c => c.id))
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 flex bg-background">
        <div className="w-80 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="font-bold text-lg">WhatsApp CRM</h2>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode('individual')
                  setSelectedContacts([])
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors ${
                  mode === 'individual'
                    ? 'bg-[#25D366] text-white'
                    : 'bg-border hover:bg-border/80'
                }`}
              >
                <MessageSquare size={16} />
                Individual
              </button>
              <button
                onClick={() => {
                  setMode('masivo')
                  setSelectedContact(null)
                }}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors ${
                  mode === 'masivo'
                    ? 'bg-[#25D366] text-white'
                    : 'bg-border hover:bg-border/80'
                }`}
              >
                <Users size={16} />
                Masivo
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />

            {mode === 'masivo' && (
              <button
                onClick={toggleSelectAll}
                className="w-full py-2 px-3 bg-border hover:bg-border/80 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {selectedContacts.length === filteredClients.length ? <CheckSquare size={16} /> : <Square size={16} />}
                {selectedContacts.length === filteredClients.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Cargando contactos...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No hay contactos</div>
            ) : (
              filteredClients.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    if (mode === 'individual') {
                      setSelectedContact(contact.id)
                    } else {
                      toggleContactSelection(contact.id)
                    }
                  }}
                  className={`p-4 border-b border-border cursor-pointer transition-colors ${
                    mode === 'individual' && selectedContact === contact.id
                      ? 'bg-[#25D366]/20'
                      : mode === 'masivo' && selectedContacts.includes(contact.id)
                      ? 'bg-[#25D366]/20'
                      : 'hover:bg-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-400">{contact.phone}</p>
                      <p className="text-xs text-gray-500 mt-1">{contact.plan}</p>
                    </div>
                    {mode === 'masivo' && (
                      <div className="ml-2">
                        {selectedContacts.includes(contact.id) ? (
                          <CheckSquare size={20} className="text-[#25D366]" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {mode === 'masivo' && selectedContacts.length > 0 && (
            <div className="p-4 bg-[#25D366]/10 border-t border-border">
              <p className="text-sm font-medium text-center">
                {selectedContacts.length} contacto{selectedContacts.length !== 1 ? 's' : ''} seleccionado{selectedContacts.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {mode === 'individual' && selectedContact ? (
            <>
              <div className="h-16 bg-[#075E54] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold">
                    {clients.find(c => c.id === selectedContact)?.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-white">{clients.find(c => c.id === selectedContact)?.name}</p>
                    <p className="text-xs text-gray-300">{clients.find(c => c.id === selectedContact)?.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const contact = clients.find(c => c.id === selectedContact)
                    if (contact && contact.phone) {
                      const phoneFormatted = formatPhone(contact.phone)
                      window.open(`https://wa.me/${phoneFormatted}`, '_blank')
                    }
                  }}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm transition-colors"
                >
                  Abrir WA
                  <ExternalLink size={16} />
                </button>
              </div>

              <div className="flex-1 bg-[#0B141A] p-6 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-20">
                    <p>Escribí un mensaje para iniciar la conversación</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md px-4 py-2 rounded-lg ${
                          msg.sent ? 'bg-[#005C4B] text-white' : 'bg-[#1F2C33] text-white'
                        }`}>
                          <p>{msg.text}</p>
                          <p className="text-xs text-gray-300 mt-1 text-right">{msg.timestamp} ✓✓</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#1E2428] border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 bg-[#2A3942] border-none rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSend}
                    className="w-12 h-12 bg-[#25D366] hover:bg-[#20BA5C] rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : mode === 'masivo' ? (
            <>
              <div className="h-16 bg-[#075E54] flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-white" />
                  <div>
                    <p className="font-medium text-white">Envío Masivo</p>
                    <p className="text-xs text-gray-300">
                      {selectedContacts.length} destinatario{selectedContacts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[#0B141A] p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-[#1F2C33] rounded-lg p-6 mb-6">
                    <h3 className="text-white font-medium mb-3">📋 Vista previa del mensaje</h3>
                    <div className="bg-[#005C4B] text-white px-4 py-3 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {message || 'Escribe un mensaje usando las plantillas →'}
                      </p>
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                      💡 Usa <code className="bg-[#2A3942] px-2 py-1 rounded">{'{nombre}'}</code> para personalizar con el nombre del cliente
                    </p>
                  </div>

                  {selectedContacts.length > 0 && (
                    <div className="bg-[#1F2C33] rounded-lg p-6">
                      <h3 className="text-white font-medium mb-3">👥 Destinatarios seleccionados</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedContacts.map(contactId => {
                          const contact = clients.find(c => c.id === contactId)
                          return contact ? (
                            <div key={contact.id} className="flex items-center justify-between bg-[#2A3942] px-3 py-2 rounded">
                              <span className="text-white text-sm">{contact.name}</span>
                              <span className="text-gray-400 text-xs">{contact.phone}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#1E2428] border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribí tu mensaje masivo..."
                    className="flex-1 bg-[#2A3942] border-none rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={selectedContacts.length === 0 || !message.trim()}
                    className="px-6 h-12 bg-[#25D366] hover:bg-[#20BA5C] rounded-full flex items-center justify-center gap-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                    Enviar a {selectedContacts.length}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#0B141A]">
              <div className="text-center text-gray-500">
                <p className="text-2xl mb-2">💬</p>
                <p>Seleccioná un contacto para iniciar</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-64 bg-card border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-sm">Plantillas</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {templates.map((template, i) => (
              <button
                key={i}
                onClick={() => handleTemplateClick(template.text)}
                className="w-full text-left p-3 bg-border hover:bg-border/80 rounded-lg transition-colors"
              >
                <p className="font-medium text-sm mb-1">{template.name}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{template.text}</p>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <p className="text-xs text-gray-400 text-center">
              💡 Los mensajes se personalizan automáticamente con el nombre del cliente
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
