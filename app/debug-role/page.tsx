'use client'
import { useUser, ROLE_LIMITS } from '../components/UserContext'

export default function DebugRole() {
  const { role, username, email } = useUser()
  const limits = ROLE_LIMITS[role as keyof typeof ROLE_LIMITS]
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', color: 'var(--cc-text)', background: 'var(--cc-surface)', minHeight: '100vh' }}>
      <h1>Debug Role</h1>
      <p>Username: {String(username)}</p>
      <p>Email: {String(email)}</p>
      <p>Role: {String(role)}</p>
      <p>Limits exists: {limits ? 'YES' : 'NO - CRASH SOURCE'}</p>
      <pre>{JSON.stringify(limits, null, 2)}</pre>
    </div>
  )
}
