'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Components'

type Contact = { id: string; name: string; messenger: string | null }
type Message = { id: string; text: string; sent: boolean; time: string }

const CONTACTS: Contact[] = [
  { id: '1', name: 'María González',    messenger: 'maria.gonzalez' },
  { id: '2', name: 'Carlos Benítez',    messenger: 'carlos.benitez' },
  { id: '3', name: 'Ana Villalba',      messenger: null },
  { id: '4', name: 'Lucía Paredes',     messenger: 'lucia.paredes' },
  { id: '5', name: 'Roberto Zarate',    messenger: 'roberto.zarate' },
]

const TEMPLATES = [
  { name: 'Bienvenida',      text: '¡Hola {nombre}! Te escribo por Messenger. Soy asesor EBSA y estoy para ayudarte.' },
  { name: 'Cotización',      text: 'Hola {nombre}, tu cotización EBSA: Plan {plan}, Prima {monto}. ¿Te interesa?' },
  { name: 'Seguimiento',     text: 'Hola {nombre}, ¿pudiste revisar la propuesta EBSA que te compartí?' },
  { name: 'Info coberturas', text: 'Hola {nombre}, nuestros planes incluyen consultas ilimitadas, internación, cirugías, emergencias 24/7.' },
  { name: 'Invitación',      text: 'Hola {nombre}, ¿cuándo te queda bien para hablar sobre planes de salud?' },
]

export default function MessengerPage() {
  const [selected, setSelected] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<'todos' | 'con_messenger'>('todos')

  function handleSend() {
    if (!text.trim() || !selected?.messenger) return
    const personalized = text.replace('{nombre}', selected.name.split(' ')[0])
    window.open(`https://m.me/${selected.messenger}?ref=${encodeURIComponent(personalized)}`, '_blank')
    setMessages(m => [...m, { id: Date.now().toString(), text: personalized, sent: true, time: new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }) }])
    setText('')
  }

  const filtered = CONTACTS.filter(c => filter === 'todos' || c.messenger)

  return (
    <AppShell>
      <Topbar
        title="Messenger"
        right={
          <div className="seg">
            <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos</button>
            <button className={filter === 'con_messenger' ? 'active' : ''} onClick={() => setFilter('con_messenger')}>Con Messenger</button>
          </div>
        }
      />

      <div className="cv">
        {/* List */}
        <div className="cv-list">
          <div className="hd" style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{CONTACTS.filter(c => c.messenger).length} contactos con Messenger</div>
          </div>
          <div className="items">
            {filtered.map(c => (
              <div
                key={c.id}
                className={'cv-item ' + (selected?.id === c.id ? 'active' : '')}
                onClick={() => { setSelected(c); setMessages([]) }}
              >
                <Avatar name={c.name} size="sm" />
                <div className="meta">
                  <div className="top">
                    <span className="nm">{c.name}</span>
                  </div>
                  <div className="preview" style={{ color: c.messenger ? 'var(--info)' : 'var(--fg-3)' }}>
                    {c.messenger ? `@${c.messenger}` : 'Sin Messenger'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="cv-thread">
          {selected ? (
            <>
              <div className="cv-thread-hd">
                <Avatar name={selected.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{selected.name}</div>
                  {selected.messenger && (
                    <div className="fg-3" style={{ fontSize: 12 }}>@{selected.messenger}</div>
                  )}
                </div>
                {selected.messenger && (
                  <a href={`https://m.me/${selected.messenger}`} target="_blank" rel="noreferrer" className="btn btn-sm">
                    <Icon name="MessageSquare" size={13} className="ic" />Abrir Messenger
                  </a>
                )}
              </div>
              <div className="cv-messages">
                {!selected.messenger && (
                  <div style={{ margin: 'auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
                    <div style={{ color: 'var(--fg-2)', fontSize: 13 }}>Este contacto no tiene Messenger configurado.</div>
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={'cv-msg ' + (m.sent ? 'out' : 'in')}>
                    {m.text}
                    <span className="tm">{m.time}</span>
                  </div>
                ))}
              </div>
              {selected.messenger && (
                <div className="cv-composer">
                  <textarea
                    className="input"
                    style={{ flex: 1, minHeight: 60, resize: 'none' }}
                    placeholder="Escribí el mensaje..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  />
                  <button className="btn btn-primary" onClick={handleSend} disabled={!text.trim()}>
                    <Icon name="Send" size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ textAlign: 'center', color: 'var(--fg-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📱</div>
                <div style={{ fontSize: 13 }}>Seleccioná un contacto para comenzar</div>
              </div>
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="cv-side">
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)', marginBottom: 12 }}>
            Plantillas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEMPLATES.map(t => (
              <button
                key={t.name}
                className="btn btn-ghost"
                style={{ textAlign: 'left', height: 'auto', padding: '10px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                onClick={() => setText(t.text)}
              >
                <div style={{ fontWeight: 500, fontSize: 12 }}>{t.name}</div>
                <div className="fg-3" style={{ fontSize: 11, lineHeight: 1.4, whiteSpace: 'normal' }}>{t.text.slice(0, 60)}...</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
