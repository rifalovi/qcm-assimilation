"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { audioEpisodes } from "@/data/audioEpisodes";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAudioSeries,
  fetchAudioEpisodes,
  fetchAudioMedia,
  type AudioSeriesRow,
  type AudioMediaRow,
} from "@/lib/audioContent";
import { useEffect, useMemo, useState } from "react";

// ─── Fallback statique ─────────────────────────────────────────────────────
// Tant que les épisodes ne sont pas encore en base, on dérive les compteurs
// depuis src/data/audioEpisodes.ts. Une fois `audio_episodes` rempli, Supabase
// prend le relais automatiquement.
const STATIC_COUNTS = (() => {
  const map = new Map<string, { count: number; seconds: number }>();
  for (const ep of audioEpisodes) {
    const cur = map.get(ep.subthemeKey) ?? { count: 0, seconds: 0 };
    cur.count += 1;
    cur.seconds += ep.durationTargetSeconds;
    map.set(ep.subthemeKey, cur);
  }
  return map;
})();

const THEME_ICON_FALLBACK: Record<string, string> = {
  Valeurs: "🇫🇷",
  Institutions: "🏛️",
  Histoire: "📜",
  Société: "👥",
};

// Catégories à venir (pas encore pilotées par Supabase)
const COMING_SOON = [
  {
    id: "podcasts",
    title: "Podcasts",
    description: "Interviews et témoignages de candidats naturalisés",
    icon: "🎙️",
    color: "from-rose-600/20 to-pink-600/10 border-rose-400/20",
    iconBg: "bg-rose-500/20 border-rose-400/20",
    count: "Bientôt",
  },
  {
    id: "conseils",
    title: "Conseils pratiques",
    description: "Préparer le jour J, gérer le stress, réussir l'oral",
    icon: "💡",
    color: "from-yellow-600/20 to-amber-600/10 border-yellow-400/20",
    iconBg: "bg-yellow-500/20 border-yellow-400/20",
    count: "Bientôt",
  },
  {
    id: "parcours",
    title: "Parcours guidés",
    description: "Programmes de révision sur 7, 14 ou 30 jours",
    icon: "🗺️",
    color: "from-cyan-600/20 to-sky-600/10 border-cyan-400/20",
    iconBg: "bg-cyan-500/20 border-cyan-400/20",
    count: "Bientôt",
  },
];

// ─── Composant Album Card ──────────────────────────────────────────────────
type Album = AudioSeriesRow & { episodeCount: number; totalMinutes: number };

function AlbumCard({
  album,
  isPremium,
  isFreemium,
  onUpgrade,
}: {
  album: Album;
  isPremium: boolean;
  isFreemium: boolean;
  onUpgrade: () => void;
}) {
  const router = useRouter();
  const locked = !isPremium && !isFreemium;

  const handleClick = () => {
    if (locked) { onUpgrade(); return; }
    router.push(`/audio/${encodeURIComponent(album.theme_key)}/${encodeURIComponent(album.subtheme_key)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-[0.98] ${album.accent_border ?? "border-white/10"}`}
    >
      {/* Image de couverture */}
      <div className="relative aspect-square w-full overflow-hidden">
        {album.image_url ? (
          <>
            <Image
              src={album.image_url}
              alt={album.subtheme_label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={album.image_url.startsWith("http")}
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${album.accent_gradient ?? ""} opacity-60`} />
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${album.accent_gradient ?? "from-slate-700 to-slate-800"}`}>
            <span className="text-5xl">{album.icon ?? THEME_ICON_FALLBACK[album.theme_key] ?? "🎧"}</span>
          </div>
        )}

        {/* Badge locked */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/20 px-4 py-2 text-center backdrop-blur-sm">
              <p className="text-lg">🔒</p>
              <p className="text-xs font-bold text-amber-300">Premium</p>
            </div>
          </div>
        )}

        {/* Badge freemium */}
        {isFreemium && !isPremium && (
          <div className="absolute right-2 top-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-emerald-300">2 gratuits</p>
          </div>
        )}

        {/* Play overlay on hover */}
        {!locked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <svg width="20" height="20" viewBox="0 0 14 14" fill="#0f172a">
                <path d="M3 1.5l10 5.5-10 5.5V1.5z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="bg-slate-900/95 px-3 py-3">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${album.accent_text ?? "text-slate-400"}`}>
          {album.theme_label}
        </p>
        <p className="mt-0.5 text-sm font-bold leading-tight text-white line-clamp-2">
          {album.subtheme_label}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {album.episodeCount} épisodes • ~{album.totalMinutes} min
        </p>
      </div>
    </button>
  );
}

// ─── Composant Coming Soon Card ────────────────────────────────────────────
function ComingSoonCard({ item }: { item: typeof COMING_SOON[0] }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-br ${item.color} opacity-70`}>
      <div className="aspect-square w-full flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${item.iconBg} text-3xl`}>
          {item.icon}
        </div>
      </div>
      <div className="bg-slate-900/95 px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">{item.title}</p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {item.count}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-slate-500 line-clamp-2">{item.description}</p>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function AudioLibraryPage() {
  const router = useRouter();
  const { role } = useUser();
  const isPremium = ['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role);
  const isFreemium = role === "freemium";
  const isAnonymous = role === "anonymous" || !role;

  const [showInfo, setShowInfo] = useState(false);

  // Données chargées depuis Supabase
  const [seriesRows, setSeriesRows] = useState<AudioSeriesRow[] | null>(null);
  const [episodeCounts, setEpisodeCounts] = useState<Map<string, { count: number; seconds: number }>>(new Map());
  const [mediaRows, setMediaRows] = useState<AudioMediaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = createClient();
      const [series, episodes, media] = await Promise.all([
        fetchAudioSeries(sb),
        fetchAudioEpisodes(sb),
        fetchAudioMedia(sb),
      ]);
      if (cancelled) return;

      // Comptage par series_id depuis audio_episodes
      const counts = new Map<string, { count: number; seconds: number }>();
      for (const ep of episodes) {
        if (!ep.series_id) continue;
        const cur = counts.get(ep.series_id) ?? { count: 0, seconds: 0 };
        cur.count += 1;
        cur.seconds += ep.duration_target_seconds ?? 0;
        counts.set(ep.series_id, cur);
      }

      setSeriesRows(series);
      setEpisodeCounts(counts);
      setMediaRows(media);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { router.push("/pricing"); return; }
      window.location.href = url;
    } catch { router.push("/pricing"); }
  };

  // Fusion Supabase + fallback statique pour les compteurs d'épisodes
  const albums = useMemo<Album[]>(() => {
    if (!seriesRows) return [];
    return seriesRows.map((s) => {
      const fromDb = episodeCounts.get(s.id);
      if (fromDb && fromDb.count > 0) {
        return {
          ...s,
          episodeCount: fromDb.count,
          totalMinutes: Math.round(fromDb.seconds / 60),
        };
      }
      // Fallback : on dérive depuis src/data/audioEpisodes.ts
      const fallback = STATIC_COUNTS.get(s.subtheme_key) ?? { count: 0, seconds: 0 };
      return {
        ...s,
        episodeCount: fallback.count,
        totalMinutes: Math.round(fallback.seconds / 60),
      };
    });
  }, [seriesRows, episodeCounts]);

  const featuredAlbum = useMemo<Album | null>(
    () => albums.find((a) => a.featured) ?? albums[0] ?? null,
    [albums]
  );

  const hymnes = useMemo(
    () => mediaRows.filter((m) => m.section === "hymnes"),
    [mediaRows]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:px-8">
      <div className="space-y-8">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-blue-600"/><div className="flex-1 bg-white"/><div className="flex-1 bg-red-600"/>
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"/>
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-emerald-400/8 blur-3xl"/>

          <div className="relative px-5 py-7 sm:px-8 sm:py-9 text-center">
            {/* Bouton retour */}
            <div className="absolute left-5 top-5 sm:left-8">
              <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Retour
              </button>
            </div>

            <div className="mb-3 inline-flex items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              🎧 Bibliothèque audio
            </div>
            <h1 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              Préparez-vous à l&apos;oral
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
              Épisodes guidés • Voix naturelle • Format entretien réel
            </p>

            {/* Badge rôle */}
            <div className="mt-3 flex justify-center">
              {isAnonymous && <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-300">👤 Sans compte — créez un compte gratuit</span>}
              {isFreemium && <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">✨ Freemium — 2 épisodes gratuits par thème</span>}
              {isPremium && <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">👑 Premium — accès complet</span>}
            </div>

            {/* CTA anonymous */}
            {isAnonymous && (
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button onClick={() => router.push("/register")} className="inline-flex items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-105">
                  Créer un compte gratuit
                </button>
                <button onClick={() => router.push("/login")} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                  Se connecter
                </button>
              </div>
            )}

            {/* CTA freemium upgrade */}
            {isFreemium && (
              <button onClick={handleUpgrade} className="mt-4 inline-flex items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-105">
                👑 Débloquer les 100 épisodes
              </button>
            )}
          </div>
        </section>

        {/* ── HERO BANNER NETFLIX ────────────────────────────────────── */}
        {!isAnonymous && featuredAlbum && (
          <section
            className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_25px_70px_rgba(2,8,23,0.6)]"
            style={{ minHeight: 320 }}
          >
            {/* Image de fond */}
            <div className="absolute inset-0">
              {featuredAlbum.image_url && (
                <Image
                  src={featuredAlbum.image_url}
                  alt={featuredAlbum.subtheme_label}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={featuredAlbum.image_url.startsWith("http")}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>

            {/* Contenu */}
            <div className="relative flex h-full min-h-[320px] flex-col justify-end px-6 py-8 sm:px-10 sm:py-10 lg:justify-center">
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-300 backdrop-blur-sm">
                  ⭐ En vedette
                </span>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  {featuredAlbum.subtheme_label}
                </h2>
                {featuredAlbum.description && (
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
                    {featuredAlbum.description}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-slate-400">
                  <span>{featuredAlbum.episodeCount} épisodes</span>
                  <span>•</span>
                  <span>~{featuredAlbum.totalMinutes} min</span>
                  <span>•</span>
                  <span className="text-emerald-400">Disponible</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/audio/${encodeURIComponent(featuredAlbum.theme_key)}/${encodeURIComponent(featuredAlbum.subtheme_key)}`)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.2)] transition hover:bg-slate-100 active:scale-95"
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
                    Écouter maintenant
                  </button>
                  <button
                    onClick={() => setShowInfo(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    + Infos
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── THÉMATIQUES ─────────────────────────────────────────────── */}
        {!isAnonymous && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">🎓 Thématiques</h2>
                <p className="mt-0.5 text-xs text-slate-500">Préparation civique • Entretien de naturalisation</p>
              </div>
              {!loading && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                  {albums.length} séries
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-[1.5rem] border border-white/10 bg-slate-900/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    isPremium={isPremium}
                    isFreemium={isFreemium}
                    onUpgrade={handleUpgrade}
                  />
                ))}
              </div>
            )}
          </section>
        )}


        {/* ── HYMNES & CHANTS ─────────────────────────────────────────── */}
        {hymnes.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">🎵 Hymnes & Chants</h2>
                <p className="mt-0.5 text-xs text-slate-500">Écouter et mémoriser les symboles sonores de la République</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hymnes.map((m) => (
                <MediaCard key={m.id} media={m} />
              ))}
            </div>
          </section>
        )}
        {isAnonymous && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-white">🎓 Thématiques</h2>
              <p className="mt-0.5 text-xs text-slate-500">Créez un compte pour accéder aux épisodes</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {albums.map((album) => (
                <div key={album.id} className={`relative overflow-hidden rounded-[1.5rem] border ${album.accent_border ?? "border-white/10"} opacity-50`}>
                  <div className="relative aspect-square w-full overflow-hidden">
                    {album.image_url ? (
                      <>
                        <Image
                          src={album.image_url}
                          alt={album.subtheme_label}
                          fill
                          className="object-cover"
                          unoptimized={album.image_url.startsWith("http")}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-b ${album.accent_gradient ?? ""}`} />
                      </>
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${album.accent_gradient ?? "from-slate-700 to-slate-800"}`}>
                        <span className="text-5xl">{album.icon ?? THEME_ICON_FALLBACK[album.theme_key] ?? "🎧"}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <span className="text-3xl">🔒</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/95 px-3 py-3">
                    <p className="text-sm font-bold text-white">{album.subtheme_label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{album.episodeCount} épisodes</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BIENTÔT DISPONIBLE ───────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-white">🚀 Bientôt disponible</h2>
            <p className="mt-0.5 text-xs text-slate-500">De nouvelles collections arrivent prochainement</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {COMING_SOON.map((item) => (
              <ComingSoonCard key={item.id} item={item} />
            ))}
          </div>
        </section>

      </div>
      {/* ── MODAL INFOS ─────────────────────────────────────────────── */}
      {showInfo && featuredAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
            <div className="relative h-48 overflow-hidden">
              {featuredAlbum.image_url && (
                <Image
                  src={featuredAlbum.image_url}
                  alt=""
                  fill
                  className="object-cover opacity-60"
                  unoptimized={featuredAlbum.image_url.startsWith("http")}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button onClick={() => setShowInfo(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70">✕</button>
            </div>
            <div className="px-6 pb-6">
              <span className={`inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${featuredAlbum.accent_text ?? "text-blue-300"}`}>
                {featuredAlbum.theme_label}
              </span>
              <h3 className="mt-2 text-xl font-extrabold text-white">{featuredAlbum.subtheme_label}</h3>
              {featuredAlbum.description && (
                <p className="mt-3 text-sm leading-6 text-slate-300">{featuredAlbum.description}</p>
              )}
              <div className="mt-3 flex gap-4 text-xs text-slate-400">
                <span>🎙️ {featuredAlbum.episodeCount} épisodes</span>
                <span>⏱️ ~{featuredAlbum.totalMinutes} min</span>
                <span>🎧 Voix naturelle</span>
              </div>
              <button
                onClick={() => {
                  setShowInfo(false);
                  router.push(`/audio/${encodeURIComponent(featuredAlbum.theme_key)}/${encodeURIComponent(featuredAlbum.subtheme_key)}`);
                }}
                className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                ▶ Écouter maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Composant Media Card (hymnes / vidéos / PDF) ──────────────────────────
function MediaCard({ media }: { media: AudioMediaRow }) {
  const youtubeWatchUrl =
    media.media_type === "youtube"
      ? media.media_url.replace("/embed/", "/watch?v=").replace("www.youtube.com/v/", "www.youtube.com/watch?v=")
      : null;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-blue-400/20 bg-slate-900/95">
      <div className="relative aspect-video w-full overflow-hidden rounded-t-[1.5rem] bg-slate-950">
        {media.media_type === "youtube" && (
          <iframe
            src={media.media_url}
            title={media.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        )}
        {media.media_type === "video" && (
          <video src={media.media_url} controls className="h-full w-full object-cover">
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        )}
        {media.media_type === "audio" && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
            {media.thumbnail_url ? (
              <Image
                src={media.thumbnail_url}
                alt={media.title}
                width={96}
                height={96}
                className="rounded-2xl object-cover"
                unoptimized={media.thumbnail_url.startsWith("http")}
              />
            ) : (
              <span className="text-5xl">{media.icon ?? "🎵"}</span>
            )}
            <audio src={media.media_url} controls className="w-full" />
          </div>
        )}
        {media.media_type === "pdf" && (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl">{media.icon ?? "📄"}</span>
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${media.accent ?? "text-blue-300"}`}>
          {media.icon ?? "🎵"} {media.section === "hymnes" ? "Hymne national" : media.section === "podcasts" ? "Podcast" : "Média"}
        </p>
        <p className="mt-0.5 text-sm font-bold text-white">{media.title}</p>
        {media.author && (
          <p className="mt-0.5 text-[10px] text-slate-500">Publié par <span className="text-blue-400">{media.author}</span></p>
        )}
        {media.description && (
          <p className="mt-1 text-[11px] text-slate-500">{media.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {youtubeWatchUrl && (
            <a
              href={youtubeWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300 transition hover:bg-red-500/20"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
              Voir sur YouTube
            </a>
          )}
          {media.pdf_url && (
            <a
              href={media.pdf_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger le PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
