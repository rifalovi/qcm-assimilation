// app/api/cron/weekly-question/route.ts
// « La question de la semaine » — envoi hebdomadaire d'une mise en situation
// (push web + email) avec un CTA vers l'appli pour découvrir la réponse.
//
// Déclenché par la Netlify Scheduled Function (netlify/functions/weekly-question.mjs)
// chaque lundi matin, OU manuellement (test) avec le secret.
//
// Sécurité : protégé par CRON_SECRET (header `x-cron-secret` ou `?secret=`).
// Modes :
//   ?mode=test       (DÉFAUT) → uniquement le compte propriétaire (toi). Sûr.
//   ?mode=broadcast  → tous les abonnés push + tous les emails utilisateurs.
//
// Variables d'environnement :
//   CRON_SECRET                (obligatoire)
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   (push)
//   RESEND_API_KEY                                     (email)
//   NEXT_PUBLIC_SITE_URL       (def. https://cap-citoyen.fr)
//   WEEKLY_OWNER_USER_ID, WEEKLY_OWNER_EMAIL          (cible du mode test)

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import webpush from 'web-push'
import {
  buildPushPayload,
  buildWeeklyEmailHtml,
  getIsoWeek,
  pickWeeklySituation,
  type WeeklySituation,
} from '../../../../src/lib/weeklyQuestion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OWNER_USER_ID = process.env.WEEKLY_OWNER_USER_ID ?? '242f40a0-5fd3-4696-bf28-ad05276d10fc'
const OWNER_EMAIL = process.env.WEEKLY_OWNER_EMAIL ?? 'rifalovi@gmail.com'
const FROM = 'Cap Citoyen <no-reply@cap-citoyen.fr>'
const SUBJECT = 'La question de la semaine 🇫🇷'

function setupVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails('mailto:contact@cap-citoyen.fr', publicKey, privateKey)
  return true
}

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

async function handle(req: NextRequest) {
  // --- Authentification par secret ---
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
  }
  const url = new URL(req.url)
  const provided = req.headers.get('x-cron-secret') ?? url.searchParams.get('secret') ?? ''
  if (provided !== secret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const mode = url.searchParams.get('mode') === 'broadcast' ? 'broadcast' : 'test'
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cap-citoyen.fr').replace(/\/$/, '')
  const supabase = adminClient()

  // --- Sélection de la mise en situation de la semaine ---
  const { data: rows, error: rowsErr } = await supabase
    .from('quiz_questions')
    .select('id,question,choice_a,choice_b,choice_c,choice_d,theme,level')
    .eq('type', 'situation')
    .eq('status', 'active')
    .order('id', { ascending: true })

  if (rowsErr) {
    return NextResponse.json({ error: 'Lecture des situations impossible' }, { status: 500 })
  }
  const q = pickWeeklySituation((rows ?? []) as WeeklySituation[], new Date())
  if (!q) {
    return NextResponse.json({ error: 'Aucune mise en situation disponible' }, { status: 404 })
  }

  // --- Push web ---
  let pushSent = 0
  let pushTotal = 0
  if (setupVapid()) {
    let query = supabase.from('push_subscriptions').select('*')
    if (mode === 'test') query = query.eq('user_id', OWNER_USER_ID)
    const { data: subs } = await query
    const payload = JSON.stringify(buildPushPayload(q, appUrl))
    for (const sub of subs ?? []) {
      pushTotal++
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
          payload,
        )
        pushSent++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
  }

  // --- Email ---
  let emailSent = 0
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    const html = buildWeeklyEmailHtml(q, appUrl)

    let recipients: string[] = []
    if (mode === 'test') {
      recipients = [OWNER_EMAIL]
    } else {
      // Broadcast : emails via l'API admin (pagination, garde-fou 50 pages).
      const seen = new Set<string>()
      for (let page = 1; page <= 50; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
        if (error || !data?.users?.length) break
        for (const u of data.users) if (u.email) seen.add(u.email)
        if (data.users.length < 200) break
      }
      recipients = [...seen]
    }

    for (const to of recipients) {
      try {
        await resend.emails.send({ from: FROM, to, subject: SUBJECT, html })
        emailSent++
      } catch {
        // best-effort : un échec d'email ne bloque pas le reste
      }
    }
  }

  return NextResponse.json({
    ok: true,
    mode,
    week: getIsoWeek(new Date()),
    questionId: q.id,
    pushSent,
    pushTotal,
    emailSent,
  })
}

export async function POST(req: NextRequest) {
  return handle(req)
}

export async function GET(req: NextRequest) {
  return handle(req)
}
