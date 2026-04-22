'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { Settings, Save, Eye, EyeOff } from 'lucide-react'

interface WhatsAppConfig {
  id?: string
  access_token: string
  phone_number_id: string
  business_account_id: string
  webhook_verify_token: string
  is_active: boolean
}

export default function ConfiguracionPage() {
  return (
    <ProtectedRoute>
      <ConfiguracionContent />
    </ProtectedRoute>
  )
}

function ConfiguracionContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [config, setConfig] = useState<WhatsAppConfig>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
    is_active: true
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        setConfig(data)
      }
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user?.id)
        .single()

      if (!userData?.org_id) {
        throw new Error('Organization not found')
      }

      if (config.id) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update({
            access_token: config.access_token,
            phone_number_id: config.phone_number_id,
            business_account_id: config.business_account_id,
            webhook_verify_token: config.webhook_verify_token,
            is_active: config.is_active
          })
          .eq('id', config.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('whatsapp_config')
          .insert({
            org_id: userData.org_id,
            access_token: config.access_token,
            phone_number_id: config.phone_number_id,
            business_account_id: config.business_account_id,
            webhook_verify_token: config.webhook_verify_token,
            is_active: config.is_active
          })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' })
      await loadConfig()
    } catch (error: any) {
      console.error('Error saving config:', error)
      setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Cargando configuración...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-60 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="p-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold">Configuración de WhatsApp Business</h1>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-400 mb-2">📱 Cómo obtener tus credenciales de WhatsApp Business</h3>
              <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Meta for Developers</a></li>
                <li>Crea o selecciona tu aplicación de WhatsApp Business</li>
                <li>En el panel, ve a WhatsApp &gt; Configuración de API</li>
                <li>Copia el <strong>Token de acceso</strong> (Access Token)</li>
                <li>Copia el <strong>ID de número de teléfono</strong> (Phone Number ID)</li>
                <li>Copia el <strong>ID de cuenta de WhatsApp Business</strong> (Business Account ID)</li>
                <li>Genera un token de verificación de webhook personalizado</li>
              </ol>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Access Token *
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={config.access_token}
                    onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-accent"
                    placeholder="EAAxxxxxxxxxxxx..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Token permanente de la API de WhatsApp Business</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number ID *
                </label>
                <input
                  type="text"
                  value={config.phone_number_id}
                  onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
                  placeholder="123456789012345"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">ID del número de teléfono de WhatsApp Business</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Account ID
                </label>
                <input
                  type="text"
                  value={config.business_account_id}
                  onChange={(e) => setConfig({ ...config, business_account_id: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-400 mt-1">ID de la cuenta de WhatsApp Business (opcional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  value={config.webhook_verify_token}
                  onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
                  placeholder="tu_token_secreto_123"
                />
                <p className="text-xs text-gray-400 mt-1">Token para verificar webhooks (puedes crear uno personalizado)</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={config.is_active}
                  onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-border bg-background checked:bg-accent"
                />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                  Activar integración de WhatsApp
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving || !config.access_token || !config.phone_number_id}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3">🔒 Seguridad</h3>
            <p className="text-sm text-gray-300">
              Tus credenciales de WhatsApp Business se almacenan de forma segura en la base de datos con políticas de seguridad a nivel de fila (RLS).
              Solo los administradores de tu organización pueden ver y modificar esta configuración.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
