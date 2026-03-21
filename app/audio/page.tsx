"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { audioEpisodes, type AudioThemeKey } from "@/data/audioEpisodes";

// ─── THEME_META ────────────────────────────────────────────────────────────
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

// Épisode gratuit par thème (toujours le premier sous-thème, épisode 1)
const FREE_EPISODE_IDS = new Set(["audio-001", "audio-021", "audio-031", "audio-041"]);

// ─── Composants ────────────────────────────────────────────────────────────

function AnonymousLockScreen() {
  const router = useRouter();
  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-8 text-center shadow-[0_25px_70px_rgba(2,8,23,0.5)]">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-4xl">
          🎧
        </div>
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
          Préparez-vous à l&apos;oral
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
          Des entretiens audio guidés, structurés comme un vrai passage en préfecture.
          Créez un compte gratuit pour accéder au premier épisode de chaque thème.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center sm:grid-cols-3 max-w-sm mx-auto">
          {["🎙️ Voix naturelle", "📚 4 thèmes", "⏱️ ~2 min/épisode"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-xs font-semibold text-slate-300">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/register")}
            className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Créer un compte gratuit
          </button>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            J&apos;ai déjà un compte
          </button>
        </div>
      </div>
    </div>
  );
}

function FreemiumUpgradeBanner() {
  const router = useRouter();
  return (
    <div className="rounded-[1.8rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.22)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-2xl">
            👑
          </div>
          <div>
            <p className="font-bold text-white">Débloquez les 100 épisodes complets</p>
            <p className="mt-0.5 text-xs text-slate-300">
              Voix masculine et féminine • Toutes les séries • Accès illimité
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            const res = await fetch("/api/create-checkout", { method: "POST" });
            const { url, error } = await res.json();
            if (error) { router.push("/pricing"); return; }
            window.location.href = url;
          }}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(251,191,36,0.22)] transition hover:-translate-y-0.5 hover:brightness-105"
        >
          Passer Premium →
        </button>
      </div>
    </div>
  );
}

function EpisodeRow({
  title,
  number,
  duration,
  locked,
  isFree,
  onUpgrade,
}: {
  title: string;
  number: number;
  duration: number;
  locked: boolean;
  isFree: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
        isFree
          ? "border-emerald-400/20 bg-emerald-500/5 hover:bg-emerald-500/10"
          : locked
          ? "border-white/10 bg-white/5 opacity-70"
          : "border-white/10 bg-white/5 hover:border-blue-400/20 hover:bg-white/10"
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Épisode {number}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-white">{title}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-400">{Math.round(duration / 60)} min</p>
        {isFree ? (
          <p className="mt-1 text-xs font-semibold text-emerald-300">✓ Gratuit</p>
        ) : locked ? (
          <button
            onClick={onUpgrade}
            className="mt-1 text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
          >
            🔒 Premium
          </button>
        ) : (
          <p className="mt-1 text-xs font-semibold text-emerald-300">▶ Disponible</p>
        )}
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
    const byTheme = new Map<
      string,
      {
        themeKey: string;
        themeLabel: string;
        subthemes: Map<string, { subthemeKey: string; subthemeLabel: string; episodes: typeof audioEpisodes }>;
      }
    >();

    for (const ep of audioEpisodes) {
      if (!byTheme.has(ep.themeKey)) {
        byTheme.set(ep.themeKey, { themeKey: ep.themeKey, themeLabel: ep.themeLabel, subthemes: new Map() });
      }
      const themeGroup = byTheme.get(ep.themeKey)!;
      if (!themeGroup.subthemes.has(ep.subthemeKey)) {
        themeGroup.subthemes.set(ep.subthemeKey, { subthemeKey: ep.subthemeKey, subthemeLabel: ep.subthemeLabel, episodes: [] });
      }
      themeGroup.subthemes.get(ep.subthemeKey)!.episodes.push(ep);
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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-8 sm:space-y-10">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="hero-panel relative overflow-hidden px-5 py-7 sm:px-8 sm:py-10">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative mt-6 text-center">
            <div className="mb-3 inline-flex w-fit items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              Entretiens audio
            </div>
            <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Préparez-vous à l&apos;oral avec des{" "}
              <span className="text-blue-400">séries guidées</span> par thème.
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Écoutez des épisodes courts, structurés comme un vrai entretien, pour
              gagner en aisance et en confiance avant le passage réel.
            </p>

            {/* Badge rôle */}
            <div className="mt-4 flex justify-center">
              {isAnonymous && (
                <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-4 py-1.5 text-xs font-semibold text-slate-300">
                  👤 Sans compte — 0 épisode accessible
                </span>
              )}
              {isFreemium && (
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
                  ✨ Freemium — 1 épisode gratuit par thème
                </span>
              )}
              {isPremium && (
                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
                  👑 Premium — 100 épisodes disponibles
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => router.push("/scroll")}
                className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                🚀 Réviser en scroll
              </button>
              <button
                onClick={() => router.push("/quiz")}
                className="inline-flex min-w-[200px] items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-blue-400/25 hover:bg-slate-700/85"
              >
                🎯 Faire un test
              </button>
            </div>
          </div>
        </section>

        {/* ── ÉCRAN VERROUILLÉ (anonymous) ────────────────────────────── */}
        {isAnonymous && <AnonymousLockScreen />}

        {/* ── BANNIÈRE UPGRADE (freemium) ──────────────────────────────── */}
        {isFreemium && <FreemiumUpgradeBanner />}

        {/* ── LISTE DES SÉRIES ────────────────────────────────────────── */}
        {!isAnonymous && (
          <section>
            <div className="mb-5">
              <h2 className="section-title text-2xl">Séries disponibles</h2>
              {isFreemium && (
                <p className="mt-1 text-sm text-slate-400">
                  Le premier épisode de chaque thème est gratuit.{" "}
                  <button onClick={handleUpgrade} className="font-semibold text-amber-400 hover:text-amber-300 transition">
                    Débloquez tout →
                  </button>
                </p>
              )}
            </div>

            <div className="space-y-6">
              {grouped.map((theme) => {
                const meta = THEME_META[theme.themeKey as AudioThemeKey] ?? THEME_META.Valeurs;
                const totalEpisodes = theme.subthemes.reduce((acc, sub) => acc + sub.episodes.length, 0);

                return (
                  <div
                    key={theme.themeKey}
                    className={`overflow-hidden rounded-[1.8rem] border bg-gradient-to-br ${meta.accent} shadow-[0_20px_50px_rgba(2,8,23,0.24)]`}
                  >
                    {/* En-tête thème */}
                    <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                            {meta.icon}
                          </div>
                          <div>
                            <h2 className="text-2xl font-extrabold text-white">{meta.label}</h2>
                            <p className="mt-1 max-w-3xl text-sm leading-7 text-slate-300">{meta.description}</p>
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
                          {totalEpisodes} épisodes
                        </div>
                      </div>
                    </div>

                    {/* Grille sous-thèmes */}
                    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                      {theme.subthemes.map((sub) => (
                        <div key={sub.subthemeKey} className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4 backdrop-blur-sm">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-white">{sub.subthemeLabel}</h3>
                              <p className="mt-1 text-xs text-slate-400">{sub.episodes.length} épisodes</p>
                            </div>
                            <span className={`badge ${isPremium ? "" : "opacity-60"}`}>
                              {isPremium ? "Disponible" : "Premium"}
                            </span>
                          </div>

                          {/* Épisodes */}
                          <div className="space-y-3">
                            {sub.episodes.map((ep) => {
                              const isFree = isFreemium && FREE_EPISODE_IDS.has(ep.id);
                              const locked = !isPremium && !isFree;
                              return (
                                <EpisodeRow
                                  key={ep.id}
                                  title={ep.episodeTitle}
                                  number={ep.episodeNumber}
                                  duration={ep.durationTargetSeconds}
                                  locked={locked}
                                  isFree={isFree}
                                  onUpgrade={handleUpgrade}
                                />
                              );
                            })}
                          </div>

                          {/* CTA sous-thème */}
                          <div className="mt-4">
                            {isPremium ? (
                              <button
                                onClick={() => router.push(`/audio/${encodeURIComponent(theme.themeKey)}/${encodeURIComponent(sub.subthemeKey)}`)}
                                className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:brightness-105"
                              >
                                ▶ Ouvrir la série
                              </button>
                            ) : (
                              <button
                                onClick={handleUpgrade}
                                className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15"
                              >
                                👑 Débloquer — Passer Premium
                              </button>
                            )}
                          </div>
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
          <section className="card">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="badge">Conseil de progression</span>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  Commencez par Valeurs, puis élargissez
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  La série audio sur les valeurs est souvent la plus utile pour
                  prendre confiance à l&apos;oral.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/resources" className="btn-secondary inline-flex items-center justify-center whitespace-nowrap">
                  Retour aux ressources
                </Link>
                <Link href="/scroll" className="btn-primary inline-flex items-center justify-center whitespace-nowrap">
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
