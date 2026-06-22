'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react'

type MfaFactor = { id: string; status: string }

export function MfaSetup() {
  const { enrollMfa, unenrollMfa } = useAuth()
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [pendingFactorId, setPendingFactorId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFactors()
  }, [])

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.totp ?? [])
  }

  async function handleEnroll() {
    setLoading(true)
    setError('')
    try {
      const { qrCode, secret, factorId } = await enrollMfa()
      setQrCode(qrCode)
      setSecret(secret)
      setPendingFactorId(factorId)
      setEnrolling(true)
    } catch (err: any) {
      setError(err?.message || 'Error al configurar MFA')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: challenge, error: ce } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId })
      if (ce) throw ce
      const { error: ve } = await supabase.auth.mfa.verify({
        factorId: pendingFactorId,
        challengeId: challenge.id,
        code: verifyCode,
      })
      if (ve) throw ve
      setEnrolling(false)
      setVerifyCode('')
      await loadFactors()
    } catch (err: any) {
      setError(err?.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnenroll(factorId: string) {
    setLoading(true)
    setError('')
    try {
      await unenrollMfa(factorId)
      await loadFactors()
    } catch (err: any) {
      setError(err?.message || 'Error al desactivar MFA')
    } finally {
      setLoading(false)
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeFactor = factors.find(f => f.status === 'verified')

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className={activeFactor ? 'text-success' : 'text-gray-400'} size={24} />
        <div>
          <h3 className="font-bold text-lg">Autenticación en dos pasos (MFA)</h3>
          <p className="text-sm text-gray-400">
            {activeFactor ? 'Activo — tu cuenta tiene una capa extra de seguridad' : 'Inactivo — activá MFA para mayor seguridad'}
          </p>
        </div>
        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${activeFactor ? 'bg-success/10 text-success' : 'bg-border text-gray-400'}`}>
          {activeFactor ? 'ACTIVO' : 'INACTIVO'}
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Estado: MFA activo */}
      {activeFactor && !enrolling && (
        <button
          onClick={() => handleUnenroll(activeFactor.id)}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-error hover:text-error/80 transition-colors disabled:opacity-50"
        >
          <ShieldOff size={16} />
          Desactivar MFA
        </button>
      )}

      {/* Estado: sin MFA, mostrar botón para activar */}
      {!activeFactor && !enrolling && (
        <button
          onClick={handleEnroll}
          disabled={loading}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <ShieldCheck size={16} />
          )}
          Activar MFA
        </button>
      )}

      {/* Estado: enrolling — mostrar QR y verificación */}
      {enrolling && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-400 mb-4">
              1. Escaneá este QR con Google Authenticator, Authy, o cualquier app TOTP
            </p>
            {qrCode && (
              <div className="bg-white p-4 rounded-xl inline-block">
                <img src={qrCode} alt="QR MFA" className="w-48 h-48" />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">O ingresá la clave manualmente:</p>
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
              <code className="text-xs text-accent flex-1 break-all">{secret}</code>
              <button onClick={copySecret} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">2. Ingresá el código de 6 dígitos para confirmar:</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-xl text-white text-center tracking-[0.5em] font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || verifyCode.length !== 6}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                Confirmar y activar
              </button>
              <button
                type="button"
                onClick={() => { setEnrolling(false); setVerifyCode(''); setError('') }}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-border transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
