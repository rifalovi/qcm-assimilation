import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST — Enregistrer un abonnement push
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(s) {
            try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { endpoint, keys } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'Endpoint manquant' }, { status: 400 })

    // Upsert l'abonnement (un seul par endpoint par user)
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint,
      keys_p256dh: keys?.p256dh ?? null,
      keys_auth: keys?.auth ?? null,
      device_type: 'web',
    }, {
      onConflict: 'user_id,endpoint',
    })

    if (error) {
      console.error('[Push] Subscribe error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[Push] Subscribe error:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// DELETE — Supprimer un abonnement push
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(s) {
            try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'Endpoint manquant' }, { status: 400 })

    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[Push] Unsubscribe error:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
