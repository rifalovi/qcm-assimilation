import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure VAPID (appelé à chaque requête, pas au build)
function setupVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    console.error('[Push] VAPID keys manquantes')
    return false
  }
  webpush.setVapidDetails(
    'mailto:contact@cap-citoyen.fr',
    publicKey,
    privateKey
  )
  return true
}

// POST — Envoyer une notification push à un utilisateur
export async function POST(req: NextRequest) {
  try {
    if (!setupVapid()) {
      return NextResponse.json({ error: 'VAPID non configuré' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )

    const { user_id, title, body, url, tag } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

    // Récupérer tous les abonnements push de l'utilisateur
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'Aucun abonnement push' })
    }

    const payload = JSON.stringify({
      title: title ?? 'Cap Citoyen',
      body: body ?? 'Nouvelle notification',
      url: url ?? '/communaute/messages',
      tag: tag ?? 'message',
    })

    let sent = 0
    const errors: string[] = []

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth,
            },
          },
          payload
        )
        sent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        // 410 Gone ou 404 = abonnement expiré, supprimer
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }
        errors.push(`${sub.endpoint.slice(-20)}: ${statusCode}`)
      }
    }

    return NextResponse.json({ sent, total: subscriptions.length, errors })
  } catch (e) {
    console.error('[Push] Send error:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
