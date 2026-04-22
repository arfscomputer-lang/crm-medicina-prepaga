'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { ExternalLink, Send, Users, MessageCircle, TrendingUp } from 'lucide-react'

type Message = {
  id: string
  text: string
  sent: boolean
  timestamp: string
}

export default function MessengerPage() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState<'with_messenger' | 'all'>('with_messenger')

  const contacts = [
    { id: '1', name: 'María González', phone: '0981555123', messenger: 'maria.gonzalez' },
    { id: '2', name: 'Carlos Benítez', phone: '0971888456', messenger: 'carlos.benitez' },
    { id: '3', name: 'Ana Villalba', phone: '0991234789', messenger: null },
    { id: '4', name: 'Lucía Paredes', phone: '0976111222', messenger: 'lucia.paredes' },
  ]

  const templates = [
    { name: 'Bienvenida', text: '¡Hola {nombre}! Te escribo por Messenger. Soy asesor EBSA y estoy para ayudarte.' },
    { name: 'Cotización', text: 'Hola {nombre}, tu cotización EBSA: Plan {plan}, Prima {monto}. ¿Te interesa?' },
    { name: 'Seguimiento', text: 'Hola {nombre}, ¿pudiste revisar la propuesta EBSA que te compartí?' },
    { name: 'Info coberturas', text: 'Hola {nombre}, nuestros planes incluyen consultas ilimitadas, internación, cirugías, emergencias 24/7.' },
    { name: 'Invitación', text: 'Hola {nombre}, ¿cuándo te queda bien para hablar sobre planes de salud?' },
  ]

  const stats = {
    withMessenger: contacts.filter(c => c.messenger).length,
    mensajesMes: 42,
    interacciones: 156
  }

  function handleSend() {
    if (!message.trim() || !selectedContact) return

    const contact = contacts.find(c => c.id === selectedContact)
    if (!contact || !contact.messenger) return

    window.open(`https://m.me/${contact.messenger}`, '_blank')

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sent: true,
      timestamp: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  function handleTemplateClick(template: string) {
    setMessage(template)
  }

  const filteredContacts = activeTab === 'with_messenger'
    ? contacts.filter(c => c.messenger)
    : contacts

  const selectedContactData = contacts.find(c => c.id === selectedContact)
  const canSend = selectedContactData?.messenger

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 flex bg-background flex-col">
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-[#0084FF]" size={20} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.withMessenger}</p>
            <p className="text-sm text-gray-400">Contactos con Messenger</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="text-[#0084FF]" size={20} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.mensajesMes}</p>
            <p className="text-sm text-gray-400">Mensajes Este Mes</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-[#0084FF]" size={20} />
            </div>
            <p className="text-2xl font-bold font-mono">{stats.interacciones}</p>
            <p className="text-sm text-gray-400">Total Interacciones</p>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="w-64 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex gap-1 bg-background rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('with_messenger')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    activeTab === 'with_messenger' ? 'bg-[#0084FF] text-white' : 'text-gray-400'
                  }`}
                >
                  Con Messenger
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    activeTab === 'all' ? 'bg-[#0084FF] text-white' : 'text-gray-400'
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={`p-4 border-b border-border cursor-pointer transition-colors ${
                    selectedContact === contact.id ? 'bg-[#0084FF]/20' : 'hover:bg-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium flex-1">{contact.name}</p>
                    {contact.messenger && <span className="text-lg">📱</span>}
                  </div>
                  <p className="text-sm text-gray-400">
                    {contact.messenger ? `@${contact.messenger}` : 'Sin Messenger'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                <div className="h-16 bg-gradient-to-r from-[#0084FF] to-[#A033FF] flex items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0084FF] font-bold">
                      {selectedContactData?.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedContactData?.name}</p>
                      <p className="text-xs text-gray-200">
                        {selectedContactData?.messenger ? `@${selectedContactData.messenger}` : 'Sin Messenger'}
                      </p>
                    </div>
                  </div>
                  {canSend && (
                    <button
                      onClick={() => {
                        if (selectedContactData?.messenger) {
                          window.open(`https://m.me/${selectedContactData.messenger}`, '_blank')
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm transition-colors"
                    >
                      Abrir Messenger
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-[#0C0F14] p-6 overflow-y-auto">
                  {!canSend ? (
                    <div className="text-center text-gray-500 py-20">
                      <p className="text-2xl mb-2">⚠️</p>
                      <p>Este contacto no tiene Messenger configurado</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">
                      <p>Escribí un mensaje para iniciar la conversación</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md px-4 py-2 ${
                            msg.sent
                              ? 'bg-[#0084FF] text-white rounded-[18px]'
                              : 'bg-[#303345] text-white rounded-[18px]'
                          }`}>
                            <p>{msg.text}</p>
                            <p className="text-xs text-gray-300 mt-1 text-right">{msg.timestamp}</p>
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
                      onKeyPress={(e) => e.key === 'Enter' && canSend && handleSend()}
                      placeholder={canSend ? "Escribí un mensaje..." : "Este contacto no tiene Messenger"}
                      disabled={!canSend}
                      className="flex-1 bg-[#2A3942] border-none rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      className="w-12 h-12 bg-[#0084FF] hover:bg-[#0073E6] rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#0C0F14]">
                <div className="text-center text-gray-500">
                  <p className="text-2xl mb-2">📱</p>
                  <p>Seleccioná un contacto para iniciar</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-64 bg-card border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-sm">Plantillas Messenger</h2>
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
                💡 Al enviar se abre Messenger con el usuario seleccionado
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
