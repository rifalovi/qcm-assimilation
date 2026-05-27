'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Flag, Ban,
  Shield, BarChart2, FileEdit, LogOut,
  ChevronRight, TrendingUp, Menu, X, Headphones, Mail, Bot, Layers, ListChecks
} from 'lucide-react'

const NAV = [
  { href: '/admin',                label: 'Vue globale',       icon: LayoutDashboard },
  { href: '/admin/users',          label: 'Utilisateurs',      icon: Users },
  { href: '/admin/ai-usage',       label: 'Usage IA',          icon: Bot },
  { href: '/admin/emails',         label: 'Emails',            icon: Mail },
  { href: '/admin/questions',      label: 'Flashcards & QCM',  icon: Layers },
  { href: '/admin/quiz-questions', label: 'QCM Tests & Examens', icon: ListChecks },
  { href: '/admin/reports',        label: 'Signalements',      icon: Flag },
  { href: '/admin/bans',           label: 'Bannis',            icon: Ban },
  { href: '/admin/moderators',     label: 'Modérateurs',       icon: Shield },
  { href: '/admin/stats',          label: 'Statistiques',      icon: BarChart2 },
  { href: '/admin/analytics',      label: 'Analytics',         icon: TrendingUp },
  { href: '/admin/audio',          label: 'Audio',             icon: Headphones },
  { href: '/admin/content',        label: 'Contenu',           icon: FileEdit },
]

interface Props {
  role: string
  username: string
  logoutButton: React.ReactNode
}

export default function AdminSidebar({ role, username, logoutButton }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const sidebarContent = (
    <div className="w-60 flex flex-col h-full">
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--cc-border)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--cc-text-disabled)" }}>Cap Citoyen</p>
          <p className="text-sm font-medium" style={{ color: "var(--cc-text)" }}>Administration</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden transition hover:opacity-80" style={{ color: "var(--cc-text-muted)" }}>
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--cc-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-900/60 text-teal-300 flex items-center justify-center text-xs font-medium">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--cc-text)" }}>{username}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              role === 'super_admin' ? 'bg-amber-900/40 text-amber-400' :
              role === 'admin'       ? 'bg-blue-900/40 text-blue-400' :
                                       'bg-teal-900/40 text-teal-400'
            }`}>
              {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Modérateur'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          if (role === 'moderator' && ['/admin/moderators', '/admin/content', '/admin/audio', '/admin/users'].includes(href)) return null
          const isActive = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors group ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ color: isActive ? "var(--cc-text)" : "var(--cc-text-muted)" }}>
              <Icon size={15} />
              {label}
              <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "var(--cc-border)" }}>
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:opacity-80" style={{ color: "var(--cc-text-disabled)" }}>
          <LogOut size={15} />
          Retour au site
        </Link>
        {logoutButton}
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl border transition hover:opacity-80"
        style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)", color: "var(--cc-text-muted)" }}
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`
        lg:hidden fixed inset-y-0 left-0 z-50
        border-r
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}>
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex flex-col flex-shrink-0 w-60 border-r" style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}>
        {sidebarContent}
      </aside>
    </>
  )
}
