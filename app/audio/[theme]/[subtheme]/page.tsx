"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../../components/UserContext";
import { audioEpisodes, type AudioEpisode, type AudioThemeKey } from "@/data/audioEpisodes";

// ─── Méta visuelle par thème ───────────────────────────────────────────────
const THEME_META: Record<
  AudioThemeKey,
  { icon: string; accent: string; accentText: string; border: string }
> = {
  Valeurs: {
    icon: "🇫🇷",
    accent: "from-blue-500/15 via-indigo-500/10 to-sky-500/15",
    accentText: "text-blue-300",
    border: "border-blue-400/20",
  },
  Institutions: {
    icon: "🏛️",
    accent: "from-violet-500/15 via-purple-500/10 to-fuchsia-500/15",
    accentText: "text-violet-300",
    border: "border-violet-400/20",
  },
  Histoire: {
    icon: "📜",
    accent: "from-amber-500/15 via-orange-500/10 to-yellow-500/15",
    accentText: "text-amber-300",
    border: "border-amber-400/20",
  },
  Société: {
    icon: "👥",
    accent: "from-emerald-500/15 via-green-500/10 to-teal-500/15",
    accentText: "text-emerald-300",
    border: "border-emerald-400/20",
  },
};

// ─── Utilitaire : formater mm:ss ───────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Composant Partage ────────────────────────────────────────────────────
function ShareButton({ url, title, text }: { url: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const handleShare = async () => {
    // Web Share API — natif mobile (iOS/Android)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: fullUrl });
        return;
      } catch {
        // L'utilisateur a annulé — on n'ouvre pas le dropdown
        return;
      }
    }
    // Desktop — ouvrir le dropdown
    setOpen((o) => !o);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${fullUrl}`)}`, "_blank");
    setOpen(false);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`, "_blank");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        aria-label="Partager"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M10.5 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM4.5 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm6 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.25 3.5l-3.5 3M8.25 11.5l-3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Partager
      </button>

      {/* Dropdown desktop */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 7.5l3 3 6-6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-emerald-400">Lien copié !</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="4" y="1" width="9" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 5H1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Copier le lien
              </>
            )}
          </button>

          <div className="border-t border-white/5" />

          <button
            onClick={shareWhatsApp}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 8s.5 2 2.5 2 2.5-1.5 2.5-1.5V7S9.5 6 8 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            WhatsApp
          </button>

          <div className="border-t border-white/5" />

          <button
            onClick={shareTwitter}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
              <path d="M1 1h4l2.5 3.5L10.5 1H14L9.5 6.5 14 14h-4L7.5 10 4.5 14H1l4.5-5.5L1 1Z"/>
            </svg>
            Twitter / X
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Player audio inline ───────────────────────────────────────────────────
function AudioPlayer({
  episodeSlug,
  accentText,
}: {
  episodeSlug: string;
  accentText: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // Fetch sécurisé de l'URL signée au montage et à chaque changement de slug
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setLoaded(false);
    setAudioUrl(null);
    setFetchError(false);

    fetch(`/api/audio/${episodeSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => setAudioUrl(data.url))
      .catch(() => setFetchError(true));
  }, [episodeSlug]);

  if (fetchError) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-lg">⚠️</span>
        <p className="text-xs text-slate-400">
          Fichier audio indisponible pour le moment.
        </p>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-lg">🎙️</span>
        <p className="text-xs text-slate-400">Chargement de l&apos;audio...</p>
      </div>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying((p) => !p);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const ct = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(ct);
    setProgress((ct / dur) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const val = Number(e.target.value);
    audioRef.current.currentTime = (val / 100) * (audioRef.current.duration || 0);
    setProgress(val);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(
        audioRef.current.currentTime + seconds,
        audioRef.current.duration || 0
      )
    );
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration ?? 0);
          setLoaded(true);
        }}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />

      <div className="flex items-center gap-3">
        {/* Reculer 10s */}
        <button
          onClick={() => skip(-10)}
          disabled={!loaded}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
          aria-label="Reculer 10 secondes"
        >
          −10
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={!loaded}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_6px_20px_rgba(37,99,235,0.3)] transition hover:brightness-110 active:scale-95 disabled:opacity-40"
          aria-label={playing ? "Pause" : "Lecture"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5l10 5.5-10 5.5V1.5z" />
            </svg>
          )}
        </button>

        {/* Avancer 10s */}
        <button
          onClick={() => skip(10)}
          disabled={!loaded}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
          aria-label="Avancer 10 secondes"
        >
          +10
        </button>

        {/* Barre de progression + temps */}
        <div className="flex flex-1 flex-col gap-1.5">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            disabled={!loaded}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-blue-500 disabled:opacity-30"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {/* Conseil mémorisation + Partager l'épisode */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          💡 Conseil : note les points clés après l&apos;écoute pour mieux mémoriser.
        </p>
        <ShareButton
          url={typeof window !== "undefined" ? window.location.pathname : ""}
          title={`Épisode audio — QCM Assimilation FR`}
          text={`🎧 J'écoute cet épisode pour préparer mon entretien de naturalisation — QCM Assimilation FR`}
        />
      </div>
    </div>
  );
}

// ─── Carte épisode (accordéon) ─────────────────────────────────────────────
function EpisodeCard({
  episode,
  isOpen,
  onToggle,
  accentText,
  isPremium,
  onUpgrade,
}: {
  episode: AudioEpisode;
  isOpen: boolean;
  onToggle: () => void;
  accentText: string;
  isPremium: boolean;
  onUpgrade: () => void;
}) {
  const locked = !isPremium && episode.premium;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isOpen
          ? "border-blue-400/25 bg-slate-900/60 shadow-[0_8px_30px_rgba(2,8,23,0.3)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      {/* En-tête cliquable */}
      <button
        onClick={locked ? onUpgrade : onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`shrink-0 text-xs font-bold uppercase tracking-[0.18em] ${accentText}`}
          >
            {String(episode.episodeNumber).padStart(2, "0")}
          </span>
          <p className="truncate text-sm font-semibold text-white">
            {episode.episodeTitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-slate-400">
            {Math.round(episode.durationTargetSeconds / 60)} min
          </span>
          {locked ? (
            <span className="text-xs font-bold text-amber-300">🔒</span>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Player déployé */}
      {isOpen && (
        <div className="border-t border-white/10 px-5 pb-5">
          {locked ? (
            <div className="mt-3 rounded-xl bg-slate-800 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">🔒 Contenu Premium</p>
              <p className="mt-1 text-xs text-slate-400">
                Débloquez cet épisode pour écouter l&apos;entretien complet.
              </p>
              <button
                onClick={onUpgrade}
                className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
              >
                Passer en Premium
              </button>
            </div>
          ) : (
            <AudioPlayer episodeSlug={episode.episodeSlug} accentText={accentText} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function AudioSeriesPage() {
  const { theme, subtheme } = useParams();
  const router = useRouter();
  const { role } = useUser();
  const isPremium = role === "premium";

  // Cast + décode les params (gère les accents dans l'URL)
  const themeKey = decodeURIComponent(theme as string) as AudioThemeKey;
  const subthemeKey = decodeURIComponent(subtheme as string);

  // Filtrage + tri par episodeNumber
  const episodes = useMemo(() => {
    return audioEpisodes
      .filter((ep) => ep.themeKey === themeKey && ep.subthemeKey === subthemeKey)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }, [themeKey, subthemeKey]);

  // Premier épisode ouvert par défaut
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    if (episodes.length > 0) setOpenId(episodes[0].id);
  }, [episodes]);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const meta = THEME_META[themeKey] ?? THEME_META.Valeurs;

  // Fallback
  if (!episodes.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-400">Série introuvable.</p>
        <Link href="/audio" className="btn-secondary mt-6 inline-flex">
          ← Retour
        </Link>
      </main>
    );
  }

  const { themeLabel, subthemeLabel } = episodes[0];
  const totalMinutes = Math.round(
    episodes.reduce((acc, ep) => acc + ep.durationTargetSeconds, 0) / 60
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-6">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div
          className={`overflow-hidden rounded-[1.8rem] border bg-gradient-to-br ${meta.accent} ${meta.border} shadow-[0_20px_50px_rgba(2,8,23,0.24)]`}
        >
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {/* Breadcrumb */}
            <nav className="mb-5 flex items-center gap-2 text-xs text-slate-400">
              <Link href="/audio" className="transition hover:text-white">
                Séries audio
              </Link>
              <span>/</span>
              <span className={meta.accentText}>{themeLabel}</span>
              <span>/</span>
              <span className="text-white">{subthemeLabel}</span>
            </nav>

            {/* Icône + titre + stats */}
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
                {meta.icon}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${meta.accentText}`}>
                  {themeLabel}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                  {subthemeLabel}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                    {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                    ~{totalMinutes} min
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                    Format entretien réel
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton retour + Partager la série */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 12L6 8l4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Retour
              </button>

              <ShareButton
                url={`/audio/${encodeURIComponent(themeKey)}/${encodeURIComponent(subthemeKey)}`}
                title={subthemeLabel}
                text={`🎧 Prépare ton entretien de naturalisation avec cette série audio : "${subthemeLabel}" — QCM Assimilation FR`}
              />
            </div>
          </div>
        </div>

        {/* ── LOCK PREMIUM ───────────────────────────────────────────── */}
        {!isPremium && (
          <div className="rounded-[1.8rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-center shadow-[0_18px_45px_rgba(2,8,23,0.22)]">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-2xl">
              👑
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Contenu Premium
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-300">
              Débloquez cette série pour écouter les {episodes.length} épisodes complets.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/pricing")}
                className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(251,191,36,0.22)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Passer en Premium
              </button>
              <button
                onClick={() => router.push("/account")}
                className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Mon compte
              </button>
            </div>
          </div>
        )}

        {/* ── BANNIÈRE ÉCOUTE ACTIVE ─────────────────────────────────── */}
        {isPremium && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4">
            <p className="text-sm text-slate-300">
              🎧 Écoute active recommandée : mets un casque et concentre-toi comme lors de l&apos;entretien réel.
            </p>
          </div>
        )}

        {/* ── LISTE DES ÉPISODES ─────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Épisodes</h2>
            <span className="text-xs text-slate-400">
              {isPremium ? "Cliquez pour écouter" : "Premium requis"}
            </span>
          </div>

          <div className="space-y-3">
            {episodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                isOpen={openId === ep.id}
                onToggle={() => toggle(ep.id)}
                accentText={meta.accentText}
                isPremium={isPremium}
                onUpgrade={() => router.push("/pricing")}
              />
            ))}
          </div>
        </section>

        {/* ── NAVIGATION ─────────────────────────────────────────────── */}
        <section className="card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="badge">Continuer</span>
              <p className="mt-2 text-sm text-slate-300">
                Explorez les autres séries pour compléter votre préparation.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/audio"
                className="btn-secondary inline-flex items-center justify-center whitespace-nowrap"
              >
                ← Retour aux séries
              </Link>
              <button
                onClick={() => router.push("/scroll")}
                className="btn-primary inline-flex items-center justify-center whitespace-nowrap"
              >
                🚀 Réviser en scroll
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
