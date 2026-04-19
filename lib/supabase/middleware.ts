import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminRole } from '@/lib/roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Chroń ścieżki wymagające logowania
  const protectedPaths = ['/dashboard', '/checkout', '/admin']
  const isProtected = protectedPaths.some((p) => path.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const returnTo = `${path}${request.nextUrl.search || ''}`
    url.searchParams.set('redirect', returnTo)
    return NextResponse.redirect(url)
  }

  // Chroń admin — sprawdź rolę (najpierw sync profilu z bazy auth — naprawia brak wiersza / starą rolę)
  if (path.startsWith('/admin') && user) {
    await supabase.rpc('sync_profile')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!isAdminRole(profile?.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('notice', 'admin_only')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
