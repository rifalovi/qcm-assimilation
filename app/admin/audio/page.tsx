'use client'

import { useState } from 'react'
import SeriesManager from './SeriesManager'
import EpisodesManager from './EpisodesManager'
import MediaManager from './MediaManager'

type Tab = 'series' | 'episodes' | 'media'

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: 'series',   label: 'Séries',   desc: 'Albums / sous-thèmes affichés sur /audio' },
  { key: 'episodes', label: 'Épisodes', desc: 'Fichiers audio associés à chaque série' },
  { key: 'media',    label: 'Médias',   desc: 'Hymnes, vidéos YouTube, PDF' },
]

export default function AdminAudioPage() {
  const [tab, setTab] = useState<Tab>('series')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Contenu audio</h1>
        <p className="text-sm text-slate-400">
          Ajoutez, modifiez ou supprimez les séries, épisodes et médias affichés sur la page /audio.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-slate-500">
        {TABS.find((t) => t.key === tab)?.desc}
      </p>

      {tab === 'series'   && <SeriesManager />}
      {tab === 'episodes' && <EpisodesManager />}
      {tab === 'media'    && <MediaManager />}
    </div>
  )
}
