'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin-login')
  }

  return (
    <button onClick={handleLogout}
      className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition"
      style={{ color: 'var(--cc-danger)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cc-danger-soft)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
      <LogOut size={14} />
      Déconnexion
    </button>
  )
}
