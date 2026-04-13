import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getEmailTemplate, STEP_DELAYS_DAYS, STEP_LABELS, type EmailStep } from '../../../../src/lib/emailTemplates'

function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )
}

async function verifyAdmin(cookieStore: ReturnType<Awaited<ReturnType<typeof cookies>>['getAll']>) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null
  return user
}

// GET — Liste des utilisateurs + séquences + templates info
export async function GET(req: NextRequest) {
  const cookieStore = (await cookies()).getAll()
  const admin = await verifyAdmin(cookieStore)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const adminClient = createAdminClient()
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: false })

  if (!profiles) return NextResponse.json({ error: 'No profiles' }, { status: 500 })

  const userIds = profiles.map(p => p.id)
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authUsers ?? []) {
    if (u.email) emailMap[u.id] = u.email
  }

  const { data: sequences } = await adminClient
    .from('email_sequences')
    .select('*')
    .in('user_id', userIds)
    .order('step', { ascending: true })

  const users = profiles.map(p => {
    const userSeqs = (sequences ?? []).filter(s => s.user_id === p.id)
    const lastSent = userSeqs.filter(s => s.status === 'sent').sort((a, b) => b.step - a.step)[0]
    const nextPending = userSeqs.filter(s => s.status === 'pending').sort((a, b) => a.step - b.step)[0]
    return {
      id: p.id,
      username: p.username,
      email: emailMap[p.id] ?? null,
      role: p.role,
      created_at: p.created_at,
      sequences: userSeqs,
      last_step_sent: lastSent?.step ?? 0,
      next_pending_step: nextPending?.step ?? null,
      next_scheduled_at: nextPending?.scheduled_at ?? null,
    }
  })

  // Infos templates pour le frontend
  const templates = ([1, 2, 3, 4, 5] as EmailStep[]).map(step => ({
    step,
    label: STEP_LABELS[step],
    delay_days: STEP_DELAYS_DAYS[step],
  }))

  // Statistiques globales
  const totalSent = (sequences ?? []).filter(s => s.status === 'sent').length
  const totalPending = (sequences ?? []).filter(s => s.status === 'pending').length
  const totalFailed = (sequences ?? []).filter(s => s.status === 'failed').length

  return NextResponse.json({
    users,
    templates,
    stats: {
      total_users: users.length,
      with_sequence: users.filter(u => u.sequences.length > 0).length,
      without_sequence: users.filter(u => u.sequences.length === 0).length,
      completed: users.filter(u => u.last_step_sent >= 5).length,
      total_sent: totalSent,
      total_pending: totalPending,
      total_failed: totalFailed,
    },
  })
}

// POST — Actions CRM
export async function POST(req: NextRequest) {
  const cookieStore = (await cookies()).getAll()
  const admin = await verifyAdmin(cookieStore)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { action } = body as { action: string }
  const adminClient = createAdminClient()

  // ── Envoyer un email individuel ──
  if (action === 'send_email') {
    const { user_id, step } = body
    return await sendSingleEmail(adminClient, user_id, step as EmailStep)
  }

  // ── Déclencher une séquence pour un utilisateur ──
  if (action === 'trigger_sequence') {
    const { user_id } = body
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
    const authUser = (authUsers ?? []).find(u => u.id === user_id)
    if (!authUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()
    for (const s of [1, 2, 3, 4, 5] as EmailStep[]) {
      const scheduledAt = new Date(now.getTime() + STEP_DELAYS_DAYS[s] * 24 * 60 * 60 * 1000)
      await adminClient.from('email_sequences').insert({
        user_id, sequence_name: 'onboarding', step: s,
        scheduled_at: scheduledAt.toISOString(), status: 'pending',
      })
    }
    return NextResponse.json({ success: true, message: `Séquence déclenchée pour ${authUser.email}` })
  }

  // ── Envoi groupé : envoyer un step à tous les utilisateurs sans séquence ──
  if (action === 'bulk_send') {
    const { step, target } = body as { step: EmailStep; target: 'all' | 'no_sequence' | 'freemium' | 'premium' }

    const { data: profiles } = await adminClient.from('profiles').select('id, role')
    if (!profiles) return NextResponse.json({ error: 'No profiles' }, { status: 500 })

    let targetIds = profiles.map(p => p.id)
    if (target === 'freemium') targetIds = profiles.filter(p => p.role === 'freemium').map(p => p.id)
    if (target === 'premium') targetIds = profiles.filter(p => ['premium', 'elite'].includes(p.role)).map(p => p.id)

    if (target === 'no_sequence') {
      const { data: seqs } = await adminClient.from('email_sequences').select('user_id').eq('step', step)
      const alreadyHave = new Set((seqs ?? []).map(s => s.user_id))
      targetIds = targetIds.filter(id => !alreadyHave.has(id))
    }

    let sent = 0, failed = 0
    for (const uid of targetIds) {
      const result = await sendSingleEmail(adminClient, uid, step)
      const json = await result.json()
      if (json.success) sent++; else failed++
    }

    return NextResponse.json({ success: true, sent, failed, total: targetIds.length })
  }

  // ── Envoyer un email personnalisé (contenu libre) ──
  if (action === 'send_custom') {
    const { user_ids, subject, html_content } = body as {
      user_ids: string[]; subject: string; html_content: string;
    }
    if (!user_ids?.length || !subject || !html_content) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
    const emailLookup: Record<string, string> = {}
    for (const u of authUsers ?? []) {
      if (u.email) emailLookup[u.id] = u.email
    }

    let sent = 0, failed = 0
    for (const uid of user_ids) {
      const email = emailLookup[uid]
      if (!email) { failed++; continue }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cap Citoyen <no-reply@cap-citoyen.fr>',
          to: [email],
          subject,
          html: html_content,
        }),
      })
      if (res.ok) sent++; else failed++
    }

    return NextResponse.json({ success: true, sent, failed, total: user_ids.length })
  }

  // ── Capturer un email externe ──
  if (action === 'capture_email') {
    const { email, source } = body as { email: string; source?: string }
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

    // Stocker dans user_events comme lead capturé
    await adminClient.from('user_events').insert({
      user_id: null,
      event_type: 'email_captured',
      properties: { email, source: source ?? 'admin_manual', captured_at: new Date().toISOString() },
    })
    return NextResponse.json({ success: true, email })
  }

  // ── Récupérer les emails capturés ──
  if (action === 'get_captured_emails') {
    const { data } = await adminClient
      .from('user_events')
      .select('properties, created_at')
      .eq('event_type', 'email_captured')
      .order('created_at', { ascending: false })
      .limit(200)

    const emails = (data ?? []).map(e => ({
      email: (e.properties as Record<string, unknown>)?.email ?? '',
      source: (e.properties as Record<string, unknown>)?.source ?? '',
      created_at: e.created_at,
    }))
    return NextResponse.json({ emails })
  }

  // ── Preview d'un template ──
  if (action === 'preview_template') {
    const { step } = body as { step: EmailStep }
    const template = getEmailTemplate(step, 'Prénom', {
      questionDuJour: 'Quel est le principe fondamental de la République française inscrit dans sa devise ?',
      scorePercent: 72,
      quizCount: 5,
    })
    return NextResponse.json({ subject: template.subject, html: template.html })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}

// Helper: envoyer un email à un utilisateur
async function sendSingleEmail(adminClient: ReturnType<typeof createAdminClient>, userId: string, step: EmailStep) {
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
  const authUser = (authUsers ?? []).find(u => u.id === userId)
  if (!authUser?.email) {
    return NextResponse.json({ error: 'Email not found', success: false }, { status: 404 })
  }

  const { data: profile } = await adminClient.from('profiles').select('username').eq('id', userId).single()
  const prenom = profile?.username ?? authUser.email.split('@')[0]

  let questionDuJour: string | undefined
  if (step === 2) {
    const { QUESTIONS } = await import('../../../../src/data/questions')
    questionDuJour = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].question
  }

  let scorePercent: number | undefined, quizCount: number | undefined
  if (step === 3) {
    const { data: results } = await adminClient.from('results').select('score_percent').eq('email', authUser.email)
    if (results?.length) {
      quizCount = results.length
      scorePercent = Math.round(results.reduce((s, r) => s + (r.score_percent ?? 0), 0) / results.length)
    }
  }

  const template = getEmailTemplate(step, prenom, { questionDuJour, scorePercent, quizCount })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Cap Citoyen <no-reply@cap-citoyen.fr>',
      to: [authUser.email],
      subject: template.subject,
      html: template.html,
    }),
  })

  const sendSuccess = resendRes.ok
  const now = new Date().toISOString()

  await adminClient.from('email_sequences').insert({
    user_id: userId, sequence_name: 'onboarding', step,
    scheduled_at: now, sent_at: sendSuccess ? now : null,
    status: sendSuccess ? 'sent' : 'failed',
  })

  return NextResponse.json({ success: sendSuccess, step, email: authUser.email })
}
