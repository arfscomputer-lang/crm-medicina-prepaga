'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

// Landing page after Google OAuth redirect.
// The Supabase client picks up the tokens from the URL automatically
// (detectSessionInUrl: true), fires onAuthStateChange, and loadUserProfile
// sets the sb_auth cookie. We then redirect to the app.
export default function AuthCallback() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/' : '/login')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Completando autenticación...</p>
      </div>
    </div>
  )
}
