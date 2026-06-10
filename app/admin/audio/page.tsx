'use client'

import { useState } from 'react'
import SeriesManager from './SeriesManager'
import EpisodesManager from './EpisodesManager'
import MediaManager from './MediaManager'
import ComingSoonManager from './ComingSoonManager'

type Tab = 'series' | 'episodes' | 'media' | 'coming_soon'

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: 'series',      label: 'Séries',   desc: 'Albums / sous-thèmes affichés sur /audio' },
  { key: 'episodes',    label: 'Épisodes', desc: 'Fichiers audio associés à chaque série' },
  { key: 'media',       label: 'Médias',   desc: 'Hymnes, vidéos YouTube, PDF' },
  { key: 'coming_soon', label: 'Bientôt',  desc: 'Cartes « Bientôt disponible » affichées en bas de /audio' },
]

export default function AdminAudioPage() {
  const [tab, setTab] = useState<Tab>('series')

  return (
    <div>
      <div className="mb-6">
        <h1 className="adm-title">Contenu audio</h1>
        <p className="adm-subtitle">
          Ajoutez, modifiez ou supprimez les séries, épisodes et médias affichés sur la page /audio.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`adm-chip ${tab === t.key ? 'adm-chip-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs" style={{ color: 'var(--cc-text-disabled)' }}>
        {TABS.find((t) => t.key === tab)?.desc}
      </p>

      {tab === 'series'      && <SeriesManager />}
      {tab === 'episodes'    && <EpisodesManager />}
      {tab === 'media'       && <MediaManager />}
      {tab === 'coming_soon' && <ComingSoonManager />}
    </div>
  )
}
