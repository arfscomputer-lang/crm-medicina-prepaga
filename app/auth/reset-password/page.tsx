'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function verify() {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type') ?? 'recovery'

      if (token_hash) {
        // PKCE flow — exchange token_hash for session
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })
        if (error) {
          setError('El link expiró o ya fue usado. Pedí uno nuevo desde el login.')
        } else {
          setReady(true)
        }
        return
      }

      // Implicit flow — token arrives in URL hash, SDK lo maneja solo
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })

      // Si ya hay sesión activa
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setReady(true)

      return () => subscription.unsubscribe()
    }

    verify()
  }, [searchParams])

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
            <div className="text-center py-6 text-green-400">
              ✅ Contraseña actualizada. Redirigiendo...
            </div>
          ) : error && !ready ? (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
              <a href="/login" className="block text-center text-accent text-sm underline">Volver al login</a>
            </div>
          ) : !ready ? (
            <div className="text-center py-6 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Verificando enlace...</p>
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
                  autoFocus
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-gray-400">Cargando...</div>}>
      <ResetForm />
    </Suspense>
  )
}
