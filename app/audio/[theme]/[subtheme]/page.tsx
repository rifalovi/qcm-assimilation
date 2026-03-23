"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "../../../components/UserContext";
import { audioEpisodes, type AudioEpisode, type AudioThemeKey } from "@/data/audioEpisodes";

// ─── Config images par sous-thème ─────────────────────────────────────────
const SUBTHEME_IMAGES: Record<string, string> = {
  valeurs_republique: "/themes/valeurs_republique.jpg",
  droits_devoirs_citoyen: "/themes/droits_devoirs_citoyen.jpg",
  institutions: "/themes/institutions.jpg",
  histoire_geographie: "/themes/histoire_geographie.jpg",
  societe: "/themes/societe.jpg",
};

// Épisodes gratuits pour freemium
const FREE_EPISODE_IDS = new Set(["audio-001", "audio-021", "audio-031", "audio-041"]);

// ─── Méta visuelle par thème ───────────────────────────────────────────────
const THEME_META: Record<AudioThemeKey, { icon: string; accent: string; accentText: string; border: string; glow: string }> = {
  Valeurs: { icon: "🇫🇷", accent: "from-blue-500/20 via-indigo-500/10 to-sky-500/20", accentText: "text-blue-300", border: "border-blue-400/30", glow: "rgba(37,99,235,0.3)" },
  Institutions: { icon: "🏛️", accent: "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20", accentText: "text-violet-300", border: "border-violet-400/30", glow: "rgba(139,92,246,0.3)" },
  Histoire: { icon: "📜", accent: "from-amber-500/20 via-orange-500/10 to-yellow-500/20", accentText: "text-amber-300", border: "border-amber-400/30", glow: "rgba(245,158,11,0.3)" },
  Société: { icon: "👥", accent: "from-emerald-500/20 via-green-500/10 to-teal-500/20", accentText: "text-emerald-300", border: "border-emerald-400/30", glow: "rgba(16,185,129,0.3)" },
};

// ─── Utilitaire mm:ss ──────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Hook audio avec autoplay suivant ─────────────────────────────────────
function useAudioPlayer(episodes: AudioEpisode[], currentIdx: number, onNext: () => void, isPremium: boolean) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const episode = episodes[currentIdx];

  useEffect(() => {
    if (!episode || !isPremium) return;
    setPlaying(false); setProgress(0); setCurrentTime(0);
    setDuration(0); setLoaded(false); setAudioUrl(null); setFetchError(false);

    fetch(`/api/audio/${episode.episodeSlug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setAudioUrl(d.url);
        if (autoPlay) setTimeout(() => audioRef.current?.play().then(() => setPlaying(true)).catch(() => {}), 100);
      })
      .catch(() => setFetchError(true));
  }, [episode?.episodeSlug, isPremium]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); setAutoPlay(true); }
  }, [playing]);

  const skip = useCallback((s: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + s, audioRef.current.duration || 0));
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    if (autoPlay && currentIdx < episodes.length - 1) {
      setTimeout(() => onNext(), 500);
    }
  }, [autoPlay, currentIdx, episodes.length, onNext]);

  return { audioRef, playing, progress, setProgress, currentTime, setCurrentTime, duration, setDuration, loaded, setLoaded, audioUrl, fetchError, togglePlay, skip, handleEnded, autoPlay, setAutoPlay };
}

// ─── Player sticky ─────────────────────────────────────────────────────────
function StickyPlayer({
  episode,
  episodes,
  currentIdx,
  onPrev,
  onNext,
  isPremium,
  subthemeImage,
  meta,
}: {
  episode: AudioEpisode;
  episodes: AudioEpisode[];
  currentIdx: number;
  onPrev: () => void;
  onNext: () => void;
  isPremium: boolean;
  subthemeImage: string | null;
  meta: typeof THEME_META[AudioThemeKey];
}) {
  const { audioRef, playing, progress, setProgress, currentTime, setCurrentTime, duration, setDuration, loaded, setLoaded, audioUrl, fetchError, togglePlay, skip, handleEnded, autoPlay, setAutoPlay } = useAudioPlayer(episodes, currentIdx, onNext, isPremium);

  return (
    <div className={`sticky top-14 z-40 rounded-[1.5rem] border ${meta.border} bg-gradient-to-r ${meta.accent} backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl}
          onTimeUpdate={() => { if (!audioRef.current) return; setCurrentTime(audioRef.current.currentTime); setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100); }}
          onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setLoaded(true); }}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Pochette */}
        {subthemeImage ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
            <Image src={subthemeImage} alt={episode.subthemeLabel} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl">{meta.icon}</div>
        )}

        {/* Info épisode */}
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${meta.accentText}`}>
            Épisode {episode.episodeNumber}/{episodes.length}
          </p>
          <p className="truncate text-sm font-semibold text-white">{episode.episodeTitle}</p>
        </div>

        {/* Contrôles */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Précédent */}
          <button onClick={onPrev} disabled={currentIdx === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>

          {/* −10s */}
          <button onClick={() => skip(-10)} disabled={!loaded}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
            −10
          </button>

          {/* Play/Pause */}
          <button onClick={togglePlay} disabled={!audioUrl && !fetchError}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-white shadow-lg transition active:scale-95 disabled:opacity-40 ${meta.border} bg-gradient-to-br from-white/20 to-white/5`}>
            {fetchError ? (
              <span className="text-xs">⚠️</span>
            ) : !audioUrl ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="4" height="12" rx="1"/><rect x="8" y="1" width="4" height="12" rx="1"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
            )}
          </button>

          {/* +10s */}
          <button onClick={() => skip(10)} disabled={!loaded}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
            +10
          </button>

          {/* Suivant */}
          <button onClick={() => { setAutoPlay(true); onNext(); }} disabled={currentIdx === episodes.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zM16 6h2v12h-2z"/></svg>
          </button>

          {/* Auto-play toggle */}
          <button onClick={() => setAutoPlay((a) => !a)}
            className={`flex h-8 items-center gap-1 rounded-xl border px-2 text-[10px] font-bold transition ${autoPlay ? `${meta.border} ${meta.accentText} bg-white/10` : "border-white/10 bg-white/5 text-slate-500"}`}
            title="Lecture automatique">
            AUTO
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="px-4 pb-3">
        <input type="range" min={0} max={100} step={0.1} value={progress}
          onChange={(e) => {
            if (!audioRef.current) return;
            audioRef.current.currentTime = (Number(e.target.value) / 100) * (audioRef.current.duration || 0);
            setProgress(Number(e.target.value));
          }}
          disabled={!loaded}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white disabled:opacity-30"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/50">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function AudioSeriesPage() {
  const { theme, subtheme } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useUser();
  const isPremium = role === "premium";
  const isFreemium = role === "freemium";

  const themeKey = decodeURIComponent(theme as string) as AudioThemeKey;
  const subthemeKey = decodeURIComponent(subtheme as string);

  const episodes = useMemo(() => {
    return audioEpisodes
      .filter((ep) => ep.themeKey === themeKey && ep.subthemeKey === subthemeKey)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }, [themeKey, subthemeKey]);

  const [currentIdx, setCurrentIdx] = useState(0);

  // Sauvegarder la page courante
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("last_audio_page", window.location.pathname);
  }, []);

  // Ouvrir l'épisode demandé via ?episode=
  useEffect(() => {
    if (!episodes.length) return;
    const requested = Number(searchParams.get("episode"));
    const idx = Number.isFinite(requested) && requested > 0
      ? episodes.findIndex((ep) => ep.episodeNumber === requested)
      : -1;
    setCurrentIdx(idx >= 0 ? idx : 0);
  }, [episodes, searchParams]);

  const goNext = useCallback(() => setCurrentIdx((i) => Math.min(i + 1, episodes.length - 1)), [episodes.length]);
  const goPrev = useCallback(() => setCurrentIdx((i) => Math.max(i - 1, 0)), []);

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { router.push("/pricing"); return; }
      window.location.href = url;
    } catch { router.push("/pricing"); }
  };

  const meta = THEME_META[themeKey] ?? THEME_META.Valeurs;
  const subthemeImage = SUBTHEME_IMAGES[subthemeKey] ?? null;
  const currentEpisode = episodes[currentIdx];

  if (!episodes.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-400">Série introuvable.</p>
        <Link href="/audio" className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">← Retour</Link>
      </main>
    );
  }

  const { themeLabel, subthemeLabel } = episodes[0];
  const totalMinutes = Math.round(episodes.reduce((acc, ep) => acc + ep.durationTargetSeconds, 0) / 60);

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="space-y-4">

        {/* ── HEADER avec image ───────────────────────────────────────── */}
        <div className={`relative overflow-hidden rounded-[1.8rem] border ${meta.border} shadow-[0_20px_50px_rgba(2,8,23,0.4)]`}>
          {/* Image de fond */}
          {subthemeImage && (
            <div className="absolute inset-0">
              <Image src={subthemeImage} alt={subthemeLabel} fill className="object-cover opacity-20" />
              <div className={`absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900/95`} />
            </div>
          )}
          {!subthemeImage && <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent}`} />}

          <div className="relative px-5 py-5 sm:px-6">
            {/* Breadcrumb */}
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
              <button onClick={() => router.back()} className="inline-flex items-center gap-1 transition hover:text-white">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Retour
              </button>
              <span>/</span>
              <Link href="/audio" className="transition hover:text-white">Séries</Link>
              <span>/</span>
              <span className={meta.accentText}>{themeLabel}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Pochette */}
              {subthemeImage ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  <Image src={subthemeImage} alt={subthemeLabel} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-4xl">{meta.icon}</div>
              )}

              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-widest ${meta.accentText}`}>{themeLabel}</p>
                <h1 className="mt-1 text-xl font-extrabold leading-tight text-white sm:text-2xl">{subthemeLabel}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">{episodes.length} épisodes</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">~{totalMinutes} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PLAYER STICKY ───────────────────────────────────────────── */}
        {isPremium && currentEpisode && (
          <StickyPlayer
            episode={currentEpisode}
            episodes={episodes}
            currentIdx={currentIdx}
            onPrev={goPrev}
            onNext={goNext}
            isPremium={isPremium}
            subthemeImage={subthemeImage}
            meta={meta}
          />
        )}

        {/* ── LOCK PREMIUM ────────────────────────────────────────────── */}
        {!isPremium && !isFreemium && (
          <div className="rounded-[1.5rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-2xl">👑</div>
            <h3 className="text-lg font-extrabold text-white">Contenu Premium</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">Débloquez cette série pour écouter les {episodes.length} épisodes.</p>
            <button onClick={handleUpgrade} className="mt-4 inline-flex items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-105">
              Passer en Premium
            </button>
          </div>
        )}

        {/* ── BANNIÈRE FREEMIUM ────────────────────────────────────────── */}
        {isFreemium && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-300">✨ <span className="font-semibold text-white">Freemium</span> — 1 épisode gratuit. Débloquez tout.</p>
              <button onClick={handleUpgrade} className="shrink-0 rounded-xl border border-amber-400/20 bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-400">Premium</button>
            </div>
          </div>
        )}

        {/* ── LISTE DES ÉPISODES ───────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Épisodes</h2>
            <span className="text-xs text-slate-400">{isPremium ? "Cliquez pour écouter" : isFreemium ? "1 gratuit" : "Premium requis"}</span>
          </div>

          <div className="space-y-2">
            {episodes.map((ep, idx) => {
              const isFree = isFreemium && FREE_EPISODE_IDS.has(ep.id);
              const locked = !isPremium && !isFree;
              const isActive = currentIdx === idx && isPremium;

              return (
                <div
                  key={ep.id}
                  className={`rounded-xl border transition-all duration-200 ${
                    isActive
                      ? `${meta.border} bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]`
                      : isFree
                      ? "border-emerald-400/20 bg-emerald-500/5 hover:bg-emerald-500/8"
                      : locked
                      ? "border-white/5 bg-white/[0.02] opacity-60"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (locked) { handleUpgrade(); return; }
                      setCurrentIdx(idx);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") { if (locked) handleUpgrade(); else setCurrentIdx(idx); } }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  >
                    {/* Pochette mini */}
                    {subthemeImage ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                        <Image src={subthemeImage} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg">{meta.icon}</div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {String(ep.episodeNumber).padStart(2, "0")}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold leading-5 text-white">{ep.episodeTitle}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-500">{Math.round(ep.durationTargetSeconds / 60)}m</span>
                      {isActive ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.border} ${meta.accentText}`}>
                          ▶ En cours
                        </span>
                      ) : isFree ? (
                        <span className="text-xs text-emerald-400">✓</span>
                      ) : locked ? (
                        <span className="text-xs text-amber-400">🔒</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-slate-500">
                          <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── NAVIGATION ──────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Link href="/audio" className="flex-1 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
            ← Retour aux séries
          </Link>
          <button onClick={() => router.push("/scroll")} className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">
            🚀 Scroll
          </button>
        </div>

      </div>
    </main>
  );
}
