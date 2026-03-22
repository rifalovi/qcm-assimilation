"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { audioEpisodes, type AudioThemeKey } from "@/data/audioEpisodes";

const THEME_META: Record<
  AudioThemeKey,
  { label: string; icon: string; accent: string; description: string }
> = {
  Valeurs: {
    label: "Valeurs",
    icon: "🇫🇷",
    accent: "from-blue-500/15 via-indigo-500/10 to-sky-500/15 border-blue-400/20",
    description: "Préparez les notions les plus sensibles de l'entretien civique, avec une sous-section dédiée aux droits et devoirs du citoyen.",
  },
  Institutions: {
    label: "Institutions",
    icon: "🏛️",
    accent: "from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 border-violet-400/20",
    description: "Comprendre les pouvoirs, les élections et le rôle des grandes institutions françaises.",
  },
  Histoire: {
    label: "Histoire et géographie",
    icon: "📜",
    accent: "from-amber-500/15 via-orange-500/10 to-yellow-500/15 border-amber-400/20",
    description: "Retrouvez les grandes dates, les repères historiques, géographiques et culturels essentiels.",
  },
  Société: {
    label: "Société",
    icon: "👥",
    accent: "from-emerald-500/15 via-green-500/10 to-teal-500/15 border-emerald-400/20",
    description: "Les repères concrets pour vivre, travailler, se soigner et évoluer dans la société française.",
  },
};

// Épisodes gratuits pour freemium (1er épisode de chaque thème)
const FREE_EPISODE_IDS = new Set(["audio-001", "audio-021", "audio-031", "audio-041"]);

// ─── Utilitaire mm:ss ──────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Bouton de partage ─────────────────────────────────────────────────────
function ShareButton({ episodeTitle, episodeSlug }: { episodeTitle: string; episodeSlug: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}/audio/${episodeSlug}`
    : "";
  const text = `🎧 "${episodeTitle}" — Prépare ton entretien de naturalisation avec QCM Assimilation FR`;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try { await navigator.share({ title: episodeTitle, text, url: fullUrl }); return; } catch { return; }
    }
    setOpen((o) => !o);
  };

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 2000);
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleShare}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Partager"
      >
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
          <path d="M10.5 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM4.5 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm6 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.25 3.5l-3.5 3M8.25 11.5l-3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <button onClick={copyLink} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-slate-200 transition hover:bg-white/5">
            {copied ? <span className="text-emerald-400">✓ Lien copié !</span> : <>
              <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="4" y="1" width="9" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 5H1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Copier le lien
            </>}
          </button>
          <div className="border-t border-white/5" />
          <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${fullUrl}`)}`, "_blank"); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-slate-200 transition hover:bg-white/5">
            <span>💬</span> WhatsApp
          </button>
          <div className="border-t border-white/5" />
          <button onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`, "_blank"); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-slate-200 transition hover:bg-white/5">
            <svg width="13" height="13" viewBox="0 0 15 15" fill="currentColor"><path d="M1 1h4l2.5 3.5L10.5 1H14L9.5 6.5 14 14h-4L7.5 10 4.5 14H1l4.5-5.5L1 1Z"/></svg>
            Twitter / X
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Mini player pour épisodes gratuits (freemium) ────────────────────────
function FreeEpisodePlayer({ episodeSlug }: { episodeSlug: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/audio/${episodeSlug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setAudioUrl(d.url))
      .catch(() => setError(true));
  }, [episodeSlug]);

  if (error) return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
      ⚠️ Audio indisponible pour le moment.
    </div>
  );

  if (!audioUrl) return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
      🎙️ Chargement...
    </div>
  );

  const togglePlay = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying((p) => !p);
  };

  const skip = (s: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + s, audioRef.current.duration || 0));
  };

  return (
    <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3">
      <audio ref={audioRef} src={audioUrl}
        onTimeUpdate={() => { if (!audioRef.current) return; setCurrentTime(audioRef.current.currentTime); setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100); }}
        onLoadedMetadata={() => { setDuration(audioRef.current?.duration ?? 0); setLoaded(true); }}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center gap-2">
        <button onClick={() => skip(-10)} disabled={!loaded} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 disabled:opacity-30">−10</button>
        <button onClick={togglePlay} disabled={!loaded} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-600 text-white disabled:opacity-40">
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="4" height="12" rx="1"/><rect x="8" y="1" width="4" height="12" rx="1"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l10 5.5-10 5.5V1.5z"/></svg>
          )}
        </button>
        <button onClick={() => skip(10)} disabled={!loaded} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-slate-300 disabled:opacity-30">+10</button>
        <div className="flex flex-1 flex-col gap-1">
          <input type="range" min={0} max={100} step={0.1} value={progress}
            onChange={(e) => { if (!audioRef.current) return; audioRef.current.currentTime = (Number(e.target.value) / 100) * (audioRef.current.duration || 0); setProgress(Number(e.target.value)); }}
            disabled={!loaded}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-500 disabled:opacity-30"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-emerald-400/70">
        💡 Épisode gratuit — passez Premium pour écouter les 96 autres
      </p>
    </div>
  );
}

// ─── Ligne épisode ─────────────────────────────────────────────────────────
function EpisodeRow({
  episode,
  locked,
  isFree,
  isOpen,
  onOpen,
  onUpgrade,
}: {
  episode: typeof audioEpisodes[0];
  locked: boolean;
  isFree: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      isOpen
        ? "border-blue-400/25 bg-slate-900/60"
        : isFree
        ? "border-emerald-400/20 bg-emerald-500/5"
        : locked
        ? "border-white/10 bg-white/5 opacity-75"
        : "border-white/10 bg-white/5 hover:border-blue-400/20 hover:bg-white/8"
    }`}>
      {/* Zone cliquable principale — div, pas button, pour éviter boutons imbriqués */}
      <div
        role="button"
        tabIndex={0}
        onClick={locked ? onUpgrade : onOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { locked ? onUpgrade() : onOpen(); } }}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-left sm:gap-3 sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Épisode {episode.episodeNumber}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white leading-5">
            {episode.episodeTitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-slate-400">{Math.round(episode.durationTargetSeconds / 60)} min</span>

          {isFree ? (
            <span className="text-xs font-semibold text-emerald-300">✓</span>
          ) : locked ? (
            <span className="text-xs text-amber-300">🔒</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}

          {/* Icône partage — clic stoppé pour ne pas déclencher le toggle */}
          <ShareButton episodeTitle={episode.episodeTitle} episodeSlug={episode.episodeSlug} />
        </div>
      </div>

      {/* Contenu déployé */}
      {isOpen && !locked && (
        <div className="border-t border-white/10 px-4 pb-4">
          {isFree ? (
            <FreeEpisodePlayer episodeSlug={episode.episodeSlug} />
          ) : (
            <div className="mt-3 text-xs text-slate-400">
              ▶ Cliquez sur "Ouvrir la série" pour écouter en mode complet.
            </div>
          )}
        </div>
      )}

      {/* Prompt upgrade si verrouillé et ouvert */}
      {isOpen && locked && (
        <div className="border-t border-white/10 px-4 pb-4">
          <div className="mt-3 rounded-xl bg-slate-800/80 p-4 text-center">
            <p className="text-sm font-semibold text-white">🔒 Contenu Premium</p>
            <button onClick={onUpgrade} className="mt-2 w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400">
              Passer en Premium
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Écran anonyme ─────────────────────────────────────────────────────────
function AnonymousLockScreen() {
  const router = useRouter();
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-6 text-center shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-3xl">🎧</div>
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Préparez-vous à l&apos;oral</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
          Des entretiens audio guidés, structurés comme un vrai passage en préfecture.
          Créez un compte gratuit pour accéder au premier épisode de chaque thème.
        </p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-3">
          {["🎙️ Voix naturelle", "📚 4 thèmes", "⏱️ ~2 min"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-xs font-semibold text-slate-300">{item}</div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => router.push("/register")} className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5">
            Créer un compte gratuit
          </button>
          <button onClick={() => router.push("/login")} className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
            J&apos;ai déjà un compte
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bannière freemium ─────────────────────────────────────────────────────
function FreemiumUpgradeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.22)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-2xl">👑</div>
          <div>
            <p className="font-bold text-white">Débloquez les 100 épisodes complets</p>
            <p className="mt-0.5 text-xs leading-6 text-slate-300">Voix masculine et féminine • Toutes les séries • Accès illimité</p>
          </div>
        </div>
        <button onClick={onUpgrade} className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(251,191,36,0.22)] transition hover:-translate-y-0.5 hover:brightness-105">
          Passer Premium →
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function AudioPage() {
  const router = useRouter();
  const { role } = useUser();

  const isPremium = role === "premium";
  const isFreemium = role === "freemium";
  const isAnonymous = role === "anonymous" || !role;

  // Épisode ouvert par sous-thème (clé: subthemeKey, valeur: id épisode)
  const [openEpisodes, setOpenEpisodes] = useState<Record<string, string | null>>({});

  const toggleEpisode = (subthemeKey: string, episodeId: string) => {
    setOpenEpisodes((prev) => ({
      ...prev,
      [subthemeKey]: prev[subthemeKey] === episodeId ? null : episodeId,
    }));
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { router.push("/pricing"); return; }
      window.location.href = url;
    } catch {
      router.push("/pricing");
    }
  };

  const grouped = useMemo(() => {
    const byTheme = new Map<string, {
      themeKey: string; themeLabel: string;
      subthemes: Map<string, { subthemeKey: string; subthemeLabel: string; episodes: typeof audioEpisodes }>;
    }>();

    for (const ep of audioEpisodes) {
      if (!byTheme.has(ep.themeKey)) byTheme.set(ep.themeKey, { themeKey: ep.themeKey, themeLabel: ep.themeLabel, subthemes: new Map() });
      const tg = byTheme.get(ep.themeKey)!;
      if (!tg.subthemes.has(ep.subthemeKey)) tg.subthemes.set(ep.subthemeKey, { subthemeKey: ep.subthemeKey, subthemeLabel: ep.subthemeLabel, episodes: [] });
      tg.subthemes.get(ep.subthemeKey)!.episodes.push(ep);
    }

    return Array.from(byTheme.values()).map((theme) => ({
      ...theme,
      subthemes: Array.from(theme.subthemes.values()).map((sub) => ({
        ...sub,
        episodes: [...sub.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber),
      })),
    }));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:px-8">
      <div className="space-y-8 sm:space-y-10">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full">
            <div className="flex-1 bg-blue-600" /><div className="flex-1 bg-white" /><div className="flex-1 bg-red-600" />
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative px-5 py-7 sm:px-8 sm:py-9 text-center">
            <div className="mb-3 inline-flex items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              Entretiens audio
            </div>
            <h1 className="mx-auto max-w-4xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Préparez-vous à l&apos;oral avec des{" "}
              <span className="text-blue-400">séries guidées</span> par thème.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Épisodes courts, structurés comme un vrai entretien, pour gagner en aisance et en confiance.
            </p>

            <div className="mt-3 flex justify-center">
              {isAnonymous && <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-300">👤 Sans compte</span>}
              {isFreemium && <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">✨ Freemium — 1 épisode gratuit par thème</span>}
              {isPremium && <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">👑 Premium — accès complet</span>}
            </div>

            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <button onClick={() => router.push("/scroll")} className="w-full sm:w-auto rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition hover:bg-blue-500">
                🚀 Réviser en scroll
              </button>
              <button onClick={() => router.push("/quiz")} className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                🎯 Faire un test
              </button>
            </div>
          </div>
        </section>

        {/* ── ÉCRAN ANONYME ────────────────────────────────────────────── */}
        {isAnonymous && <AnonymousLockScreen />}

        {/* ── BANNIÈRE FREEMIUM ────────────────────────────────────────── */}
        {isFreemium && <FreemiumUpgradeBanner onUpgrade={handleUpgrade} />}

        {/* ── SÉRIES ──────────────────────────────────────────────────── */}
        {!isAnonymous && (
          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-white">Séries disponibles</h2>
              {isFreemium && (
                <p className="mt-1 text-sm text-slate-400">
                  Le premier épisode de chaque thème est gratuit.{" "}
                  <button onClick={handleUpgrade} className="font-semibold text-amber-400 transition hover:text-amber-300">Débloquez tout →</button>
                </p>
              )}
            </div>

            <div className="space-y-6">
              {grouped.map((theme) => {
                const meta = THEME_META[theme.themeKey as AudioThemeKey] ?? THEME_META.Valeurs;
                const totalEpisodes = theme.subthemes.reduce((acc, sub) => acc + sub.episodes.length, 0);

                return (
                  <div key={theme.themeKey} className={`overflow-hidden rounded-[2rem] border bg-gradient-to-br ${meta.accent} shadow-[0_20px_50px_rgba(2,8,23,0.24)]`}>

                    {/* En-tête thème */}
                    <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl sm:h-14 sm:w-14 sm:text-2xl">
                            {meta.icon}
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-xl font-extrabold text-white sm:text-2xl">{meta.label}</h2>
                            <p className="mt-1 max-w-3xl text-sm leading-7 text-slate-300">{meta.description}</p>
                          </div>
                        </div>
                        <div className="self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 sm:px-4 sm:py-2 sm:text-sm">
                          {totalEpisodes} épisodes
                        </div>
                      </div>
                    </div>

                    {/* Sous-thèmes */}
                    <div
  className={`grid gap-4 p-4 sm:p-5 ${
    theme.subthemes.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"
  }`}
>
                      {theme.subthemes.map((sub) => (
                        <div key={sub.subthemeKey} className="rounded-[1.6rem] border border-white/10 bg-slate-950/30 p-4 backdrop-blur-sm">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-white">{sub.subthemeLabel}</h3>
                              <p className="mt-0.5 text-xs text-slate-400">{sub.episodes.length} épisodes</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`badge ${isPremium ? "" : "opacity-60"}`}>
                                {isPremium ? "Disponible" : "Premium"}
                              </span>
                              {isPremium && (
                                <button
                                  onClick={() => router.push(`/audio/${encodeURIComponent(theme.themeKey)}/${encodeURIComponent(sub.subthemeKey)}`)}
                                  className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200 transition hover:bg-blue-500/15"
                                >
                                  ▶ Ouvrir
                                </button>
                              )}
                              {!isPremium && (
                                <button
                                  onClick={handleUpgrade}
                                  className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/15"
                                >
                                  👑 Débloquer
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Liste épisodes — 5+5 si 10 épisodes, 1 colonne sinon */}
                          {sub.episodes.length >= 10 && theme.subthemes.length === 1 ? (
                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                              {[sub.episodes.slice(0, 5), sub.episodes.slice(5)].map((group, gi) => (
                                <div key={gi} className="space-y-2">
                                  {group.map((ep) => {
                                    const isFree = isFreemium && FREE_EPISODE_IDS.has(ep.id);
                                    const locked = !isPremium && !isFree;
                                    const isOpen = openEpisodes[sub.subthemeKey] === ep.id;
                                    return (
                                      <EpisodeRow
                                        key={ep.id}
                                        episode={ep}
                                        locked={locked}
                                        isFree={isFree}
                                        isOpen={isOpen}
                                        onOpen={() => router.push(`/audio/${encodeURIComponent(theme.themeKey)}/${encodeURIComponent(sub.subthemeKey)}?episode=${ep.episodeNumber}`)}
                                        onUpgrade={handleUpgrade}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sub.episodes.map((ep) => {
                                const isFree = isFreemium && FREE_EPISODE_IDS.has(ep.id);
                                const locked = !isPremium && !isFree;
                                const isOpen = openEpisodes[sub.subthemeKey] === ep.id;
                                return (
                                  <EpisodeRow
                                    key={ep.id}
                                    episode={ep}
                                    locked={locked}
                                    isFree={isFree}
                                    isOpen={isOpen}
                                    onOpen={() => router.push(`/audio/${encodeURIComponent(theme.themeKey)}/${encodeURIComponent(sub.subthemeKey)}?episode=${ep.episodeNumber}`)}
                                    onUpgrade={handleUpgrade}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CONSEIL ─────────────────────────────────────────────────── */}
        {!isAnonymous && (
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="badge">Conseil de progression</span>
                <h2 className="mt-3 text-xl font-bold text-white">Commencez par Valeurs, puis élargissez</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">La série audio sur les valeurs est souvent la plus utile pour prendre confiance à l&apos;oral.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/resources" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                  Retour aux ressources
                </Link>
                <Link href="/scroll" className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
                  Réviser en scroll
                </Link>
              </div>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
