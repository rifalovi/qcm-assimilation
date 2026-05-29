'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Leaf, X, Zap } from 'lucide-react'

type PassType = 'express' | 'serenite'

const PASSES: {
  id: PassType
  Icon: typeof Zap
  label: string
  price: string
  period: string
  sub: string
  badge: string
  highlighted: boolean
  features: string[]
}[] = [
  {
    id: 'express',
    Icon: Zap,
    label: 'Pass Express',
    price: '4,99€',
    period: '/ 7 jours',
    sub: 'Idéal révision de dernière minute',
    badge: 'Court & efficace',
    highlighted: false,
    features: [
      'Questions illimitées (niveaux 1–3)',
      'Examen blanc illimité',
      'Explications détaillées par IA',
      'Coach IA personnalisé',
      'Bibliothèque audio complète',
    ],
  },
  {
    id: 'serenite',
    Icon: Leaf,
    label: 'Pass Sérénité',
    price: '9,99€',
    period: '/ 30 jours',
    sub: 'Recommandé — le meilleur rapport',
    badge: 'Recommandé',
    highlighted: true,
    features: [
      'Questions illimitées (niveaux 1–3)',
      'Examen blanc illimité',
      'Explications détaillées par IA',
      'Coach IA personnalisé',
      'Bibliothèque audio complète',
      'Mode fiches — révision par swipe',
      'Accès communauté',
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
  const [loading, setLoading] = useState<PassType | null>(null)
  const [selected, setSelected] = useState<PassType | null>(null)

  async function handleUpgrade(type: PassType) {
    setLoading(type)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/register?redirect=/communaute')
      return
    }

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    const { url, error } = await res.json()
    setLoading(null)
    if (!error && url) window.location.href = url
  }

  const selectedPass = PASSES.find(p => p.id === selected)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-[2rem] border p-6"
        style={{
          borderColor: 'var(--cc-border)',
          background: 'var(--cc-surface-alt)',
          boxShadow: '0 25px 70px rgba(2,8,23,0.6)',
        }}
      >
        {/* Fermer */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--cc-text-muted)' }}
          >
            <X size={15} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold mb-1" style={{ color: 'var(--cc-text)' }}>
            Accès avec un Pass
          </h2>
          <p className="text-sm" style={{ color: 'var(--cc-text-muted)' }}>
            Débloquez{' '}
            <span className="font-medium" style={{ color: 'var(--cc-text)' }}>{featureName}</span>{' '}
            et toutes les fonctionnalités — sans engagement.
          </p>
        </div>

        {/* Passes */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {PASSES.map(({ id, Icon, label, price, period, sub, badge, highlighted }) => (
            <div
              key={id}
              onClick={() => setSelected(selected === id ? null : id)}
              className="relative rounded-2xl border p-4 cursor-pointer transition-all"
              style={{
                borderColor: selected === id
                  ? 'var(--cc-primary)'
                  : highlighted
                    ? 'color-mix(in srgb, var(--cc-primary) 40%, var(--cc-border))'
                    : 'var(--cc-border)',
                background: selected === id
                  ? 'color-mix(in srgb, var(--cc-primary) 8%, var(--cc-surface))'
                  : 'var(--cc-surface)',
                outline: selected === id ? '2px solid var(--cc-primary)' : 'none',
                outlineOffset: '1px',
              }}
            >
              {/* Badge */}
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: highlighted ? 'var(--cc-primary)' : 'var(--cc-surface-alt)',
                  color: highlighted ? '#fff' : 'var(--cc-text-muted)',
                  border: highlighted ? 'none' : '1px solid var(--cc-border)',
                }}
              >
                {badge}
              </div>

              <div className="mb-1.5" style={{ color: 'var(--cc-primary)' }}>
                <Icon size={22} />
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--cc-text)' }}>{label}</p>
              <p className="text-lg font-extrabold" style={{ color: 'var(--cc-text)' }}>
                {price}
                <span className="text-xs font-normal ml-1" style={{ color: 'var(--cc-text-muted)' }}>
                  {period}
                </span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--cc-text-disabled)' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Features du pass sélectionné */}
        {selectedPass && (
          <div
            className="mb-5 rounded-2xl p-4"
            style={{ background: 'color-mix(in srgb, var(--cc-primary) 6%, var(--cc-surface))' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cc-text-muted)' }}>
              {selectedPass.label} inclut :
            </p>
            <ul className="space-y-1.5">
              {selectedPass.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--cc-text-muted)' }}>
                  <Check size={12} style={{ color: 'var(--cc-success)', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-[10px] mt-3" style={{ color: 'var(--cc-text-disabled)' }}>
              Pas de renouvellement automatique.
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2">
          {selected ? (
            <button
              onClick={() => handleUpgrade(selected)}
              disabled={!!loading}
              className="w-full py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50"
              style={{ background: 'var(--cc-primary)', color: '#fff' }}
            >
              {loading ? 'Redirection…' : `Choisir le ${selectedPass?.label} →`}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleUpgrade('express')}
                disabled={!!loading}
                className="w-full py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50"
                style={{ background: 'var(--cc-surface)', border: '1px solid var(--cc-border)', color: 'var(--cc-text)' }}
              >
                {loading === 'express' ? 'Redirection…' : 'Pass Express — 4,99€ / 7 jours →'}
              </button>
              <button
                onClick={() => handleUpgrade('serenite')}
                disabled={!!loading}
                className="w-full py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50"
                style={{ background: 'var(--cc-primary)', color: '#fff' }}
              >
                {loading === 'serenite' ? 'Redirection…' : 'Pass Sérénité — 9,99€ / 30 jours →'}
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/pricing')}
            className="w-full py-2 text-xs transition"
            style={{ color: 'var(--cc-text-disabled)' }}
          >
            Voir le comparatif complet →
          </button>
        </div>
      </div>
    </div>
  )
}
