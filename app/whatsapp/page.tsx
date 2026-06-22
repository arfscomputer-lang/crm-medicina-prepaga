'use client'

import { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Components'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

// ── Types ────────────────────────────────────────────────────────────────────

type ConvClient = {
  id: string
  first_name: string
  last_name: string
  phone: string
  status: string
  client_plans: Array<{ plan_catalog: { name: string } | null }>
}

type WaConversation = {
  id: string
  client_id: string
  agent_id: string
  status: string
  last_message_preview: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
  clients: ConvClient | null
}

type WaMessage = {
  id: string
  conversation_id: string
  wa_message_id: string | null
  direction: 'inbound' | 'outbound'
  message_type: string
  body: string | null
  status: string
  created_at: string
  sent_by: string | null
}

type WaTemplate = {
  id: string
  name: string
  category: string
  body_template: string
  variables: string[]
}

type ClientContact = {
  id: string
  first_name: string
  last_name: string
  phone: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CONV_SELECT = `
  id, client_id, agent_id, status,
  last_message_preview, last_message_at, unread_count, created_at,
  clients (
    id, first_name, last_name, phone, status,
    client_plans ( plan_catalog:plan_catalog_id ( name ) )
  )
`

const FALLBACK_TEMPLATES: WaTemplate[] = [
  { id: 'f1', name: 'Bienvenida', category: 'marketing', variables: ['nombre'],
    body_template: '¡Hola {nombre}! 👋 Soy tu asesor de seguros médicos EBSA. Estoy para ayudarte a encontrar el plan ideal para vos y tu familia.' },
  { id: 'f2', name: 'Cotización', category: 'utility', variables: ['nombre', 'plan'],
    body_template: 'Hola {nombre}, te comparto tu cotización: 📋 Plan: {plan}. ¿Avanzamos?' },
  { id: 'f3', name: 'Recordatorio pago', category: 'utility', variables: ['nombre', 'plan'],
    body_template: 'Hola {nombre}, te recuerdo que tu pago del plan {plan} está próximo. Podés pagar por QR Bancard o Tigo Money.' },
  { id: 'f4', name: 'Renovación', category: 'utility', variables: ['nombre', 'plan'],
    body_template: 'Hola {nombre}, tu plan {plan} vence pronto. ¿Conversamos sobre la renovación?' },
  { id: 'f5', name: 'Cumpleaños', category: 'marketing', variables: ['nombre'],
    body_template: '¡Feliz cumpleaños {nombre}! 🎂🎉 Que tengas mucha salud en este nuevo año de vida.' },
]

function clientName(c: ConvClient | null) {
  if (!c) return 'Desconocido'
  return `${c.first_name} ${c.last_name}`.trim() || c.first_name
}

function fmt595(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('595')) return d
  if (d.startsWith('0')) return '595' + d.substring(1)
  return '595' + d
}

function personalize(tpl: string, client: ConvClient | null) {
  if (!client) return tpl
  return tpl
    .replace(/\{nombre\}/g, client.first_name)
    .replace(/\{plan\}/g, client.client_plans?.[0]?.plan_catalog?.name ?? 'EBSA')
    .replace(/\{telefono\}/g, client.phone)
}

function fmtTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday
    ? d.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })
}

function MsgStatus({ status }: { status: string }) {
  const styles: Record<string, [string, string]> = {
    enviando:  ['⏳', 'var(--fg-3)'],
    pendiente: ['✓',  'var(--fg-3)'],
    enviado:   ['✓✓', 'var(--fg-3)'],
    entregado: ['✓✓', 'var(--fg-2)'],
    'leído':   ['✓✓', '#34B7F1'],
    error:     ['✗',  'var(--error)'],
  }
  const [icon, color] = styles[status] ?? ['', '']
  return <span style={{ fontSize: 10, color, marginLeft: 3 }}>{icon}</span>
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<WaConversation[]>([])
  const [selected, setSelected] = useState<WaConversation | null>(null)
  const [messages, setMessages] = useState<WaMessage[]>([])
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [windowWarning, setWindowWarning] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [allContacts, setAllContacts] = useState<ClientContact[]>([])
  const [contactSearch, setContactSearch] = useState('')

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    loadTemplates()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadConversations() {
    setLoading(true)
    const { data } = await supabase
      .from('whatsapp_conversations')
      .select(CONV_SELECT)
      .order('last_message_at', { ascending: false })
      .limit(50)
    setConversations((data ?? []) as unknown as WaConversation[])
    setLoading(false)
  }

  async function loadTemplates() {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('id, name, category, body_template, variables, is_active')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
    setTemplates(data && data.length > 0 ? (data as WaTemplate[]) : FALLBACK_TEMPLATES)
  }

  async function loadAllContacts() {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone')
      .neq('status', 'cancelado')
      .not('phone', 'is', null)
      .order('first_name')
    setAllContacts((data ?? []) as ClientContact[])
  }

  async function selectConversation(conv: WaConversation) {
    setSelected(conv)
    setWindowWarning(false)

    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at')
      .limit(100)
    setMessages((data ?? []) as WaMessage[])

    if (conv.unread_count > 0) {
      await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', conv.id)
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
    }

    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`wa_msgs_${conv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'whatsapp_messages',
        filter: `conversation_id=eq.${conv.id}`,
      }, payload => {
        const msg = payload.new as WaMessage
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        setConversations(prev => prev.map(c =>
          c.id === conv.id
            ? { ...c, last_message_preview: msg.body ?? '', last_message_at: msg.created_at,
                unread_count: msg.direction === 'inbound' ? c.unread_count + 1 : c.unread_count }
            : c
        ))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'whatsapp_messages',
        filter: `conversation_id=eq.${conv.id}`,
      }, payload => {
        const upd = payload.new as WaMessage
        setMessages(prev => prev.map(m => m.id === upd.id ? upd : m))
      })
      .subscribe()
  }

  async function handleSend() {
    if (!selected || !text.trim() || sending) return
    const body = text.trim()
    setText('')
    setSending(true)
    setWindowWarning(false)

    const optimisticId = `local_${Date.now()}`
    setMessages(prev => [...prev, {
      id: optimisticId, conversation_id: selected.id, wa_message_id: null,
      direction: 'outbound', message_type: 'text', body,
      status: 'enviando', created_at: new Date().toISOString(), sent_by: user?.id ?? null,
    }])

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selected.clients?.phone, body }),
      })
      const result = await res.json()

      if (result.error === 'window_expired') {
        setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'error' } : m))
        setWindowWarning(true)
        return
      }

      const { data: saved } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: selected.id,
          direction: 'outbound',
          message_type: 'text',
          body,
          status: result.waMessageId ? 'enviado' : 'pendiente',
          wa_message_id: result.waMessageId ?? null,
          sent_by: user?.id,
        })
        .select()
        .single()

      await supabase.from('whatsapp_conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.length > 60 ? body.slice(0, 60) + '...' : body,
      }).eq('id', selected.id)

      setMessages(prev => prev.map(m =>
        m.id === optimisticId ? ((saved as WaMessage) ?? { ...m, status: 'pendiente' }) : m
      ))
      setConversations(prev =>
        prev.map(c =>
          c.id === selected.id
            ? { ...c, last_message_preview: body.length > 60 ? body.slice(0, 60) + '...' : body, last_message_at: new Date().toISOString() }
            : c
        ).sort((a, b) =>
          new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime()
        )
      )
    } catch {
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'error' } : m))
    } finally {
      setSending(false)
    }
  }

  async function startConversation(contact: ClientContact) {
    if (!user) return
    const existing = conversations.find(c => c.client_id === contact.id)
    if (existing) { setShowNewConv(false); selectConversation(existing); return }

    const { data } = await supabase
      .from('whatsapp_conversations')
      .insert({ client_id: contact.id, agent_id: user.id, org_id: user.org_id, status: 'open' })
      .select(CONV_SELECT)
      .single()

    if (data) {
      const conv = data as unknown as WaConversation
      setConversations(prev => [conv, ...prev])
      setShowNewConv(false)
      selectConversation(conv)
    }
  }

  const filteredConvs = conversations.filter(c => {
    const n = clientName(c.clients).toLowerCase()
    return n.includes(search.toLowerCase()) || (c.clients?.phone ?? '').includes(search)
  })

  const filteredContacts = allContacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone.includes(contactSearch)
  )

  return (
    <AppShell>
      <Topbar title="WhatsApp" />

      {/* Modal nueva conversación */}
      {showNewConv && (
        <div className="modal-overlay" onClick={() => setShowNewConv(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva conversación</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewConv(false)}>
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <input
                className="input"
                placeholder="Buscar cliente..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                autoFocus
              />
              <div style={{ marginTop: 10, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredContacts.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Sin resultados</div>
                ) : filteredContacts.map(c => (
                  <button
                    key={c.id}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', gap: 10 }}
                    onClick={() => startConversation(c)}
                  >
                    <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{c.first_name} {c.last_name}</div>
                      <div className="fg-3" style={{ fontSize: 11 }}>{c.phone}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cv">
        {/* Lista de conversaciones */}
        <div className="cv-list">
          <div className="hd" style={{ display: 'flex', gap: 8 }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <Icon name="Search" size={13} className="ic" />
              <input className="input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button
              className="btn btn-primary btn-sm"
              title="Nueva conversación"
              style={{ flexShrink: 0 }}
              onClick={async () => { await loadAllContacts(); setContactSearch(''); setShowNewConv(true) }}
            >
              <Icon name="Plus" size={14} />
            </button>
          </div>

          <div className="items">
            {loading ? (
              <div style={{ padding: 20 }}>
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                    <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skel" style={{ width: '55%', height: 11, marginBottom: 6 }} />
                      <div className="skel" style={{ width: '75%', height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                Sin conversaciones
                <br />
                <button
                  className="btn btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={async () => { await loadAllContacts(); setContactSearch(''); setShowNewConv(true) }}
                >
                  <Icon name="Plus" size={13} className="ic" />Iniciar una
                </button>
              </div>
            ) : filteredConvs.map(conv => (
              <div
                key={conv.id}
                className={'cv-item ' + (selected?.id === conv.id ? 'active' : '')}
                onClick={() => selectConversation(conv)}
              >
                <Avatar name={clientName(conv.clients)} size="sm" />
                <div className="meta">
                  <div className="top">
                    <span className="nm">{clientName(conv.clients)}</span>
                    <span className="ts">{fmtTime(conv.last_message_at)}</span>
                  </div>
                  <div className="preview">{conv.last_message_preview ?? conv.clients?.phone ?? ''}</div>
                </div>
                {conv.unread_count > 0 && (
                  <span style={{
                    background: '#25D366', color: 'white',
                    borderRadius: 999, padding: '1px 6px',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>
                    {conv.unread_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="cv-thread">
          {selected ? (
            <>
              <div className="cv-thread-hd">
                <Avatar name={clientName(selected.clients)} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{clientName(selected.clients)}</div>
                  <div className="fg-3" style={{ fontSize: 12 }}>{selected.clients?.phone}</div>
                </div>
                <a
                  href={`https://wa.me/${selected.clients?.phone ? fmt595(selected.clients.phone) : ''}`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-sm"
                >
                  <Icon name="ExternalLink" size={13} className="ic" />WhatsApp
                </a>
              </div>

              {windowWarning && (
                <div style={{
                  margin: '0 12px 8px', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #d97706', background: 'rgba(217,119,6,0.08)',
                  fontSize: 12, color: '#d97706', display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <Icon name="AlertTriangle" size={14} />
                  <span style={{ flex: 1 }}>Ventana de 24hs vencida. Iniciá la conversación desde WhatsApp o usá un template de Meta.</span>
                  <a
                    href={`https://wa.me/${selected.clients?.phone ? fmt595(selected.clients.phone) : ''}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: '#25D366', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                  >
                    Abrir WA
                  </a>
                </div>
              )}

              <div className="cv-messages">
                {messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                    Seleccioná una plantilla o escribí un mensaje.
                  </div>
                ) : messages.map(m => (
                  <div key={m.id} className={'cv-msg ' + (m.direction === 'outbound' ? 'out' : 'in')}>
                    <span>{m.body}</span>
                    <span className="tm">
                      {fmtTime(m.created_at)}
                      {m.direction === 'outbound' && <MsgStatus status={m.status} />}
                    </span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="cv-composer">
                <textarea
                  className="input"
                  style={{ flex: 1, minHeight: 60, resize: 'none' }}
                  placeholder="Escribí el mensaje... (Enter para enviar, Shift+Enter nueva línea)"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                >
                  <Icon name="Send" size={14} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, color: 'var(--fg-3)' }}>
              <div style={{ fontSize: 36 }}>💬</div>
              <div style={{ fontSize: 13 }}>Seleccioná una conversación o iniciá una nueva</div>
            </div>
          )}
        </div>

        {/* Panel de plantillas */}
        <div className="cv-side">
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', marginBottom: 12 }}>
            Plantillas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => {
              const preview = selected ? personalize(t.body_template, selected.clients) : t.body_template
              return (
                <button
                  key={t.id}
                  className="btn btn-ghost"
                  style={{ textAlign: 'left', height: 'auto', padding: '10px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                  onClick={() => setText(preview)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                    <span style={{ fontWeight: 500, fontSize: 12, flex: 1 }}>{t.name}</span>
                    <span style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
                      textTransform: 'uppercase',
                      background: t.category === 'marketing' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.12)',
                      color: t.category === 'marketing' ? '#818cf8' : '#4ade80',
                    }}>{t.category}</span>
                  </div>
                  <div className="fg-3" style={{ fontSize: 11, lineHeight: 1.4, whiteSpace: 'normal' }}>
                    {preview.slice(0, 70)}…
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
