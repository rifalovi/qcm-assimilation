'use client'
import { usePathname } from 'next/navigation'

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Cache le footer sur toutes les pages communauté et messages
  const hideFooter = pathname.startsWith('/communaute') || 
                     pathname.startsWith('/admin')
  
  if (hideFooter) return null

  return (
    <footer className="mt-10 border-t border-white/10 bg-slate-950/30 px-4 py-6 text-center text-xs text-slate-400 backdrop-blur-sm sm:px-6">
      © {new Date().getFullYear()} Cap Citoyen
      <span className="mx-2">·</span>
      <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition">👑 Tarifs</a>
      <span className="mx-2">·</span>
      <a href="/contact" className="hover:text-slate-300 transition">Contact</a>
      <span className="mx-2">·</span>
      <a href="/mentions-legales" className="hover:text-slate-300 transition">Mentions légales</a>
      <span className="mx-2">·</span>
      <a href="/privacy" className="hover:text-slate-300 transition">Politique de confidentialité</a>
      <span className="mx-2">·</span>
      <a href="/cgv" className="hover:text-slate-300 transition">CGV</a>
    </footer>
  )
}
