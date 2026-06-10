'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Flag, Ban,
  Shield, BarChart2, FileEdit, LogOut,
  TrendingUp, Menu, X, Headphones, Mail, Bot, Layers, ListChecks
} from 'lucide-react'

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number }> }
type Group = { title: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: 'Pilotage',
    items: [
      { href: '/admin',           label: 'Vue globale',  icon: LayoutDashboard },
      { href: '/admin/stats',     label: 'Statistiques', icon: BarChart2 },
      { href: '/admin/analytics', label: 'Analytics',    icon: TrendingUp },
      { href: '/admin/ai-usage',  label: 'Usage IA',     icon: Bot },
    ],
  },
  {
    title: 'Communauté',
    items: [
      { href: '/admin/users',      label: 'Utilisateurs', icon: Users },
      { href: '/admin/reports',    label: 'Signalements', icon: Flag },
      { href: '/admin/bans',       label: 'Bannis',       icon: Ban },
      { href: '/admin/moderators', label: 'Modérateurs',  icon: Shield },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { href: '/admin/questions',      label: 'Flashcards & QCM',    icon: Layers },
      { href: '/admin/quiz-questions', label: 'QCM Tests & Examens', icon: ListChecks },
      { href: '/admin/audio',          label: 'Audio',               icon: Headphones },
      { href: '/admin/emails',         label: 'Emails',              icon: Mail },
      { href: '/admin/content',        label: 'Contenu',             icon: FileEdit },
    ],
  },
]

// Pages masquées aux modérateurs
const MOD_HIDDEN = ['/admin/moderators', '/admin/content', '/admin/audio', '/admin/users']

interface Props {
  role: string
  username: string
  logoutButton: React.ReactNode
}

export default function AdminSidebar({ role, username, logoutButton }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const roleMeta =
    role === 'super_admin' ? { label: 'Super Admin', cls: 'cc-badge-warning' } :
    role === 'admin'       ? { label: 'Admin',       cls: 'cc-badge-info' } :
                             { label: 'Modérateur',  cls: 'cc-badge-success' }

  const sidebarContent = (
    <div className="w-60 flex flex-col h-full">
      {/* En-tête marque */}
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--cc-border)' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--cc-text-disabled)' }}>Cap Citoyen</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--cc-text)' }}>Administration</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden transition hover:opacity-70" style={{ color: 'var(--cc-text-muted)' }} aria-label="Fermer le menu">
          <X size={18} />
        </button>
      </div>

      {/* Profil */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cc-border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--cc-primary-soft)', color: 'var(--cc-primary)' }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--cc-text)' }}>{username}</p>
            <span className={`cc-badge cc-badge-sm ${roleMeta.cls}`}>{roleMeta.label}</span>
          </div>
        </div>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => !(role === 'moderator' && MOD_HIDDEN.includes(i.href)))
          if (items.length === 0) return null
          return (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--cc-text-disabled)' }}>
                {group.title}
              </p>
              <div className="space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        background: isActive ? 'var(--cc-primary-soft)' : 'transparent',
                        color: isActive ? 'var(--cc-primary)' : 'var(--cc-text-muted)',
                      }}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-full" style={{ background: 'var(--cc-primary)' }} />
                      )}
                      <Icon size={15} />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Pied */}
      <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: 'var(--cc-border)' }}>
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:opacity-80" style={{ color: 'var(--cc-text-disabled)' }}>
          <LogOut size={15} />
          Retour au site
        </Link>
        {logoutButton}
      </div>
    </div>
  )

  return (
    <>
      {/* Déclencheur mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border transition hover:opacity-80"
        style={{ background: 'var(--cc-surface)', borderColor: 'var(--cc-border)', color: 'var(--cc-text-muted)' }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 border-r transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--cc-surface)', borderColor: 'var(--cc-border)' }}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex flex-col flex-shrink-0 w-60 border-r" style={{ background: 'var(--cc-surface)', borderColor: 'var(--cc-border)' }}>
        {sidebarContent}
      </aside>
    </>
  )
}
