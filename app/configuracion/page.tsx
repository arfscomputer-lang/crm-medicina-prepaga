'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import Icon from '@/components/ui/Icon'
import { Toggle } from '@/components/ui/Components'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { PermissionGuard } from '@/components/PermissionGuard'

interface WhatsAppConfig {
  id?: string
  access_token: string
  phone_number_id: string
  business_account_id: string
  webhook_verify_token: string
  is_active: boolean
}

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [config, setConfig] = useState<WhatsAppConfig>({
    access_token: '', phone_number_id: '', business_account_id: '',
    webhook_verify_token: '', is_active: true,
  })

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    try {
      const { data } = await supabase.from('whatsapp_config').select('*').maybeSingle()
      if (data) setConfig(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setToast(null)
    try {
      const { data: ud } = await supabase.from('users').select('org_id').eq('id', user?.id).single()
      if (!ud?.org_id) throw new Error('Organización no encontrada')

      if (config.id) {
        await supabase.from('whatsapp_config').update({
          access_token: config.access_token, phone_number_id: config.phone_number_id,
          business_account_id: config.business_account_id, webhook_verify_token: config.webhook_verify_token,
          is_active: config.is_active,
        }).eq('id', config.id)
      } else {
        await supabase.from('whatsapp_config').insert({
          org_id: ud.org_id,
          access_token: config.access_token, phone_number_id: config.phone_number_id,
          business_account_id: config.business_account_id, webhook_verify_token: config.webhook_verify_token,
          is_active: config.is_active,
        })
      }
      setToast({ type: 'success', text: 'Configuración guardada correctamente' })
      await loadConfig()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof WhatsAppConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfig(p => ({ ...p, [k]: e.target.value }))

  return (
    <AppShell>
      <Topbar
        title="Configuración"
        right={
          <PermissionGuard permission="can_manage_org">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
              <Icon name="Check" size={13} className="ic" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </PermissionGuard>
        }
      />

      <div className="scroll-area">
        <div className="page page-narrow">
          <div style={{ marginBottom: 28 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Configuración</div>
            <div className="fg-3" style={{ fontSize: 13 }}>Parámetros de integración y organización</div>
          </div>

          {toast && (
            <div className={`banner banner-${toast.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 20, '--success-soft': 'rgba(52,211,153,0.1)', '--success-line': 'rgba(52,211,153,0.3)' } as any}>
              <Icon name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} />
              <span>{toast.text}</span>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setToast(null)}><Icon name="X" size={12} /></button>
            </div>
          )}

          {/* WhatsApp Business API */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-hd">
              <div>
                <div className="ttl">WhatsApp Business API</div>
                <div className="sub">Meta for Developers → WhatsApp → Configuración de API</div>
              </div>
              <Toggle on={config.is_active} onChange={v => setConfig(p => ({ ...p, is_active: v }))} />
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} className="skel" style={{ height: 32 }} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label">Access Token *</label>
                    <div className="input-with-icon">
                      <button style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)' }} onClick={() => setShowToken(!showToken)}>
                        <Icon name={showToken ? 'EyeOff' : 'Eye'} size={14} />
                      </button>
                      <input className="input" type={showToken ? 'text' : 'password'} value={config.access_token} onChange={f('access_token')} placeholder="EAAxxxxxxxxxxxx..." style={{ paddingRight: 36 }} />
                    </div>
                    <div className="hint">Token permanente de WhatsApp Business API</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">Phone Number ID</label>
                      <input className="input" value={config.phone_number_id} onChange={f('phone_number_id')} placeholder="12345678901234" />
                    </div>
                    <div>
                      <label className="label">Business Account ID</label>
                      <input className="input" value={config.business_account_id} onChange={f('business_account_id')} placeholder="98765432109876" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Webhook Verify Token</label>
                    <input className="input" value={config.webhook_verify_token} onChange={f('webhook_verify_token')} placeholder="mi_token_secreto_123" />
                    <div className="hint">Token de verificación para el webhook de Meta</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pasos manuales */}
          <div className="card">
            <div className="card-hd">
              <div className="ttl">Configuración pendiente en Supabase</div>
              <span className="badge badge-warning">Manual</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: 'Globe', title: 'Google OAuth', desc: 'Authentication → Providers → Google → habilitar + Client ID + Secret' },
                  { icon: 'KeyRound', title: 'JWT Claims Hook', desc: 'Ejecutar migration 029 en SQL Editor, luego Authentication → Auth Hooks → registrar' },
                  { icon: 'Lock', title: 'MFA TOTP', desc: 'Authentication → Auth Policies → habilitar Multi-Factor Authentication (TOTP)' },
                ].map(step => (
                  <div key={step.icon} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--warning-soft)', border: '1px solid var(--warning-line)', display: 'grid', placeItems: 'center', color: 'var(--warning)', flexShrink: 0 }}>
                      <Icon name={step.icon} size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{step.title}</div>
                      <div className="fg-3" style={{ fontSize: 12, marginTop: 2 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
