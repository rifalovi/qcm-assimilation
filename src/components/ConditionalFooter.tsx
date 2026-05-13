'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function ConditionalFooter() {
  const pathname = usePathname()

  if (pathname.startsWith('/communaute') || pathname.startsWith('/admin')) return null

  return (
    <footer
      role="contentinfo"
      aria-label="Pied de page Cap Citoyen"
      className="mt-auto border-t border-[#dddddd] bg-[#f6f6f6]"
    >
      {/* Bandeau principal */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Identité */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#666666]">Cap Citoyen</p>
            <p className="mt-2 text-sm leading-6 text-[#666666]">
              Plateforme de préparation à l'entretien d'intégration républicaine.
            </p>
            <p className="mt-3 text-xs text-[#929292]">
              Service indépendant, non affilié à l'État.
            </p>
          </div>

          {/* Préparation */}
          <div>
            <p className="text-sm font-bold text-[#161616] mb-3">Se préparer</p>
            <ul className="space-y-2">
              {[
                { href: "/scroll", label: "Révision par fiches" },
                { href: "/quiz", label: "Entraînement QCM" },
                { href: "/exam", label: "Examen blanc" },
                { href: "/audio", label: "Bibliothèque audio" },
                { href: "/resources", label: "Ressources officielles" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#000091] hover:text-[#1212ff] no-underline hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <p className="text-sm font-bold text-[#161616] mb-3">Informations</p>
            <ul className="space-y-2">
              {[
                { href: "/info", label: "À propos de l'examen" },
                { href: "/pricing", label: "Abonnements" },
                { href: "/contact", label: "Nous contacter" },
                { href: "/communaute", label: "Espace communauté" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#000091] hover:text-[#1212ff] no-underline hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://www.cci.fr/formation/cci-formez-vous-avec-le-test-dintegration-republicaine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#000091] hover:text-[#1212ff] no-underline hover:underline"
                >
                  Trouver un centre agréé
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <p className="text-sm font-bold text-[#161616] mb-3">Légal</p>
            <ul className="space-y-2">
              {[
                { href: "/mentions-legales", label: "Mentions légales" },
                { href: "/privacy", label: "Politique de confidentialité" },
                { href: "/cgv", label: "Conditions générales" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#000091] hover:text-[#1212ff] no-underline hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/mentions-legales#accessibilite" className="text-sm text-[#000091] hover:text-[#1212ff] no-underline hover:underline">
                  Accessibilité : non évaluée
                </Link>
              </li>
              <li>
                <Link href="/privacy#rgpd" className="text-sm text-[#000091] hover:text-[#1212ff] no-underline hover:underline">
                  Données personnelles (RGPD)
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-t border-[#dddddd] bg-[#ececfe]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs text-[#666666]">
            © {new Date().getFullYear()} Cap Citoyen — Tous droits réservés
          </p>
          <p className="text-xs text-[#666666]">
            Données hébergées en France &middot; Conforme RGPD
          </p>
        </div>
      </div>
    </footer>
  )
}
