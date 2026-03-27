'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Check } from 'lucide-react'

const PLANS = [
  {
    id: 'premium',
    icon: '🎯',
    label: 'Premium',
    price: '19,99€',
    period: '/3 mois',
    sub: '≈ 6,66€/mois · annulable',
    color: 'border-blue-400/40 bg-blue-900/20',
    btnColor: 'bg-blue-600 hover:bg-blue-500 text-white',
    badge: '⭐ Recommandé',
    badgeColor: 'bg-blue-600 text-white',
    features: [
      'Accès communauté complet',
      'Témoignages, forum, messages',
      '40 questions par session',
      'Tous les niveaux (1, 2, 3)',
      '100 épisodes audio',
      'Examen blanc illimité',
      'Statistiques détaillées',
    ],
  },
  {
    id: 'elite',
    icon: '👑',
    label: 'Élite',
    price: '49,99€',
    period: 'à vie',
    sub: 'Paiement unique · sans abonnement',
    color: 'border-amber-400/40 bg-amber-900/20',
    btnColor: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold',
    badge: '👑 Accès à vie',
    badgeColor: 'bg-amber-500 text-slate-950',
    features: [
      'Tout ce qu\'inclut Premium',
      'Accès à vie — paiement unique',
      'Contenu exclusif expert',
      'Mises à jour futures incluses',
      'Badge profil exclusif Élite',
      'Support prioritaire dédié',
      'Nouvelles questions en avant-première',
    ],
  },
]

interface Props {
  featureName?: string
  onClose?: () => void
}

export default function UpgradeCTA({ featureName = 'cette fonctionnalité', onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  async function handleUpgrade(plan: string) {
    setLoading(plan)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/register?redirect=/communaute`); return }

    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url, error } = await res.json()
    setLoading(null)
    if (!error) window.location.href = url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/98 to-slate-900/98 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.6)]">

        {/* Fermer */}
        {onClose && (
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
            <X size={15} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔒</div>
          <h2 className="text-xl font-extrabold text-white mb-1">Fonctionnalité Premium</h2>
          <p className="text-sm text-slate-400">
            Accédez à <span className="text-white font-medium">{featureName}</span> en passant à Premium ou Élite
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {PLANS.map((plan) => (
            <div key={plan.id}
              onClick={() => setSelected(selected === plan.id ? null : plan.id)}
              className={`relative rounded-2xl border p-4 cursor-pointer transition-all ${plan.color} ${selected === plan.id ? 'ring-2 ring-white/30 scale-[1.02]' : 'hover:opacity-90'}`}>
              <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${plan.badgeColor}`}>
                {plan.badge}
              </div>
              <div className="text-2xl mb-1.5">{plan.icon}</div>
              <p className="text-sm font-bold text-white">{plan.label}</p>
              <p className="text-lg font-extrabold text-white">{plan.price}<span className="text-xs font-normal text-slate-400 ml-1">{plan.period}</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">{plan.sub}</p>
            </div>
          ))}
        </div>

        {/* Features du plan sélectionné */}
        {selected && (
          <div className="mb-5 bg-white/5 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-300 mb-2">
              {PLANS.find(p => p.id === selected)?.label} inclut :
            </p>
            <ul className="space-y-1.5">
              {PLANS.find(p => p.id === selected)?.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <Check size={12} className="text-emerald-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2">
          {selected ? (
            <button
              onClick={() => handleUpgrade(selected)}
              disabled={!!loading}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50 ${PLANS.find(p => p.id === selected)?.btnColor}`}>
              {loading ? 'Redirection…' : `Passer en ${PLANS.find(p => p.id === selected)?.label} →`}
            </button>
          ) : (
            <>
              <button onClick={() => handleUpgrade('premium')} disabled={!!loading}
                className="w-full py-3 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50">
                {loading === 'premium' ? 'Redirection…' : 'Commencer avec Premium — 19,99€/3 mois →'}
              </button>
              <button onClick={() => handleUpgrade('elite')} disabled={!!loading}
                className="w-full py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 transition disabled:opacity-50">
                {loading === 'elite' ? 'Redirection…' : 'Accès à vie Élite — 49,99€ →'}
              </button>
            </>
          )}
          <button onClick={() => router.push('/pricing')}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition">
            Voir le comparatif complet →
          </button>
        </div>
      </div>
    </div>
  )
}
