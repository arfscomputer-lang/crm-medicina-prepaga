import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth/callback']

// API routes that are intentionally public (e.g. webhook receivers)
const PUBLIC_API_PATHS: string[] = []

const ROLE_RESTRICTED: Record<string, string[]> = {
  '/configuracion': ['admin', 'superadmin'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets — pass through without touching
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Public pages — no auth required
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // API routes: only explicitly listed public ones pass through; all others require auth
  if (pathname.startsWith('/api')) {
    if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next()
    }
    // Fall through to auth check below
  }

  // Build a response we can attach refreshed auth cookies to
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT against the Supabase auth server — cannot be forged
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // API routes return 401; page routes redirect to login
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based restriction for sensitive routes
  const requiredRoles = ROLE_RESTRICTED[pathname]
  if (requiredRoles) {
    // Prefer role from JWT claims (active once migration 029 is registered in dashboard)
    let role = user.app_metadata?.user_role as string | undefined

    if (!role) {
      // Fallback: query the user's role from the database
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      role = data?.role
    }

    if (!role || !requiredRoles.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
