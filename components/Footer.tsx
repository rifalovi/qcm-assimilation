import Link from "next/link";

type FooterProps = {
  /** Mode compact pour les pages intérieures */
  compact?: boolean;
};

export default function Footer({ compact = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer
        className="border-t px-6 py-4"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
            © {currentYear} Cap Citoyen —{" "}
            <Link href="/cgv" className="hover:underline" style={{ color: "var(--cc-text-muted)" }}>CGV</Link>
            {" · "}
            <Link href="/privacy" className="hover:underline" style={{ color: "var(--cc-text-muted)" }}>Confidentialité</Link>
            {" · "}
            <Link href="/mentions-legales" className="hover:underline" style={{ color: "var(--cc-text-muted)" }}>Mentions légales</Link>
          </p>
          <span className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>
            Préparez votre examen civique avec confiance
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}
    >
      {/* Bande tricolore */}
      <div className="flex h-1 w-full">
        <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Marque */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              {/* Petit drapeau + nom */}
              <span className="flex h-5 w-7 overflow-hidden rounded-sm border" style={{ borderColor: "var(--cc-border)" }}>
                <span className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
                <span className="flex-1 bg-white" />
                <span className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
              </span>
              <span className="font-bold text-sm" style={{ color: "var(--cc-text)" }}>Cap Citoyen</span>
            </div>
            <p className="text-xs leading-5" style={{ color: "var(--cc-text-muted)" }}>
              La référence pour préparer l'examen de naturalisation française. Sérieux, progressif, humain.
            </p>
          </div>

          {/* Liens — Application */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--cc-text-disabled)" }}>
              Application
            </p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/quiz",      label: "Quiz" },
                { href: "/scroll",    label: "Flash-cards" },
                { href: "/audio",     label: "Podcasts" },
                { href: "/resources", label: "Ressources" },
                { href: "/info",      label: "Guide examen" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{ color: "var(--cc-text-muted)", textDecoration: "none" }}
                    className="hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens — Communauté */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--cc-text-disabled)" }}>
              Communauté
            </p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/communaute",                   label: "Espace membres" },
                { href: "/communaute/temoignages",        label: "Témoignages" },
                { href: "/communaute/forum",              label: "Forum" },
                { href: "/leaderboard",                   label: "Classement" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{ color: "var(--cc-text-muted)", textDecoration: "none" }}
                    className="hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens — Légal */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--cc-text-disabled)" }}>
              Informations
            </p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/pricing",          label: "Tarifs" },
                { href: "/contact",          label: "Contact" },
                { href: "/cgv",              label: "CGV" },
                { href: "/privacy",          label: "Confidentialité" },
                { href: "/mentions-legales", label: "Mentions légales" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{ color: "var(--cc-text-muted)", textDecoration: "none" }}
                    className="hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bas de footer */}
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6"
          style={{ borderColor: "var(--cc-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>
            © {currentYear} Cap Citoyen — Tous droits réservés
          </p>
          <p className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>
            République Française · Liberté, Égalité, Fraternité
          </p>
        </div>
      </div>
    </footer>
  );
}
