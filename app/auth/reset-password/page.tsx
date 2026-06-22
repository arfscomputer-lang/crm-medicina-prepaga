'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function verifyToken() {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type') as any

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) setError('El link expiró o es inválido. Pedí uno nuevo.')
      } else {
        // Fallback: token en el hash de la URL (método antiguo)
        const hash = window.location.hash
        if (!hash.includes('access_token')) {
          setError('Link inválido. Pedí un nuevo reset de contraseña.')
        }
      }
      setVerifying(false)
    }
    verifyToken()
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <h1 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
          CRM Medicina Prepaga
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 13, marginBottom: 32 }}>
          Convierte Prospectos en Afiliados
        </p>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-soft)', borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nueva contraseña</h2>

          {verifying ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--fg-3)' }}>
              <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
              Verificando...
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', color: 'var(--success)', padding: '20px 0' }}>
              ✅ Contraseña actualizada. Redirigiendo...
            </div>
          ) : error && !password ? (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
              {error}
              <br /><br />
              <a href="/login" style={{ color: 'var(--accent)' }}>Volver al login</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Nueva contraseña</label>
                <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Confirmar contraseña</label>
                <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetí la contraseña" required style={{ width: '100%' }} />
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
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
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
