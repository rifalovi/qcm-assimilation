import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ step: 'auth', error: authError?.message ?? 'not logged in', user: null })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    step: 'complete',
    userId: user.id,
    email: user.email,
    profile,
    profileError: profileError?.message ?? null,
    allowed: ['super_admin', 'admin', 'moderator'].includes(profile?.role ?? '')
  })
}
