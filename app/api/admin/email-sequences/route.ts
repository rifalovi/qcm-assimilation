import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getEmailTemplate, STEP_DELAYS_DAYS, STEP_LABELS, type EmailStep } from '../../../../src/lib/emailTemplates'
import { escapeSupabasePattern } from '../../../../src/lib/escape'

// Client admin avec accès complet (service_role) — supporte auth.admin
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
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

// GET — Paginé, léger, pas de listUsers en bulk
export async function GET(req: NextRequest) {
  const cookieStore = (await cookies()).getAll()
  const admin = await verifyAdmin(cookieStore)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const adminClient = createAdminClient()
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '0', 10)
  const search = url.searchParams.get('search') ?? ''
  const filter = url.searchParams.get('filter') ?? 'all'
  const pageSize = 30

  // Charger les profils paginés
  let query = adminClient
    .from('profiles')
    .select('id, username, role', { count: 'exact' })

  if (search) {
    const safe = escapeSupabasePattern(search)
    if (safe) query = query.or(`username.ilike.%${safe}%`)
  }

  const { data: profiles, count: totalCount, error: profilesError } = await query.range(page * pageSize, (page + 1) * pageSize - 1)
  if (profilesError) {
    console.error('[CRM] Profiles error:', profilesError.message)
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ users: [], templates: [], pagination: { page, pageSize, total: totalCount ?? 0 }, stats: { total_users: 0, with_sequence: 0, without_sequence: 0, total_sent: 0, total_pending: 0, total_failed: 0 } })
  }

  const userIds = profiles.map(p => p.id)

  // Charger les séquences seulement pour cette page
  const { data: sequences } = userIds.length > 0
    ? await adminClient.from('email_sequences').select('user_id, step, status, scheduled_at, sent_at').in('user_id', userIds)
    : { data: [] }

  // Charger les emails + dates depuis auth admin
  const emailMap: Record<string, string> = {}
  const createdAtMap: Record<string, string> = {}
  try {
    const { data, error: authError } = await adminClient.auth.admin.listUsers({ perPage: 500 })
    if (authError) console.error('[CRM] Auth listUsers error:', authError.message)
    for (const u of data?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email
      if (u.created_at) createdAtMap[u.id] = u.created_at
    }
  } catch (e) {
    console.error('[CRM] Auth listUsers exception:', e)
  }

  const users = profiles.map(p => {
    const userSeqs = (sequences ?? []).filter(s => s.user_id === p.id)
    const lastSent = userSeqs.filter(s => s.status === 'sent').sort((a, b) => b.step - a.step)[0]
    return {
      id: p.id,
      username: p.username,
      email: emailMap[p.id] ?? null,
      role: p.role,
      created_at: createdAtMap[p.id] ?? new Date().toISOString(),
      last_step_sent: lastSent?.step ?? 0,
      steps: ([1,2,3,4,5] as const).map(step => {
        const s = userSeqs.find(x => x.step === step)
        return { step, status: s?.status ?? null, scheduled_at: s?.scheduled_at ?? null, sent_at: s?.sent_at ?? null }
      }),
    }
  })

  // Stats globales (compteurs légers sans charger toutes les données)
  const [
    { count: totalUsers },
    { count: withSeq },
    { count: totalSent },
    { count: totalPending },
    { count: totalFailed },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('email_sequences').select('user_id', { count: 'exact', head: true }),
    adminClient.from('email_sequences').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    adminClient.from('email_sequences').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('email_sequences').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
  ])

  // Distinct users with sequences
  const { data: seqUsers } = await adminClient.from('email_sequences').select('user_id')
  const uniqueSeqUsers = new Set((seqUsers ?? []).map(s => s.user_id)).size

  const templates = ([1, 2, 3, 4, 5] as EmailStep[]).map(step => ({
    step, label: STEP_LABELS[step], delay_days: STEP_DELAYS_DAYS[step],
  }))

  return NextResponse.json({
    users,
    templates,
    pagination: { page, pageSize, total: totalCount ?? 0 },
    stats: {
      total_users: totalUsers ?? 0,
      with_sequence: uniqueSeqUsers,
      without_sequence: (totalUsers ?? 0) - uniqueSeqUsers,
      total_sent: totalSent ?? 0,
      total_pending: totalPending ?? 0,
      total_failed: totalFailed ?? 0,
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

  if (action === 'send_email') {
    const { user_id, step } = body
    return await sendSingleEmail(adminClient, user_id, step as EmailStep)
  }

  if (action === 'trigger_sequence') {
    const { user_id } = body
    const now = new Date()
    for (const s of [1, 2, 3, 4, 5] as EmailStep[]) {
      const scheduledAt = new Date(now.getTime() + STEP_DELAYS_DAYS[s] * 24 * 60 * 60 * 1000)
      await adminClient.from('email_sequences').insert({
        user_id, sequence_name: 'onboarding', step: s,
        scheduled_at: scheduledAt.toISOString(), status: 'pending',
      })
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'bulk_send') {
    const { step, target } = body as { step: EmailStep; target: string }
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

    let sent = 0, failed = 0, firstError = ''
    for (const uid of targetIds.slice(0, 100)) {
      const result = await sendSingleEmail(adminClient, uid, step)
      const json = await result.json()
      if (json.success) sent++
      else { failed++; if (!firstError && json.error) firstError = json.error }
    }
    return NextResponse.json({ success: true, sent, failed, total: targetIds.length, firstError: firstError || undefined })
  }

  if (action === 'send_custom') {
    const { user_ids, subject, html_content } = body as { user_ids: string[]; subject: string; html_content: string }
    if (!user_ids?.length || !subject || !html_content) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    let sent = 0, failed = 0
    for (const uid of user_ids.slice(0, 50)) {
      try {
        const { data } = await adminClient.auth.admin.getUserById(uid)
        const email = data?.user?.email
        if (!email) { failed++; continue }
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'Cap Citoyen <no-reply@cap-citoyen.fr>', to: [email], subject, html: html_content }),
        })
        if (res.ok) sent++; else failed++
      } catch { failed++ }
    }
    return NextResponse.json({ success: true, sent, failed, total: user_ids.length })
  }

  if (action === 'capture_email') {
    const { email, source } = body as { email: string; source?: string }
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    await adminClient.from('user_events').insert({
      user_id: null, event_type: 'email_captured',
      properties: { email, source: source ?? 'admin_manual', captured_at: new Date().toISOString() },
    })
    return NextResponse.json({ success: true, email })
  }

  if (action === 'get_captured_emails') {
    const { data } = await adminClient.from('user_events').select('properties, created_at')
      .eq('event_type', 'email_captured').order('created_at', { ascending: false }).limit(200)
    const emails = (data ?? []).map(e => ({
      email: (e.properties as Record<string, unknown>)?.email ?? '',
      source: (e.properties as Record<string, unknown>)?.source ?? '',
      created_at: e.created_at,
    }))
    return NextResponse.json({ emails })
  }

  if (action === 'preview_template') {
    const { step } = body as { step: EmailStep }
    let questionDuJour = 'Quel est le principe fondamental de la République française inscrit dans sa devise ?'
    try {
      const { QUESTIONS } = await import('../../../../src/data/questions')
      questionDuJour = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].question
    } catch {}
    const template = getEmailTemplate(step, '[Prénom utilisateur]', {
      questionDuJour, scorePercent: 72, quizCount: 5,
    })
    return NextResponse.json({ subject: template.subject, html: template.html })
  }

  if (action === 'generate_share_link') {
    const { campaign } = body as { campaign?: string }
    const utm = campaign ?? 'share_invite'
    const link = `https://cap-citoyen.fr/?utm_source=referral&utm_campaign=${utm}`
    return NextResponse.json({ link })
  }

  // ── Templates custom CRUD ──
  if (action === 'save_template') {
    const { theme, subject, html_content } = body as { theme: string; subject: string; html_content: string }
    if (!theme || !subject || !html_content) return NextResponse.json({ error: 'Champs requis' }, { status: 400 })
    const { data, error } = await adminClient.from('email_templates_custom').insert({
      created_by: admin.id, theme, subject, html_content,
    }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  }

  if (action === 'list_templates') {
    const { data } = await adminClient.from('email_templates_custom')
      .select('id, theme, subject, html_content, created_at')
      .order('created_at', { ascending: false }).limit(50)
    return NextResponse.json({ templates: data ?? [] })
  }

  if (action === 'delete_template') {
    const { template_id } = body as { template_id: string }
    if (!template_id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    await adminClient.from('email_templates_custom').delete().eq('id', template_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}

async function sendSingleEmail(adminClient: ReturnType<typeof createAdminClient>, userId: string, step: EmailStep) {
  try {
    const { data } = await adminClient.auth.admin.getUserById(userId)
    const email = data?.user?.email
    if (!email) return NextResponse.json({ error: 'Email not found', success: false }, { status: 404 })

    const { data: profile } = await adminClient.from('profiles').select('username').eq('id', userId).single()
    const prenom = profile?.username ?? email.split('@')[0]

    let questionDuJour: string | undefined
    if (step === 2) {
      const { QUESTIONS } = await import('../../../../src/data/questions')
      questionDuJour = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].question
    }

    let scorePercent: number | undefined, quizCount: number | undefined
    if (step === 3) {
      const { data: results } = await adminClient.from('results').select('score_percent').eq('email', email)
      if (results?.length) {
        quizCount = results.length
        scorePercent = Math.round(results.reduce((s, r) => s + (r.score_percent ?? 0), 0) / results.length)
      }
    }

    const template = getEmailTemplate(step, prenom, { questionDuJour, scorePercent, quizCount })
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Cap Citoyen <no-reply@cap-citoyen.fr>', to: [email], subject: template.subject, html: template.html }),
    })
    const sendSuccess = resendRes.ok
    let resendError = ''
    if (!sendSuccess) {
      try { resendError = await resendRes.text() } catch {}
      console.error('[Email] Resend error:', resendError)
    }
    const now = new Date().toISOString()
    await adminClient.from('email_sequences').insert({
      user_id: userId, sequence_name: 'onboarding', step,
      scheduled_at: now, sent_at: sendSuccess ? now : null, status: sendSuccess ? 'sent' : 'failed',
    })
    return NextResponse.json({ success: sendSuccess, step, email, error: resendError || undefined })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
