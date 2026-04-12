import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getEmailTemplate, STEP_DELAYS_DAYS, type EmailStep } from '../../../../src/lib/emailTemplates'

// Helper: admin-only Supabase client (service role)
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )
}

// Helper: verify the caller is admin
async function verifyAdmin(cookieStore: ReturnType<Awaited<ReturnType<typeof cookies>>['getAll']>) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null
  return user
}

// GET — Liste tous les utilisateurs avec leur statut dans la séquence
export async function GET(req: NextRequest) {
  const cookieStore = (await cookies()).getAll()
  const admin = await verifyAdmin(cookieStore)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const adminClient = createAdminClient()

  // Récupérer tous les utilisateurs avec profils
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  // Récupérer les emails des utilisateurs
  const userIds = (profiles ?? []).map(p => p.id)
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  for (const u of authUsers ?? []) {
    if (u.email) emailMap[u.id] = u.email
  }

  // Récupérer toutes les séquences emails
  const { data: sequences } = await adminClient
    .from('email_sequences')
    .select('*')
    .in('user_id', userIds)
    .order('step', { ascending: true })

  // Assembler les données
  const users = (profiles ?? []).map(p => {
    const userSequences = (sequences ?? []).filter(s => s.user_id === p.id)
    const lastSent = userSequences.filter(s => s.status === 'sent').sort((a, b) => b.step - a.step)[0]
    const nextPending = userSequences.filter(s => s.status === 'pending').sort((a, b) => a.step - b.step)[0]

    return {
      id: p.id,
      username: p.username,
      email: emailMap[p.id] ?? null,
      role: p.role,
      created_at: p.created_at,
      sequences: userSequences,
      last_step_sent: lastSent?.step ?? 0,
      next_pending_step: nextPending?.step ?? null,
      next_scheduled_at: nextPending?.scheduled_at ?? null,
    }
  })

  return NextResponse.json({ users })
}

// POST — Envoyer un email ou déclencher une séquence
export async function POST(req: NextRequest) {
  const cookieStore = (await cookies()).getAll()
  const admin = await verifyAdmin(cookieStore)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const { action, user_id, step } = body as {
    action: 'send_email' | 'trigger_sequence'
    user_id: string
    step?: number
  }

  const adminClient = createAdminClient()

  if (action === 'send_email' && step) {
    // Envoyer un email spécifique à un utilisateur
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
    const authUser = (authUsers ?? []).find(u => u.id === user_id)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('username')
      .eq('id', user_id)
      .single()

    const prenom = profile?.username ?? authUser.email.split('@')[0]
    const emailStep = step as EmailStep

    // Pour J3, tirer une question aléatoire
    let questionDuJour: string | undefined
    if (emailStep === 2) {
      // Import dynamique pour éviter les problèmes de build
      const { QUESTIONS } = await import('../../../../src/data/questions')
      const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
      questionDuJour = randomQ.question
    }

    // Récupérer les stats pour J7
    let scorePercent: number | undefined
    let quizCount: number | undefined
    if (emailStep === 3) {
      const { data: results } = await adminClient
        .from('results')
        .select('score_percent')
        .eq('email', authUser.email)

      if (results && results.length > 0) {
        quizCount = results.length
        scorePercent = Math.round(results.reduce((sum, r) => sum + (r.score_percent ?? 0), 0) / results.length)
      }
    }

    const template = getEmailTemplate(emailStep, prenom, { questionDuJour, scorePercent, quizCount })

    // Envoyer via Resend
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

    // Log dans email_sequences
    await adminClient.from('email_sequences').upsert({
      user_id,
      sequence_name: 'onboarding',
      step: emailStep,
      scheduled_at: now,
      sent_at: sendSuccess ? now : null,
      status: sendSuccess ? 'sent' : 'failed',
    }, {
      onConflict: 'user_id,sequence_name,step',
      ignoreDuplicates: false,
    })

    // Fallback: si l'upsert ne fonctionne pas (pas de contrainte unique), faire un insert
    if (!sendSuccess) {
      const err = await resendRes.text()
      console.error('Resend error:', err)
    }

    // Si pas d'upsert possible, faire un insert simple
    const { error: upsertError } = await adminClient.from('email_sequences').insert({
      user_id,
      sequence_name: 'onboarding',
      step: emailStep,
      scheduled_at: now,
      sent_at: sendSuccess ? now : null,
      status: sendSuccess ? 'sent' : 'failed',
    })

    // Ignorer l'erreur de duplicate si l'upsert a fonctionné
    if (upsertError && !upsertError.message.includes('duplicate')) {
      console.error('Insert error:', upsertError)
    }

    return NextResponse.json({
      success: sendSuccess,
      step: emailStep,
      email: authUser.email,
    })
  }

  if (action === 'trigger_sequence') {
    // Déclencher la séquence complète pour un utilisateur
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()
    const authUser = (authUsers ?? []).find(u => u.id === user_id)
    if (!authUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const steps: EmailStep[] = [1, 2, 3, 4, 5]

    for (const s of steps) {
      const scheduledAt = new Date(now.getTime() + STEP_DELAYS_DAYS[s] * 24 * 60 * 60 * 1000)

      await adminClient.from('email_sequences').insert({
        user_id,
        sequence_name: 'onboarding',
        step: s,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
      })
    }

    return NextResponse.json({
      success: true,
      message: `Séquence onboarding déclenchée pour ${authUser.email}`,
      steps_scheduled: steps.length,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
