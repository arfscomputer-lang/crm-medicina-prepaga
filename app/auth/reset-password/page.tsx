'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase client-side SDK auto-parsea el #access_token del hash y emite PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Si el usuario ya tiene sesión activa (token verificado antes de llegar acá)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.replace('/'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">CRM Medicina Prepaga</h1>
          <p className="text-sm text-gray-400">Convierte Prospectos en Afiliados</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          <h2 className="text-xl font-bold mb-6">Nueva contraseña</h2>

          {done ? (
            <div className="text-center py-6" style={{ color: 'var(--success, #22c55e)' }}>
              ✅ Contraseña actualizada. Redirigiendo...
            </div>
          ) : !ready ? (
            <div className="text-center py-6 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Verificando enlace...</p>
              <p className="text-xs mt-2 text-gray-500">Si tarda más de 10 segundos, el link expiró.<br />
                <a href="/login" className="text-accent underline">Volver al login</a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repetí la contraseña"
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
