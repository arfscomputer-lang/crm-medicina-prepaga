'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { email: 'admin@ebsa.com.py', password: 'admin123', name: 'Admin Principal', role: 'Acceso Total' },
    { email: 'supervisor@ebsa.com.py', password: 'supervisor123', name: 'Supervisor Equipo', role: 'No puede eliminar' },
    { email: 'agente@ebsa.com.py', password: 'agente123', name: 'Agente Ventas', role: 'Solo actividades' },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-2">CRM Medicina Prepaga</h1>
          <p className="text-sm sm:text-base text-gray-400">Convierte Prospectos en Afiliados</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Iniciar Sesión</h2>

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
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm font-medium text-gray-400 mb-4">Usuarios Demo:</p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => {
                    setEmail(user.email)
                    setPassword(user.password)
                  }}
                  className="w-full text-left bg-background hover:bg-border rounded-lg p-3 transition-colors"
                >
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <p className="text-xs text-accent mt-1">{user.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Sistema de gestión para agentes de medicina prepaga
          </p>
        </div>
      </div>
    </div>
  )
}
