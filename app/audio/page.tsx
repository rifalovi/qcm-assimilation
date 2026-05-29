"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAudioSeries,
  fetchAudioEpisodes,
  fetchAudioMedia,
  fetchAudioComingSoon,
  type AudioSeriesRow,
  type AudioMediaRow,
  type AudioComingSoonRow,
} from "@/lib/audioContent";
import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  GraduationCap,
  Headphones,
  Lock,
  Mic,
  Music,
  Rocket,
  Sparkles,
  Star,
  Timer,
  User,
  X,
} from "lucide-react";

// Icônes de secours si une série DB n'a pas d'emoji défini.
const THEME_ICON_FALLBACK: Record<string, string> = {
  Valeurs: "🇫🇷",
  Institutions: "🏛️",
  Histoire: "📜",
  Société: "👥",
};

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
      className={`group relative overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-[0.98] ${album.accent_border ?? ""}`}
      style={!album.accent_border ? { borderColor: "var(--cc-border)" } : {}}
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
            <div className="rounded-2xl px-4 py-2 text-center backdrop-blur-sm" style={{ border: "1px solid color-mix(in srgb, var(--cc-warning) 30%, transparent)", background: "color-mix(in srgb, var(--cc-warning) 20%, transparent)" }}>
              <Lock size={20} style={{ color: "var(--cc-warning)", margin: "0 auto 4px" }} />
              <p className="text-xs font-bold" style={{ color: "var(--cc-warning)" }}>Premium</p>
            </div>
          </div>
        )}

        {/* Badge freemium */}
        {isFreemium && !isPremium && (
          <div className="absolute right-2 top-2 rounded-full px-2 py-0.5 backdrop-blur-sm" style={{ border: "1px solid color-mix(in srgb, var(--cc-success) 30%, transparent)", background: "color-mix(in srgb, var(--cc-success) 20%, transparent)" }}>
            <p className="text-[10px] font-bold" style={{ color: "var(--cc-success)" }}>2 gratuits</p>
          </div>
        )}

        {/* Play overlay on hover */}
        {!locked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {/* White circle is intentional on dark album art — icon must always be dark */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]" style={{ color: "#0f172a" }}>
              <svg width="20" height="20" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.5l10 5.5-10 5.5V1.5z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="px-3 py-3" style={{ background: "var(--cc-surface-raised)" }}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${album.accent_text ?? ""}`} style={!album.accent_text ? { color: "var(--cc-text-muted)" } : {}}>
          {album.theme_label}
        </p>
        <p className="mt-0.5 text-sm font-bold leading-tight line-clamp-2" style={{ color: "var(--cc-text)" }}>
          {album.subtheme_label}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: "var(--cc-text-disabled)" }}>
          {album.episodeCount} épisodes • ~{album.totalMinutes} min
        </p>
      </div>
    </button>
  );
}

// ─── Composant Coming Soon Card ────────────────────────────────────────────
function ComingSoonCard({ item }: { item: AudioComingSoonRow }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-br ${item.color ?? ''} opacity-70`}>
      <div className="aspect-square w-full flex items-center justify-center" style={{ background: "var(--cc-surface-alt)" }}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${item.icon_bg ?? ''} text-3xl`}>
          {item.icon ?? '✨'}
        </div>
      </div>
      <div className="px-3 py-3" style={{ background: "var(--cc-surface-raised)" }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>{item.title}</p>
          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
            {item.count_label}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-[11px] leading-4 line-clamp-2" style={{ color: "var(--cc-text-disabled)" }}>{item.description}</p>
        )}
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
  const [comingSoonRows, setComingSoonRows] = useState<AudioComingSoonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = createClient();
      const [series, episodes, media, comingSoon] = await Promise.all([
        fetchAudioSeries(sb),
        fetchAudioEpisodes(sb),
        fetchAudioMedia(sb),
        fetchAudioComingSoon(sb),
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
      setComingSoonRows(comingSoon);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  // Fusion series + compteurs d'épisodes venant de Supabase
  const albums = useMemo<Album[]>(() => {
    if (!seriesRows) return [];
    return seriesRows.map((s) => {
      const fromDb = episodeCounts.get(s.id) ?? { count: 0, seconds: 0 };
      return {
        ...s,
        episodeCount: fromDb.count,
        totalMinutes: Math.round(fromDb.seconds / 60),
      };
    });
  }, [seriesRows, episodeCounts]);

  // Carrousel « En vedette » : toutes les séries featured, auto-rotation 3 s
  const featuredAlbums = useMemo<Album[]>(
    () => {
      const onlyFeatured = albums.filter((a) => a.featured);
      if (onlyFeatured.length > 0) return onlyFeatured;
      // Aucune série featured : on retombe sur la première pour éviter un trou
      return albums[0] ? [albums[0]] : [];
    },
    [albums]
  );

  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  // Reset de l'index si la liste change (ex : l'admin ajoute/retire une série)
  useEffect(() => {
    if (carouselIdx >= featuredAlbums.length) setCarouselIdx(0);
  }, [featuredAlbums.length, carouselIdx]);

  // Auto-rotation toutes les 3 s (désactivée s'il n'y a qu'une série ou au survol)
  useEffect(() => {
    if (featuredAlbums.length <= 1 || carouselPaused) return;
    const id = window.setInterval(() => {
      setCarouselIdx((i) => (i + 1) % featuredAlbums.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [featuredAlbums.length, carouselPaused]);

  const featuredAlbum = featuredAlbums[carouselIdx] ?? null;

  const hymnes = useMemo(
    () => mediaRows.filter((m) => m.section === "hymnes"),
    [mediaRows]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8 lg:px-8">
      <div className="space-y-8">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[2rem] shadow-[0_25px_70px_rgba(2,8,23,0.42)]" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-raised)" }}>
          {/* Tricolore */}
          <div className="flex h-1.5 w-full">
            <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
            <div className="flex-1" style={{ background: "white" }} />
            <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
          </div>
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--cc-flag-blue) 15%, transparent)" }} />
          <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--cc-success) 8%, transparent)" }} />

          <div className="relative px-5 py-7 sm:px-8 sm:py-9 text-center">
            {/* Bouton retour */}
            <div className="absolute left-5 top-5 sm:left-8">
              <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-medium transition" style={{ color: "var(--cc-text-muted)" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Retour
              </button>
            </div>

            <div className="mb-3 inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 20%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 10%, transparent)", color: "var(--cc-primary)" }}>
              <Headphones size={12} /> Bibliothèque audio
            </div>
            <h1 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: "var(--cc-text)" }}>
              Préparez-vous à l&apos;oral
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--cc-text-muted)" }}>
              Épisodes guidés • Voix naturelle • Format entretien réel
            </p>

            {/* Badge rôle */}
            <div className="mt-3 flex justify-center">
              {isAnonymous && (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
                  <User size={11} /> Sans compte — créez un compte gratuit
                </span>
              )}
              {isFreemium && (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 20%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 10%, transparent)", color: "var(--cc-primary)" }}>
                  <Sparkles size={11} /> Freemium — 2 épisodes gratuits par thème
                </span>
              )}
              {isPremium && (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "color-mix(in srgb, var(--cc-warning) 20%, transparent)", background: "color-mix(in srgb, var(--cc-warning) 10%, transparent)", color: "var(--cc-warning)" }}>
                  <Crown size={11} /> Premium — accès complet
                </span>
              )}
            </div>

            {/* CTA anonymous */}
            {isAnonymous && (
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button onClick={() => router.push("/register")} className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "var(--cc-primary)" }}>
                  Créer un compte gratuit
                </button>
                <button onClick={() => router.push("/login")} className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
                  Se connecter
                </button>
              </div>
            )}

            {/* CTA freemium upgrade */}
            {isFreemium && (
              <button onClick={handleUpgrade} className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "var(--cc-warning)" }}>
                <Crown size={13} /> Débloquer les 100 épisodes
              </button>
            )}
          </div>
        </section>

        {/* ── HERO BANNER NETFLIX (carrousel) ─────────────────────────── */}
        {!isAnonymous && featuredAlbums.length > 0 && (
          <section
            className="relative overflow-hidden rounded-[2rem] border shadow-[0_25px_70px_rgba(2,8,23,0.6)] min-h-[360px]" style={{ borderColor: "var(--cc-border)" }}
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onTouchStart={() => setCarouselPaused(true)}
            onTouchEnd={() => setCarouselPaused(false)}
            aria-roledescription="carousel"
            aria-label="Séries en vedette"
          >
            {featuredAlbums.map((album, i) => {
              const active = i === carouselIdx;
              return (
                <div
                  key={album.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                  aria-hidden={!active}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} / ${featuredAlbums.length}`}
                >
                  {/* Image de fond */}
                  <div className="absolute inset-0">
                    {album.image_url && (
                      <Image
                        src={album.image_url}
                        alt={album.subtheme_label}
                        fill
                        className="object-cover"
                        priority={i === 0}
                        unoptimized={album.image_url.startsWith("http")}
                      />
                    )}
                    {/* Intentional dark overlay for Netflix-style readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  </div>

                  {/* Contenu */}
                  <div className="relative flex h-full min-h-[360px] flex-col justify-end px-6 py-8 sm:px-10 sm:py-10 lg:justify-center">
                    <div className="max-w-lg">
                      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm" style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 30%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 20%, transparent)", color: "var(--cc-primary)" }}>
                        <Star size={10} /> En vedette
                      </span>
                      <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ color: "var(--cc-text)" }}>
                        {album.subtheme_label}
                      </h2>
                      {album.description && (
                        <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                          {album.description}
                        </p>
                      )}
                      <div className="mt-2 flex gap-3 text-xs" style={{ color: "var(--cc-text-muted)" }}>
                        <span>{album.episodeCount} épisodes</span>
                        <span>•</span>
                        <span>~{album.totalMinutes} min</span>
                        <span>•</span>
                        <span style={{ color: "var(--cc-success)" }}>Disponible</span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => router.push(`/audio/${encodeURIComponent(album.theme_key)}/${encodeURIComponent(album.subtheme_key)}`)}
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
                </div>
              );
            })}

            {/* Spacer : force la hauteur du conteneur puisque les slides sont absolus */}
            <div className="pointer-events-none invisible min-h-[360px]" aria-hidden />

            {/* Points de navigation */}
            {featuredAlbums.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {featuredAlbums.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIdx(i)}
                    aria-label={`Afficher le slide ${i + 1} sur ${featuredAlbums.length}`}
                    aria-current={i === carouselIdx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === carouselIdx
                        ? "w-6 bg-white"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── THÉMATIQUES ─────────────────────────────────────────────── */}
        {!isAnonymous && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--cc-text)" }}>
                  <GraduationCap size={18} /> Thématiques
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-disabled)" }}>Préparation civique • Entretien de naturalisation</p>
              </div>
              {!loading && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
                  {albums.length} séries
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-[1.5rem] animate-pulse" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)" }} />
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
                <h2 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--cc-text)" }}>
                  <Music size={18} /> Hymnes & Chants
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-disabled)" }}>Écouter et mémoriser les symboles sonores de la République</p>
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
              <h2 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--cc-text)" }}>
                <GraduationCap size={18} /> Thématiques
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-disabled)" }}>Créez un compte pour accéder aux épisodes</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {albums.map((album) => (
                <div key={album.id} className={`relative overflow-hidden rounded-[1.5rem] border opacity-50 ${album.accent_border ?? ""}`} style={!album.accent_border ? { borderColor: "var(--cc-border)" } : {}}>
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
                      <Lock size={28} style={{ color: "white" }} />
                    </div>
                  </div>
                  <div className="px-3 py-3" style={{ background: "var(--cc-surface-raised)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>{album.subtheme_label}</p>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--cc-text-disabled)" }}>{album.episodeCount} épisodes</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BIENTÔT DISPONIBLE ───────────────────────────────────────── */}
        {comingSoonRows.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--cc-text)" }}>
                <Rocket size={18} /> Bientôt disponible
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--cc-text-disabled)" }}>De nouvelles collections arrivent prochainement</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {comingSoonRows.map((item) => (
                <ComingSoonCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

      </div>
      {/* ── MODAL INFOS ─────────────────────────────────────────────── */}
      {showInfo && featuredAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.6)]" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-raised)" }}>
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
              {/* Intentional dark overlay for modal image */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button
                onClick={() => setShowInfo(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 transition hover:bg-black/70"
                style={{ color: "white" }}
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-6 pb-6">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${featuredAlbum.accent_text ?? ""}`}
                style={{
                  border: "1px solid color-mix(in srgb, var(--cc-primary) 30%, transparent)",
                  background: "color-mix(in srgb, var(--cc-primary) 10%, transparent)",
                  ...(featuredAlbum.accent_text ? {} : { color: "var(--cc-primary)" }),
                }}
              >
                {featuredAlbum.theme_label}
              </span>
              <h3 className="mt-2 text-xl font-extrabold" style={{ color: "var(--cc-text)" }}>{featuredAlbum.subtheme_label}</h3>
              {featuredAlbum.description && (
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--cc-text-muted)" }}>{featuredAlbum.description}</p>
              )}
              <div className="mt-3 flex gap-4 text-xs" style={{ color: "var(--cc-text-muted)" }}>
                <span className="flex items-center gap-1"><Mic size={12} /> {featuredAlbum.episodeCount} épisodes</span>
                <span className="flex items-center gap-1"><Timer size={12} /> ~{featuredAlbum.totalMinutes} min</span>
                <span className="flex items-center gap-1"><Headphones size={12} /> Voix naturelle</span>
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
    <div className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 20%, transparent)", background: "var(--cc-surface-raised)" }}>
      <div className="relative aspect-video w-full overflow-hidden rounded-t-[1.5rem]" style={{ background: "var(--cc-surface)" }}>
        {media.media_type === "youtube" && (
          <iframe
            src={media.media_url}
            title={media.title}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
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
        <p
          className={`text-[10px] font-bold uppercase tracking-widest ${media.accent ?? ""}`}
          style={media.accent ? {} : { color: "var(--cc-primary)" }}
        >
          {media.icon ?? "🎵"} {media.section === "hymnes" ? "Hymne national" : media.section === "podcasts" ? "Podcast" : "Média"}
        </p>
        <p className="mt-0.5 text-sm font-bold" style={{ color: "var(--cc-text)" }}>{media.title}</p>
        {media.author && (
          <p className="mt-0.5 text-[10px]" style={{ color: "var(--cc-text-disabled)" }}>Publié par <span style={{ color: "var(--cc-primary)" }}>{media.author}</span></p>
        )}
        {media.description && (
          <p className="mt-1 text-[11px]" style={{ color: "var(--cc-text-disabled)" }}>{media.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {youtubeWatchUrl && (
            <a
              href={youtubeWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition hover:opacity-80"
              style={{ borderColor: "color-mix(in srgb, var(--cc-danger) 20%, transparent)", background: "color-mix(in srgb, var(--cc-danger) 10%, var(--cc-surface))", color: "var(--cc-danger)" }}
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
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition hover:opacity-80"
              style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 20%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 10%, var(--cc-surface))", color: "var(--cc-primary)" }}
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
