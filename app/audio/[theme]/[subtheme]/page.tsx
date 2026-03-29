"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "../../../components/UserContext";
import { audioEpisodes, type AudioEpisode, type AudioThemeKey } from "@/data/audioEpisodes";
import { trackEvent } from "@/lib/posthog";

const SUBTHEME_IMAGES: Record<string, string> = {
  valeurs_republique: "/themes/valeurs_republique.jpg",
  droits_devoirs_citoyen: "/themes/droits_devoirs_citoyen.jpg",
  institutions: "/themes/institutions.jpg",
  histoire_geographie: "/themes/histoire_geographie.jpg",
  societe: "/themes/societe.jpg",
  pourquoi_francais: "/themes/devenir_francais.jpg",
  quiz_audio: "/themes/quiz_audio.png",
};

const FREE_EPISODE_NUMBERS = new Set([1, 2]);

const THEME_META: Record<AudioThemeKey, { icon: string; accent: string; accentText: string; border: string; glow: string }> = {
  Valeurs:      { icon: "🇫🇷", accent: "from-blue-500/20 via-indigo-500/10 to-sky-500/20",       accentText: "text-blue-300",    border: "border-blue-400/30",    glow: "rgba(37,99,235,0.3)"   },
  Institutions: { icon: "🏛️", accent: "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20", accentText: "text-violet-300",  border: "border-violet-400/30",  glow: "rgba(139,92,246,0.3)"  },
  Histoire:     { icon: "📜", accent: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",    accentText: "text-amber-300",   border: "border-amber-400/30",   glow: "rgba(245,158,11,0.3)"  },
  Société:      { icon: "👥", accent: "from-emerald-500/20 via-green-500/10 to-teal-500/20",     accentText: "text-emerald-300", border: "border-emerald-400/30", glow: "rgba(16,185,129,0.3)"  },
  "Devenir français(e)": { icon: "🎖️", accent: "from-rose-500/20 via-red-500/10 to-pink-500/20", accentText: "text-rose-300",    border: "border-rose-400/30",    glow: "rgba(244,63,94,0.3)"   },
  "Quiz Audio":          { icon: "🎯", accent: "from-teal-500/20 via-cyan-500/10 to-emerald-500/20", accentText: "text-teal-300", border: "border-teal-400/30",    glow: "rgba(20,184,166,0.3)"  },
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Hook audio — Pattern Ping-Pong ──────────────────────────────────────────
//
// 🎓 POURQUOI LE PING-PONG ?
//
// Sur iOS, quand l'écran se verrouille, le JS de la WKWebView est suspendu.
// Un fetch() réseau ou un re-render React est impossible.
//
// MAIS : audio.play() sur un élément DÉJÀ CHARGÉ fonctionne même écran verrouillé,
// car le thread audio natif iOS reste actif indépendamment du JS.
//
// Solution : 2 éléments audio (A et B) qui alternent.
//   - A joue l'épisode courant
//   - B charge silencieusement l'épisode suivant (src + load, pas play)
//   - Quand A se termine : B.play() immédiat (déjà en mémoire, 0 fetch)
//   - Pendant que B joue : A charge l'épisode d'après
//
// Résultat : onended → play() = instantané, sans réseau, sans React.
//
// 🎓 QUEUE DE LECTURE
//
// playQueue = tableau ordonné des indices à jouer.
// null = mode normal (tous les épisodes dans l'ordre).
// [2, 5, 7] = sélection manuelle dans cet ordre.
// Permet à "Écouter la sélection" de fonctionner correctement.
//
function useAudioPlayer(
  episodes: AudioEpisode[],
  currentIdx: number,
  onNext: () => void,
  onPrev: () => void,
  isPremium: boolean,
  autoPlay: boolean,
  setAutoPlay: (v: boolean) => void,
  playQueue: number[] | null,   // null = tous les épisodes, sinon indices ordonnés
  playTrigger: number = 0
) {
  // ── Deux éléments audio persistants (ping-pong) ───────────────────────────
  const audioARef  = useRef<HTMLAudioElement | null>(null);
  const audioBRef  = useRef<HTMLAudioElement | null>(null);
  const activeRef  = useRef<"A" | "B">("A"); // lequel est en train de jouer

  const getActive   = () => activeRef.current === "A" ? audioARef.current : audioBRef.current;
  const getInactive = () => activeRef.current === "A" ? audioBRef.current : audioARef.current;
  const swapActive  = () => { activeRef.current = activeRef.current === "A" ? "B" : "A"; };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!audioARef.current) { audioARef.current = new Audio(); audioARef.current.preload = "auto"; }
    if (!audioBRef.current) { audioBRef.current = new Audio(); audioBRef.current.preload = "auto"; }
    return () => {
      [audioARef, audioBRef].forEach(ref => {
        if (ref.current) { ref.current.pause(); ref.current.src = ""; }
      });
    };
  }, []);

  // ── Refs toujours à jour ──────────────────────────────────────────────────
  const autoPlayRef   = useRef(autoPlay);
  const onNextRef     = useRef(onNext);
  const onPrevRef     = useRef(onPrev);
  const currentIdxRef = useRef(currentIdx);
  const episodesRef   = useRef(episodes);
  const playQueueRef  = useRef(playQueue);
  const shouldPlayOnLoad = useRef(false);
  const loadedSlugMap    = useRef<Map<HTMLAudioElement, string>>(new Map()); // slug chargé par élément

  const setAutoPlayImmediate = useCallback((v: boolean) => {
    autoPlayRef.current = v;
    setAutoPlay(v);
  }, [setAutoPlay]);

  useEffect(() => { autoPlayRef.current   = autoPlay;   }, [autoPlay]);
  useEffect(() => { onNextRef.current     = onNext;     }, [onNext]);
  useEffect(() => { onPrevRef.current     = onPrev;     }, [onPrev]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { episodesRef.current   = episodes;   }, [episodes]);
  useEffect(() => { playQueueRef.current  = playQueue;  }, [playQueue]);

  const [playing,     setPlaying]    = useState(false);
  const [progress,    setProgress]   = useState(0);
  const [currentTime, setCurrentTime]= useState(0);
  const [duration,    setDuration]   = useState(0);
  const [loaded,      setLoaded]     = useState(false);
  const [fetchError,  setFetchError] = useState(false);

  const episode = episodes[currentIdx];

  // ── Trouver l'index suivant selon la queue ────────────────────────────────
  // 🎓 Si playQueue est défini, on cherche la position courante dans la queue
  // et on retourne le suivant. Sinon, simple currentIdx + 1.
  const getNextIdx = useCallback((fromIdx: number): number | null => {
    const queue = playQueueRef.current;
    if (queue && queue.length > 0) {
      const pos = queue.indexOf(fromIdx);
      if (pos === -1 || pos >= queue.length - 1) return null;
      return queue[pos + 1];
    }
    const nextIdx = fromIdx + 1;
    return nextIdx < episodesRef.current.length ? nextIdx : null;
  }, []);

  // ── Pré-charger silencieusement sur l'élément inactif ────────────────────
  // 🎓 C'est le cœur du ping-pong. On charge l'URL sans appeler play().
  // L'élément est prêt en mémoire pour un play() immédiat dans handleEnded.
  const preloadNext = useCallback((url: string, slug?: string) => {
    const inactive = getInactive();
    if (!inactive) return;
    inactive.onended          = null;
    inactive.ontimeupdate     = null;
    inactive.onloadedmetadata = null;
    inactive.onplay           = null;
    inactive.onpause          = null;
    if (slug) loadedSlugMap.current.set(inactive, slug);
    inactive.src = url;
    inactive.load(); // charge sans jouer
  }, []);

  // Ref vers preloadNext pour usage dans handleEnded
  const preloadNextRef = useRef(preloadNext);
  useEffect(() => { preloadNextRef.current = preloadNext; }, [preloadNext]);

  // ── Pré-fetch + pré-chargement du prochain épisode ───────────────────────
  const nextUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const nextIdx = getNextIdx(currentIdx);
    if (!isPremium || nextIdx === null) { nextUrlRef.current = null; return; }
    const nextEp = episodesRef.current[nextIdx];
    if (!nextEp) return;
    fetch(`/api/audio/${nextEp.episodeSlug}`)
      .then(r => r.json())
      .then(d => {
        nextUrlRef.current = d.url;
        // Pré-charger immédiatement sur l'élément inactif
        preloadNextRef.current(d.url);
      })
      .catch(() => { nextUrlRef.current = null; });
  }, [currentIdx, isPremium, episodes, getNextIdx]);

  // ── attachListeners : configure les listeners sur l'élément actif ─────────
  const attachListeners = useCallback((audio: HTMLAudioElement) => {
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };
    audio.onloadedmetadata = () => {
      setDuration(audio.duration ?? 0);
      setLoaded(true);
    };
    audio.onplay  = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = handleEndedRef.current;
  }, []);

  const attachListenersRef = useRef(attachListeners);
  useEffect(() => { attachListenersRef.current = attachListeners; }, [attachListeners]);

  // ── handleEnded : swap ping-pong + play immédiat ──────────────────────────
  // 🎓 Cette fonction s'exécute quand une piste se termine.
  // Sur iOS écran verrouillé :
  //   - Pas de fetch (l'URL est déjà dans l'élément inactif)
  //   - Pas de setState bloquant
  //   - Juste : swapActive() + inactive.play() = IMMÉDIAT
  const handleEnded = useCallback(() => {
    setPlaying(false);
    if (!autoPlayRef.current) return;

    const nextIdx = getNextIdx(currentIdxRef.current);
    if (nextIdx === null) return;

    // 🎓 Capturer les deux refs AVANT tout swap
    const toPlay    = getInactive(); // contient le prochain épisode préchargé
    const toPreload = getActive();   // sera libéré après le swap pour preload

    const nextEp     = episodesRef.current[nextIdx];
    const nextNextIdx = getNextIdx(nextIdx);
    const nextNextEp  = nextNextIdx !== null ? episodesRef.current[nextNextIdx] : null;

    // ── Fonction commune : joue toPlay, preload sur toPreload ────────────
    const executeSwap = () => {
      swapActive();
      attachListenersRef.current(toPlay!);

      setProgress(0);
      setCurrentTime(0);
      setLoaded(false);

      toPlay!.play()
        .then(() => {
          setPlaying(true);
          setDuration(toPlay!.duration ?? 0);
          setLoaded(true);
        })
        .catch(() => {});

      setTimeout(() => onNextRef.current(), 100);

      // Preload épisode N+2 sur l'ancien actif (maintenant inactif)
      if (nextNextEp && toPreload) {
        toPreload.onended          = null;
        toPreload.ontimeupdate     = null;
        toPreload.onloadedmetadata = null;
        toPreload.onplay           = null;
        toPreload.onpause          = null;
        fetch(`/api/audio/${nextNextEp.episodeSlug}`)
          .then(r => r.json())
          .then(d => {
            loadedSlugMap.current.set(toPreload, nextNextEp.episodeSlug);
            toPreload.src = d.url;
            toPreload.load();
          })
          .catch(() => {});
      }
    };

    // ── Cas nominal : toPlay est déjà chargé ─────────────────────────────
    const slug = loadedSlugMap.current.get(toPlay!);
    const isPreloaded = toPlay && toPlay.src && slug === nextEp?.episodeSlug;

    if (isPreloaded && toPlay!.readyState >= 2) {
      executeSwap();
    } else {
      // ── Fallback : fetch à la volée ───────────────────────────────────
      if (!nextEp) return;
      fetch(`/api/audio/${nextEp.episodeSlug}`)
        .then(r => r.json())
        .then(d => {
          if (!toPlay) return;
          toPlay.onended          = null;
          toPlay.ontimeupdate     = null;
          toPlay.onloadedmetadata = null;
          toPlay.onplay           = null;
          toPlay.onpause          = null;
          loadedSlugMap.current.set(toPlay, nextEp.episodeSlug);
          toPlay.src = d.url;
          toPlay.load();
          toPlay.oncanplay = () => {
            toPlay.oncanplay = null;
            executeSwap();
          };
        })
        .catch(() => {});
    }
  }, [getNextIdx, attachListeners]);

  const handleEndedRef = useRef(handleEnded);
  useEffect(() => {
    handleEndedRef.current = handleEnded;
    const active = getActive();
    if (active) active.onended = handleEnded;
  }, [handleEnded]);

  // ── Chargement épisode courant ────────────────────────────────────────────
  useEffect(() => {
    const isFreeEpisode = FREE_EPISODE_NUMBERS.has(episode?.episodeNumber ?? 0);
    if (!episode || (!isPremium && !isFreeEpisode)) return;

    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setLoaded(false);
    setFetchError(false);

    shouldPlayOnLoad.current = autoPlayRef.current;

    // Si l'élément actif contient déjà cet épisode (swap ping-pong), ne pas recharger
    const activeAudio = getActive();
    if (activeAudio && loadedSlugMap.current.get(activeAudio) === episode.episodeSlug) {
      setLoaded(true);
      return;
    }

    fetch(`/api/audio/${episode.episodeSlug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        // 🎓 Garantir que l'élément audio est initialisé avant d'agir
        // (le useEffect de création peut être plus lent que le fetch)
        if (!audioARef.current) { audioARef.current = new Audio(); audioARef.current.preload = "auto"; }
        if (!audioBRef.current) { audioBRef.current = new Audio(); audioBRef.current.preload = "auto"; }
        const audio = getActive();
        if (!audio) return;

        audio.onended          = null;
        audio.ontimeupdate     = null;
        audio.onloadedmetadata = null;
        audio.onplay           = null;
        audio.onpause          = null;

        loadedSlugMap.current.set(audio, episode.episodeSlug);
        audio.src = d.url;
        audio.load();

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / (audio.duration || 1)) * 100);
        };
        audio.onloadedmetadata = () => {
          setDuration(audio.duration ?? 0);
          setLoaded(true);
          if (shouldPlayOnLoad.current) {
            audio.play().then(() => setPlaying(true)).catch(() => {});
          }
        };
        audio.onplay  = () => setPlaying(true);
        audio.onpause = () => setPlaying(false);
        audio.onended = handleEndedRef.current;
      })
      .catch(() => setFetchError(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode?.episodeSlug, isPremium, playTrigger]);

  const togglePlay = useCallback(() => {
    const audio = getActive();
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
        trackEvent("audio_played", {
          episode_slug:   episode?.episodeSlug,
          episode_title:  episode?.episodeTitle,
          subtheme:       episode?.subthemeKey,
          episode_number: episode?.episodeNumber,
        });
      }).catch(() => {});
      setAutoPlayImmediate(true);
    }
  }, [playing, setAutoPlayImmediate, episode]);

  const skip = useCallback((s: number) => {
    const audio = getActive();
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + s, audio.duration || 0));
  }, []);

  // ── Media Session API ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPremium || !episode || typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const artwork = episode.subthemeKey
      ? [{ src: `/themes/${episode.subthemeKey}.jpg`, sizes: "512x512", type: "image/jpeg" }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  episode.episodeTitle,
      artist: "Cap Citoyen",
      album:  episode.subthemeLabel,
      artwork,
    });

    navigator.mediaSession.setActionHandler("play", () => {
      getActive()?.play().then(() => setPlaying(true)).catch(() => {});
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      getActive()?.pause();
      setPlaying(false);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (currentIdxRef.current > 0) onPrevRef.current();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      // Même logique que handleEnded mais déclenchée manuellement
      handleEndedRef.current();
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      const a = getActive();
      if (a) a.currentTime = Math.max(0, a.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      const a = getActive();
      if (a) a.currentTime = Math.min(a.duration || 0, a.currentTime + 10);
    });

    return () => {
      (["play","pause","previoustrack","nexttrack","seekbackward","seekforward"] as MediaSessionAction[])
        .forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch {} });
    };
  }, [episode, isPremium]);

  useEffect(() => {
    if (!isPremium || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing, isPremium]);

  // Exposer audioRef pour la barre de progression (on expose l'actif)
  const audioRef = { current: getActive() };

  return {
    audioRef, playing, setPlaying, shouldPlayOnLoad,
    progress, setProgress, currentTime, setCurrentTime,
    duration, setDuration, loaded, setLoaded,
    fetchError, togglePlay, skip, handleEnded, setAutoPlayImmediate,
  };
}

// ─── StickyPlayer ────────────────────────────────────────────────────────────
function StickyPlayer({
  episode, episodes, currentIdx, onPrev, onNext, isPremium,
  subthemeImage, meta, autoPlay, setAutoPlay,
  selectedEpisodes, repeatMode, setRepeatMode,
  playTrigger, playQueue, onReady,
}: {
  episode: AudioEpisode; episodes: AudioEpisode[]; currentIdx: number;
  onPrev: () => void; onNext: () => void; isPremium: boolean;
  subthemeImage: string | null; meta: typeof THEME_META[AudioThemeKey];
  autoPlay: boolean; setAutoPlay: (v: boolean) => void;
  selectedEpisodes: Set<number>; repeatMode: "none" | "one" | "queue";
  setRepeatMode: (v: "none" | "one" | "queue") => void;
  playTrigger: number;
  playQueue: number[] | null;
  onReady: (play: () => void, setAutoPlayImmediate: (v: boolean) => void) => void;
}) {
  const {
    audioRef, playing, setPlaying, shouldPlayOnLoad,
    progress, setProgress, currentTime, setCurrentTime,
    duration, setDuration, loaded, setLoaded,
    fetchError, togglePlay, skip, handleEnded, setAutoPlayImmediate,
  } = useAudioPlayer(episodes, currentIdx, onNext, onPrev, isPremium, autoPlay, setAutoPlay, playQueue, playTrigger);

  useEffect(() => {
    onReady(togglePlay, setAutoPlayImmediate);
  }, [togglePlay, onReady, setAutoPlayImmediate]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(repeatMode === "none" ? "one" : repeatMode === "one" ? "queue" : "none");
  }, [repeatMode, setRepeatMode]);

  const isLoading = !loaded && !fetchError;

  return (
    <div className={`sticky top-14 z-40 rounded-[1.5rem] border ${meta.border} bg-gradient-to-r ${meta.accent} backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}>
      {/* Ligne 1 : pochette + info + play */}
      <div className="flex items-center gap-3 px-4 pt-3">
        {subthemeImage ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
            <Image src={subthemeImage} alt={episode.subthemeLabel} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl">{meta.icon}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${meta.accentText}`}>
            Épisode {episode.episodeNumber}/{episodes.length}
            {repeatMode === "one" && <span className="ml-1 opacity-70">· 🔂</span>}
            {repeatMode === "queue" && selectedEpisodes.size > 0 && <span className="ml-1 opacity-70">· {selectedEpisodes.size} sélect.</span>}
          </p>
          <p className="truncate text-sm font-semibold text-white">{episode.episodeTitle}</p>
        </div>
        <button
          onClick={togglePlay}
          disabled={isLoading || fetchError}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-white shadow-lg transition active:scale-95 disabled:opacity-40 ${meta.border} bg-gradient-to-br from-white/20 to-white/5`}
        >
          {fetchError
            ? <span className="text-xs">⚠️</span>
            : isLoading
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : playing
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="4" height="12" rx="1"/><rect x="8" y="1" width="4" height="12" rx="1"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
          }
        </button>
      </div>

      {/* Ligne 2 : contrôles secondaires */}
      <div className="flex items-center justify-between gap-1 px-4 py-2">
        <button onClick={onPrev} disabled={currentIdx === 0}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button onClick={() => skip(-10)} disabled={!loaded}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
          −10
        </button>
        <button onClick={() => skip(10)} disabled={!loaded}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
          +10
        </button>
        <button onClick={() => { setAutoPlayImmediate(true); onNext(); }} disabled={currentIdx === episodes.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zM16 6h2v12h-2z"/></svg>
        </button>
        <button onClick={() => setAutoPlayImmediate(!autoPlay)}
          className={`flex h-8 items-center gap-1 rounded-xl border px-2 text-[10px] font-bold transition ${autoPlay ? `${meta.border} ${meta.accentText} bg-white/10` : "border-white/10 bg-white/5 text-slate-500"}`}>
          AUTO
        </button>
        <button onClick={cycleRepeat}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${repeatMode !== "none" ? `${meta.border} ${meta.accentText} bg-white/10` : "border-white/10 bg-white/5 text-slate-500"}`}
          title={repeatMode === "none" ? "Pas de répétition" : repeatMode === "one" ? "Répéter cet épisode" : "Boucler la sélection"}>
          {repeatMode === "one" ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              <text x="9.5" y="15.5" fontSize="5.5" fill="currentColor" stroke="none" fontWeight="bold">1</text>
            </svg>
          ) : repeatMode === "queue" ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
              <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Barre de progression */}
      <div className="px-4 pb-3">
        <input type="range" min={0} max={100} step={0.1} value={progress}
          onChange={(e) => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = (Number(e.target.value) / 100) * (audio.duration || 0);
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

// ─── Page principale ─────────────────────────────────────────────────────────
export default function AudioSeriesPage() {
  const { theme, subtheme } = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { role }     = useUser();
  const isPremium    = (role === "premium" || role === "elite");
  const isFreemium   = role === "freemium";

  const themeKey    = decodeURIComponent(theme as string) as AudioThemeKey;
  const subthemeKey = decodeURIComponent(subtheme as string);

  const episodes = useMemo(() =>
    audioEpisodes
      .filter((ep) => ep.themeKey === themeKey && ep.subthemeKey === subthemeKey)
      .sort((a, b) => a.episodeNumber - b.episodeNumber),
    [themeKey, subthemeKey]
  );

  const [currentIdx,       setCurrentIdx]       = useState(0);
  const [autoPlay,         setAutoPlay]          = useState(false);
  const [selectedEpisodes, setSelectedEpisodes]  = useState<Set<number>>(new Set());
  const [repeatMode,       setRepeatMode]        = useState<"none" | "one" | "queue">("none");
  const [isSelectionMode,  setIsSelectionMode]   = useState(false);
  const [playTrigger,      setPlayTrigger]       = useState(0);
  // 🎓 playQueue : null = tous les épisodes, sinon tableau d'indices ordonnés
  // Transmis au hook pour que handleEnded sache quoi jouer ensuite
  const [playQueue,        setPlayQueue]         = useState<number[] | null>(null);

  const playerPlayRef        = useRef<(() => void) | null>(null);
  const playerSetAutoPlayRef = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("last_audio_page", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!episodes.length) return;
    const requested = Number(searchParams.get("episode"));
    const idx = Number.isFinite(requested) && requested > 0
      ? episodes.findIndex((ep) => ep.episodeNumber === requested) : -1;
    setCurrentIdx(idx >= 0 ? idx : 0);
  }, [episodes, searchParams]);

  useEffect(() => {
    if (!isFreemium || !episodes.length) return;
    const firstFreeIdx = episodes.findIndex(ep => FREE_EPISODE_NUMBERS.has(ep.episodeNumber));
    if (firstFreeIdx >= 0) setCurrentIdx(firstFreeIdx);
  }, [isFreemium, episodes]);

  // goNext tient compte de la playQueue
  const goNext = useCallback(() => {
    if (repeatMode === "one") return;
    if (playQueue && playQueue.length > 0) {
      const pos = playQueue.indexOf(currentIdx);
      if (pos >= 0 && pos < playQueue.length - 1) {
        setCurrentIdx(playQueue[pos + 1]);
      } else {
        // Fin de la queue — arrêt
        setAutoPlay(false);
      }
      return;
    }
    setCurrentIdx(i => Math.min(i + 1, episodes.length - 1));
  }, [repeatMode, playQueue, currentIdx, episodes.length, setAutoPlay]);

  const goPrev = useCallback(() => setCurrentIdx(i => Math.max(i - 1, 0)), []);

  const playAll = useCallback(() => {
    setSelectedEpisodes(new Set());
    setRepeatMode("none");
    setPlayQueue(null); // tous les épisodes
    playerSetAutoPlayRef.current?.(true);
    setAutoPlay(true);
    if (currentIdx === 0) {
      setTimeout(() => playerPlayRef.current?.(), 150);
    } else {
      setCurrentIdx(0);
    }
  }, [currentIdx]);

  const toggleEpisodeSelection = useCallback((idx: number) => {
    setSelectedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const playSelection = useCallback(() => {
    if (selectedEpisodes.size === 0) return;
    const sorted = Array.from(selectedEpisodes).sort((a, b) => a - b);
    // 🎓 On passe la queue ordonnée au hook — handleEnded saura exactement
    // quel épisode jouer après chaque piste, même écran verrouillé
    setPlayQueue(sorted);
    setRepeatMode("none");
    setCurrentIdx(sorted[0]);
    playerSetAutoPlayRef.current?.(true);
    setAutoPlay(true);
    setIsSelectionMode(false);
  }, [selectedEpisodes]);

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { router.push("/pricing"); return; }
      window.location.href = url;
    } catch { router.push("/pricing"); }
  };

  const meta = THEME_META[themeKey] ?? THEME_META.Valeurs;

  const allSeries = useMemo(() => {
    const seen = new Set<string>();
    return audioEpisodes.filter(ep => {
      const key = ep.themeKey + '|' + ep.subthemeKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const currentSeriesIndex = allSeries.findIndex(ep => ep.themeKey === themeKey && ep.subthemeKey === subthemeKey);
  const nextSeries    = allSeries[(currentSeriesIndex + 1) % allSeries.length];
  const nextSeriesUrl = nextSeries ? `/audio/${encodeURIComponent(nextSeries.themeKey)}/${encodeURIComponent(nextSeries.subthemeKey)}` : '/audio';
  const isDevenir      = themeKey === "Devenir français(e)";
  const subthemeImage  = SUBTHEME_IMAGES[subthemeKey] ?? null;
  const currentEpisode = episodes[currentIdx];
  const isPlayerVisible = isPremium || (isFreemium && FREE_EPISODE_NUMBERS.has(currentEpisode?.episodeNumber ?? 0));

  if (!episodes.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-400">Série introuvable.</p>
        <Link href="/audio" className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">← Retour</Link>
      </main>
    );
  }

  const { themeLabel, subthemeLabel } = episodes[0];
  const totalMinutes    = Math.round(episodes.reduce((acc, ep) => acc + ep.durationTargetSeconds, 0) / 60);
  const scrollReviseUrl = `/scroll?theme=${encodeURIComponent(themeKey)}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="fixed top-16 left-3 z-50">
        <Link href="/audio" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-md transition hover:bg-white/10 hover:text-white">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Séries
        </Link>
      </div>
      <div className="space-y-4">

        {/* ── HEADER ── */}
        <div className={`relative overflow-hidden rounded-[1.8rem] border ${meta.border} shadow-[0_20px_50px_rgba(2,8,23,0.4)]`}>
          {subthemeImage && (
            <div className="absolute inset-0">
              <Image src={subthemeImage} alt={subthemeLabel} fill className="object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900/95" />
            </div>
          )}
          {!subthemeImage && <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent}`} />}

          <div className="relative px-5 py-5 sm:px-6">
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
              {subthemeImage ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  <Image src={subthemeImage} alt={subthemeLabel} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-4xl">{meta.icon}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold uppercase tracking-widest ${meta.accentText}`}>{themeLabel}</p>
                <h1 className="mt-1 text-xl font-extrabold leading-tight text-white sm:text-2xl">{subthemeLabel}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">{episodes.length} épisodes</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">~{totalMinutes} min</span>
                </div>
              </div>
            </div>

            {isPremium && (
              <div className="mt-4 flex gap-2">
                <button onClick={playAll}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-sm font-bold transition hover:brightness-110 active:scale-95 ${
                    autoPlay && !playQueue
                      ? "border-blue-400/50 bg-blue-500/20 text-blue-200 shadow-[0_0_16px_rgba(37,99,235,0.3)]"
                      : `${meta.border} bg-white/10 text-white`
                  }`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
                  {autoPlay && !playQueue ? "▶ En lecture..." : "Tout écouter"}
                </button>
                <button
                  onClick={() => { setIsSelectionMode(v => !v); if (isSelectionMode) setSelectedEpisodes(new Set()); }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                    isSelectionMode ? `${meta.border} ${meta.accentText} bg-white/10` : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="m9 12 2 2 4-4"/>
                  </svg>
                  {isSelectionMode ? "Annuler" : "Sélectionner"}
                </button>
              </div>
            )}

            {isSelectionMode && selectedEpisodes.size > 0 && (
              <div className={`mt-3 flex items-center justify-between rounded-2xl border ${meta.border} bg-white/5 px-4 py-2.5`}>
                <span className={`text-sm font-semibold ${meta.accentText}`}>
                  {selectedEpisodes.size} épisode{selectedEpisodes.size > 1 ? "s" : ""} sélectionné{selectedEpisodes.size > 1 ? "s" : ""}
                </span>
                <button onClick={playSelection}
                  className={`inline-flex items-center gap-1.5 rounded-xl border ${meta.border} bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20`}>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
                  Écouter la sélection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── PLAYER ── */}
        {isPlayerVisible && currentEpisode && (
          <StickyPlayer
            episode={currentEpisode}
            episodes={episodes}
            currentIdx={currentIdx}
            onPrev={goPrev}
            onNext={goNext}
            isPremium={isPremium || (isFreemium && FREE_EPISODE_NUMBERS.has(currentEpisode?.episodeNumber ?? 0))}
            subthemeImage={subthemeImage}
            meta={meta}
            autoPlay={autoPlay}
            setAutoPlay={setAutoPlay}
            selectedEpisodes={selectedEpisodes}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            playTrigger={playTrigger}
            playQueue={playQueue}
            onReady={(play, setAP) => { playerPlayRef.current = play; playerSetAutoPlayRef.current = setAP; }}
          />
        )}

        {/* ── LOCK PREMIUM ── */}
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

        {/* ── BANNIÈRE FREEMIUM ── */}
        {isFreemium && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-300">✨ <span className="font-semibold text-white">Freemium</span> — 2 épisodes gratuits par thème. Débloquez tout.</p>
              <button onClick={handleUpgrade} className="shrink-0 rounded-xl border border-amber-400/20 bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-400">Premium</button>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-slate-400">
              📱 <span className="font-semibold text-slate-300">Lecture en arrière-plan</span> — Utilisez les contrôles de l'écran de verrouillage pour naviguer entre les épisodes.
            </p>
          </div>
        )}

        {/* ── LISTE ÉPISODES ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Épisodes</h2>
            <span className="text-xs text-slate-400">
              {isPremium
                ? (isSelectionMode ? "Coche les épisodes à écouter" : "Cliquez pour écouter")
                : isFreemium ? "2 gratuits" : "Premium requis"}
            </span>
          </div>
          <div className="space-y-2">
            {episodes.map((ep, idx) => {
              const isFree    = isFreemium && FREE_EPISODE_NUMBERS.has(ep.episodeNumber);
              const locked    = !isPremium && !isFree;
              const isActive  = currentIdx === idx && (isPremium || isFree);
              const isSelected = selectedEpisodes.has(idx);
              return (
                <div key={ep.id} className={`rounded-xl border transition-all duration-200 ${
                  isActive
                    ? `${meta.border} bg-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ring-1 ring-white/20`
                    : isSelected
                    ? `${meta.border} bg-white/8`
                    : isFree
                    ? "border-emerald-400/20 bg-emerald-500/5 hover:bg-emerald-500/8"
                    : locked
                    ? "border-white/5 bg-white/[0.02] opacity-60"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                }`}>
                  <div role="button" tabIndex={0}
                    onClick={() => {
                      if (locked) { handleUpgrade(); return; }
                      if (isSelectionMode) { toggleEpisodeSelection(idx); return; }
                      setPlayQueue(null);
                      setCurrentIdx(idx);
                      playerSetAutoPlayRef.current?.(true);
                      setAutoPlay(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      if (locked) handleUpgrade();
                      else if (isSelectionMode) toggleEpisodeSelection(idx);
                      else { setPlayQueue(null); setCurrentIdx(idx); playerSetAutoPlayRef.current?.(true); setAutoPlay(true); }
                    }}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3">
                    {isSelectionMode && isPremium && (
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${isSelected ? `${meta.border} bg-white/20` : "border-white/20 bg-transparent"}`}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="2 7 6 11 12 3"/></svg>}
                      </div>
                    )}
                    {!isSelectionMode && (
                      subthemeImage
                        ? <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10"><Image src={subthemeImage} alt="" fill className="object-cover" /></div>
                        : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg">{meta.icon}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{String(ep.episodeNumber).padStart(2, "0")}</p>
                      <p className="mt-0.5 text-sm font-semibold leading-5 text-white">{ep.episodeTitle}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-500">{Math.round(ep.durationTargetSeconds / 60)}m</span>
                      {isActive ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.border} ${meta.accentText}`}>▶ En cours</span>
                      ) : isFree ? (
                        <span className="text-xs text-emerald-400">✓</span>
                      ) : locked ? (
                        <span className="text-xs text-amber-400">🔒</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-slate-500"><path d="M5 4l6 4-6 4V4z" fill="currentColor"/></svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── NAVIGATION ── */}
        <div className="flex gap-3 pt-2">
          <Link href="/audio" className="flex-1 inline-flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10 gap-1">
            <span className="text-lg">←</span>
            <span>Séries</span>
          </Link>
          <button
            onClick={() => !isDevenir && router.push(scrollReviseUrl)}
            disabled={isDevenir}
            className={`flex-1 inline-flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold transition active:scale-95 ${
              isDevenir
                ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}>
            <span className="text-lg">📖</span>
            <span>Réviser</span>
          </button>
          <button
            onClick={() => navigator.share?.({ title: subthemeLabel, url: window.location.href }) ?? navigator.clipboard.writeText(window.location.href)}
            className="flex-1 inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10">
            <span className="text-lg">🔗</span>
            <span>Partager</span>
          </button>
          <button
            onClick={() => router.push(nextSeriesUrl)}
            className="flex-1 inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95">
            <span className="text-lg">▶▶</span>
            <span>Suivante</span>
          </button>
        </div>

      </div>
    </main>
  );
}
