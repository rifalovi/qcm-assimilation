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
      className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 transition hover:bg-red-500/10">
      <LogOut size={14} />
      Déconnexion
    </button>
  )
}
