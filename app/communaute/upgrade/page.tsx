import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string; back?: string }>
}) {
  const params = await searchParams
  const feature = params.feature ?? 'cette fonctionnalité'
  const back = params.back ?? '/communaute'

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cc-surface-alt)" }}>
      <div
        className="max-w-sm w-full rounded-2xl border p-8 text-center"
        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
      >
        <div className="w-14 h-14 bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👑</span>
        </div>
        <h1 className="text-lg font-medium mb-2" style={{ color: "var(--cc-text)" }}>Accès Premium requis</h1>
        <p className="text-sm mb-6" style={{ color: "var(--cc-text-muted)" }}>
          L'accès à <span className="font-medium" style={{ color: "var(--cc-text)" }}>{feature}</span> est réservé aux membres Premium et Élite.
        </p>
        <Link href="/pricing"
          className="block w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-3 rounded-xl transition-colors mb-3">
          Voir les offres
        </Link>
        <Link href={back}
          className="block w-full text-sm py-2 transition-colors hover:opacity-80" style={{ color: "var(--cc-text-muted)" }}>
          Retour
        </Link>
      </div>
    </main>
  )
}
