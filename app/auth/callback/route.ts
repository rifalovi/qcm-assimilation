// app/auth/callback/route.ts
// Route qui reçoit le lien magique de l'email de confirmation
// Supabase redirige ici après que l'utilisateur clique sur "Confirmer mon email"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Échange le code temporaire contre une vraie session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Email confirmé → on met le rôle à "freemium"
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ role: 'freemium' })
          .eq('id', user.id)
      }
      // Redirige vers la page d'accueil après confirmation
      return NextResponse.redirect(`${origin}/register?confirmed=true`)
    }
  }

  // En cas d'erreur, redirige vers login
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
