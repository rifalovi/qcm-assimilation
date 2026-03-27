import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error, count } = await adminClient
    .from('profiles')
    .select('id, username, role', { count: 'exact' })
    .limit(5)

  return NextResponse.json({
    url_ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key_ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    count,
    error: error?.message ?? null,
    data,
  })
}
