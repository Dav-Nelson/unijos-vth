import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Routes that don't need a login
const PUBLIC_ROUTES = ['/login', '/change-password']

// Where each role lands after login (plan §Role-Based Landing Pages)
const ROLE_LANDING: Record<string, string> = {
  RECEPTIONIST: '/queue',
  STUDENT:      '/cases',
  INTERN:       '/cases',
  RESIDENT_VET: '/approvals',
  LECTURER:     '/approvals',
  CONSULTANT:   '/approvals',
  PROFESSOR:    '/approvals',
  PHARMACIST:   '/formulary',
  ADMIN:        '/admin',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // We need a mutable response so Supabase can refresh the auth cookie
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Supabase client that reads and writes cookies on this request/response pair
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies back to the request…
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // …and to the response so the browser gets them
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the session AND refreshes the token if near expiry.
  // Never use getSession() in proxy — it trusts the cookie without re-validating.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 1. Not logged in ──────────────────────────────────────────────────────
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── 2. Logged in, on /login or /change-password ──────────────────────────
  //    Check must_change_password and route accordingly.
  if (user && (pathname === '/login' || pathname === '/change-password')) {
    // select('*') — supabase-js v2 named-column inference is unreliable for
    // partial selects; full row select always resolves to the correct Row type.
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile?.must_change_password) {
      // Still needs to change password — only /change-password is allowed
      if (pathname === '/change-password') return response
      return NextResponse.redirect(new URL('/change-password', request.url))
    }

    // Password is fine — send to role landing
    const landing = ROLE_LANDING[profile?.role ?? ''] ?? '/queue'
    return NextResponse.redirect(new URL(landing, request.url))
  }

  // ── 3. Logged in, on a protected route ───────────────────────────────────
  //    If must_change_password is true, block every page except /change-password.
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile?.must_change_password) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }
  }

  return response
}

export default middleware

// Run on all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webpo)$).*)',
  ],
}
