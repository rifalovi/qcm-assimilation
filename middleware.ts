// middleware.ts — version compatible Netlify Edge Functions
// On évite d'importer @supabase/ssr directement dans le middleware
// car les Edge Functions Netlify ont des restrictions sur les modules Node.js

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pages protégées : uniquement /account pour l'instant
  if (pathname.startsWith('/account')) {
    // Vérifie la présence du cookie de session Supabase
    // Supabase nomme ses cookies "sb-*-auth-token"
    const hasCookie = request.cookies.getAll().some(
      cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )

    if (!hasCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Exclut les fichiers statiques et les routes internes Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}