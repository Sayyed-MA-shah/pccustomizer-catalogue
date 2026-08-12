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
  const isCataloguePath  =
    pathname.startsWith('/products') ||
    pathname.startsWith('/account')  ||
    pathname.startsWith('/cart')     ||
    pathname.startsWith('/orders')

  // ── /admin/login ──────────────────────────────────────────────────────────
  // Public page — anyone can visit, but authenticated admins get sent to /admin
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

  // ── Unauthenticated — redirect to appropriate login ────────────────────────
  if (!user) {
    if (isAdminPath)     return NextResponse.redirect(new URL('/admin/login', request.url))
    if (isCataloguePath) return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Customer paths — verify approved status ────────────────────────────────
  if (user && isCataloguePath) {
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

  // ── Admin paths — verify admin role ───────────────────────────────────────
  if (user && isAdminPath) {
    // Authenticated client — RLS returns only the user's own catalogue_admins row
    const { data: adminRow } = await supabase
      .from('catalogue_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/products/:path*',
    '/account/:path*',
    '/cart',
    '/cart/:path*',
    '/orders',
    '/orders/:path*',
    '/admin/:path*',
  ],
}
