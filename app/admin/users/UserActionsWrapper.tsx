'use client'

import { useState, useEffect } from 'react'
import UserActions from './UserActions'

type User = {
  id: string; username: string; role: string; city: string | null
  postal_code: string | null; first_name: string | null; last_name: string | null
  email: string; created_at: string
}

export default function UserActionsWrapper({ bannedIds, currentRole }: { bannedIds: string[]; currentRole: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin-users')
      .then(r => r.json())
      .then(data => {
        setUsers(data.users ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-400 text-sm py-8 text-center">Chargement des utilisateurs…</p>

  return <UserActions users={users} bannedIds={bannedIds} currentRole={currentRole} />
}
