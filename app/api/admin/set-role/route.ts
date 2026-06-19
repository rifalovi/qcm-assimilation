import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

// Changement de rôle d'un utilisateur — réservé aux administrateurs.
// Le client ne peut plus écrire profiles.role directement (verrou colonnes) :
// cette route passe par le service_role après contrôle d'autorisation.

const ASSIGNABLE_ROLES = ['anonymous', 'freemium', 'premium', 'elite', 'moderator', 'admin'] as const

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  // Attribuer un rôle est sensible → admin/super_admin uniquement (pas modérateur)
  if (!['admin', 'super_admin'].includes(gate.role)) {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 })
  }

  let body: { userId?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { userId, role } = body
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 })
  }
  if (!role || !ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
  }

  const { error } = await gate.admin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
