import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required by @supabase/ssr
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAdminLoginPath = pathname === '/admin/login'
  const isAdminPath      = pathname.startsWith('/admin') && !isAdminLoginPath

  // Paths that require an authenticated, approved customer account
  const isGuestOrderPath = pathname.startsWith('/orders/guest/')
  const requiresApprovedAuth =
    pathname.startsWith('/account') ||
    pathname === '/orders' ||
    (pathname.startsWith('/orders/') && !isGuestOrderPath)

  // ── /admin/login ──────────────────────────────────────────────────────────
  if (isAdminLoginPath) {
    if (user) {
      const { data: adminRow } = await supabase
        .from('catalogue_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (adminRow) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    return supabaseResponse
  }

  // ── Admin paths — require admin role ──────────────────────────────────────
  if (isAdminPath) {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    const { data: adminRow } = await supabase
      .from('catalogue_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!adminRow) return NextResponse.redirect(new URL('/', request.url))
    return supabaseResponse
  }

  // ── Account / orders — require authenticated approved customer ─────────────
  if (requiresApprovedAuth) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('status')
      .eq('id', user.id)
      .single()
    if (!profile || profile.status !== 'approved') {
      const dest = profile?.status === 'rejected' || profile?.status === 'revoked'
        ? '/rejected'
        : '/pending'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // Products and cart are public — session refresh only (handled above)
  return supabaseResponse
}

export const config = {
  matcher: [
    // Public routes — included only for session cookie refresh
    '/products',
    '/products/:path*',
    '/clearance',
    '/clearance/:path*',
    '/cart',
    '/cart/:path*',
    // Guest order lookup — public
    '/orders/guest/:path*',
    // Protected — approved customers only
    '/account/:path*',
    '/orders',
    '/orders/:path*',
    // Admin
    '/admin/:path*',
  ],
}
