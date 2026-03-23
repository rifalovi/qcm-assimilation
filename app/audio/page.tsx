"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { audioEpisodes, type AudioThemeKey } from "@/data/audioEpisodes";
import { useMemo } from "react";

// ─── Config albums ─────────────────────────────────────────────────────────
const SUBTHEME_CONFIG: Record<string, {
  image: string;
  accent: string;
  border: string;
  accentText: string;
}> = {
  valeurs_republique: {
    image: "/themes/valeurs_republique.jpg",
    accent: "from-blue-600/30 to-indigo-600/20",
    border: "border-blue-400/20",
    accentText: "text-blue-300",
  },
  droits_devoirs_citoyen: {
    image: "/themes/droits_devoirs_citoyen.jpg",
    accent: "from-sky-600/30 to-blue-600/20",
    border: "border-sky-400/20",
    accentText: "text-sky-300",
  },
  institutions: {
    image: "/themes/institutions.jpg",
    accent: "from-violet-600/30 to-purple-600/20",
    border: "border-violet-400/20",
    accentText: "text-violet-300",
  },
  histoire_geographie: {
    image: "/themes/histoire_geographie.jpg",
    accent: "from-amber-600/30 to-orange-600/20",
    border: "border-amber-400/20",
    accentText: "text-amber-300",
  },
  societe: {
    image: "/themes/societe.jpg",
    accent: "from-emerald-600/30 to-teal-600/20",
    border: "border-emerald-400/20",
    accentText: "text-emerald-300",
  },
};

const THEME_ICONS: Record<string, string> = {
  Valeurs: "🇫🇷",
  Institutions: "🏛️",
  Histoire: "📜",
  Société: "👥",
};

// Catégories à venir
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
  {
    id: "quiz-audio",
    title: "Quiz audio",
    description: "Questions posées à l'oral — entraîne ta réponse",
    icon: "🎯",
    color: "from-orange-600/20 to-red-600/10 border-orange-400/20",
    iconBg: "bg-orange-500/20 border-orange-400/20",
    count: "Bientôt",
  },
];

// ─── Composant Album Card ──────────────────────────────────────────────────
function AlbumCard({
  subthemeKey,
  subthemeLabel,
  themeLabel,
  themeKey,
  episodeCount,
  totalMinutes,
  isPremium,
  isFreemium,
  onUpgrade,
}: {
  subthemeKey: string;
  subthemeLabel: string;
  themeLabel: string;
  themeKey: string;
  episodeCount: number;
  totalMinutes: number;
  isPremium: boolean;
  isFreemium: boolean;
  onUpgrade: () => void;
}) {
  const config = SUBTHEME_CONFIG[subthemeKey];
  const router = useRouter();
  const locked = !isPremium && !isFreemium;

  const handleClick = () => {
    if (locked) { onUpgrade(); return; }
    router.push(`/audio/${encodeURIComponent(themeKey)}/${encodeURIComponent(subthemeKey)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-[0.98] ${config?.border ?? "border-white/10"}`}
    >
      {/* Image de couverture */}
      <div className="relative aspect-square w-full overflow-hidden">
        {config?.image ? (
          <>
            <Image
              src={config.image}
              alt={subthemeLabel}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${config.accent} opacity-60`} />
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config?.accent ?? "from-slate-700 to-slate-800"}`}>
            <span className="text-5xl">{THEME_ICONS[themeKey] ?? "🎧"}</span>
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
            <p className="text-[10px] font-bold text-emerald-300">1 gratuit</p>
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
        <p className={`text-[10px] font-bold uppercase tracking-widest ${config?.accentText ?? "text-slate-400"}`}>
          {themeLabel}
        </p>
        <p className="mt-0.5 text-sm font-bold leading-tight text-white line-clamp-2">
          {subthemeLabel}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {episodeCount} épisodes • ~{totalMinutes} min
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
  const isPremium = role === "premium";
  const isFreemium = role === "freemium";
  const isAnonymous = role === "anonymous" || !role;

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const { url, error } = await res.json();
      if (error) { router.push("/pricing"); return; }
      window.location.href = url;
    } catch { router.push("/pricing"); }
  };

  // Grouper les épisodes par sous-thème
  const albums = useMemo(() => {
    const map = new Map<string, {
      subthemeKey: string;
      subthemeLabel: string;
      themeKey: string;
      themeLabel: string;
      episodes: typeof audioEpisodes;
    }>();

    for (const ep of audioEpisodes) {
      if (!map.has(ep.subthemeKey)) {
        map.set(ep.subthemeKey, {
          subthemeKey: ep.subthemeKey,
          subthemeLabel: ep.subthemeLabel,
          themeKey: ep.themeKey,
          themeLabel: ep.themeLabel,
          episodes: [],
        });
      }
      map.get(ep.subthemeKey)!.episodes.push(ep);
    }

    return Array.from(map.values()).map((album) => ({
      ...album,
      episodeCount: album.episodes.length,
      totalMinutes: Math.round(album.episodes.reduce((acc, ep) => acc + ep.durationTargetSeconds, 0) / 60),
    }));
  }, []);

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
              {isFreemium && <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">✨ Freemium — 1 épisode gratuit par thème</span>}
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

        {/* ── THÉMATIQUES ─────────────────────────────────────────────── */}
        {!isAnonymous && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">🎓 Thématiques</h2>
                <p className="mt-0.5 text-xs text-slate-500">Préparation civique • Entretien de naturalisation</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                {albums.length} séries
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.subthemeKey}
                  subthemeKey={album.subthemeKey}
                  subthemeLabel={album.subthemeLabel}
                  themeLabel={album.themeLabel}
                  themeKey={album.themeKey}
                  episodeCount={album.episodeCount}
                  totalMinutes={album.totalMinutes}
                  isPremium={isPremium}
                  isFreemium={isFreemium}
                  onUpgrade={handleUpgrade}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── ANONYMOUS TEASER ────────────────────────────────────────── */}
        {isAnonymous && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-white">🎓 Thématiques</h2>
              <p className="mt-0.5 text-xs text-slate-500">Créez un compte pour accéder aux épisodes</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {albums.map((album) => {
                const config = SUBTHEME_CONFIG[album.subthemeKey];
                return (
                  <div key={album.subthemeKey} className={`relative overflow-hidden rounded-[1.5rem] border ${config?.border ?? "border-white/10"} opacity-50`}>
                    <div className="relative aspect-square w-full overflow-hidden">
                      {config?.image ? (
                        <>
                          <Image src={config.image} alt={album.subthemeLabel} fill className="object-cover" />
                          <div className={`absolute inset-0 bg-gradient-to-b ${config.accent}`} />
                        </>
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config?.accent ?? "from-slate-700 to-slate-800"}`}>
                          <span className="text-5xl">{THEME_ICONS[album.themeKey] ?? "🎧"}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <span className="text-3xl">🔒</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/95 px-3 py-3">
                      <p className="text-sm font-bold text-white">{album.subthemeLabel}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{album.episodeCount} épisodes</p>
                    </div>
                  </div>
                );
              })}
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
    </main>
  );
}
