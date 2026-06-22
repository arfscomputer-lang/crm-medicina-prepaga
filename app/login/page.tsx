'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, MfaRequiredError } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { LogIn, ShieldCheck, ArrowLeft } from 'lucide-react'

type Step = 'credentials' | 'mfa' | 'forgot'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const router = useRouter()
  const { login, loginWithGoogle, verifyMfaLogin } = useAuth()

  function getNext() {
    return new URLSearchParams(window.location.search).get('next') || '/'
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      router.push(getNext())
    } catch (err: any) {
      if (err instanceof MfaRequiredError) {
        setMfaFactorId(err.factorId)
        setStep('mfa')
      } else {
        setError(err?.message || 'Credenciales inválidas')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await verifyMfaLogin(mfaFactorId, mfaCode)
      router.push(getNext())
    } catch (err: any) {
      setError(err?.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setForgotSent(true)
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con Google')
      setLoading(false)
    }
  }

  const demoUsers = process.env.NODE_ENV === 'development' ? [
    { email: 'admin@ebsa.com.py', password: 'admin123', name: 'Admin Principal', role: 'Acceso Total' },
    { email: 'supervisor@ebsa.com.py', password: 'supervisor123', name: 'Supervisor Equipo', role: 'No puede eliminar' },
    { email: 'agente@ebsa.com.py', password: 'agente123', name: 'Agente Ventas', role: 'Solo actividades' },
  ] : []

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-2">CRM Medicina Prepaga</h1>
          <p className="text-sm sm:text-base text-gray-400">Convierte Prospectos en Afiliados</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8">

          {step === 'credentials' && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Iniciar Sesión</h2>

              {/* Google OAuth */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 border border-gray-300 px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-gray-500">o con email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  />
                </div>

                {error && (
                  <div className="bg-error/10 border border-error text-error px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <LogIn size={20} />
                  )}
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStep('forgot'); setError(''); setForgotSent(false) }}
                  className="text-xs text-gray-400 hover:text-accent transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm font-medium text-gray-400 mb-4">Usuarios Demo:</p>
                <div className="space-y-2">
                  {demoUsers.map((user) => (
                    <button
                      key={user.email}
                      onClick={() => { setEmail(user.email); setPassword(user.password) }}
                      className="w-full text-left bg-background hover:bg-border rounded-lg p-3 transition-colors"
                    >
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-accent mt-1">{user.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'forgot' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold">Recuperar contraseña</h2>
              </div>
              {forgotSent ? (
                <div className="text-center py-4">
                  <p className="text-green-400 text-sm mb-4">✅ Te enviamos un email con el link para restablecer tu contraseña.</p>
                  <button onClick={() => setStep('credentials')} className="text-accent text-sm underline">Volver al login</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tu email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50">
                    {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                  </button>
                  <button type="button" onClick={() => { setStep('credentials'); setError('') }} className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2">
                    <ArrowLeft size={16} /> Volver al login
                  </button>
                </form>
              )}
            </>
          )}

          {step === 'mfa' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="text-accent" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Verificación en dos pasos</h2>
                  <p className="text-sm text-gray-400">Ingresá el código de tu app autenticadora</p>
                </div>
              </div>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Código de 6 dígitos</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoFocus
                    required
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-2xl text-white text-center tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-accent font-mono"
                  />
                </div>

                {error && (
                  <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <ShieldCheck size={20} />
                  )}
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setMfaCode(''); setError('') }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2"
                >
                  <ArrowLeft size={16} />
                  Volver al login
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Sistema de gestión para agentes de medicina prepaga</p>
        </div>
      </div>
    </div>
  )
}
