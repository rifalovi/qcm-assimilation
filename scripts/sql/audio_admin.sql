-- =============================================================================
-- scripts/sql/audio_admin.sql
-- Schéma backend pour administrer la page Audio :
--   - audio_series  : albums (sous-thèmes)
--   - audio_episodes: épisodes reliés à un album
--   - audio_media   : hymnes, vidéos YouTube, PDF et autres médias autonomes
--
-- À exécuter une fois dans le SQL Editor de Supabase.
-- Idempotent : peut être rejoué sans casser l'existant.
--
-- PRÉ-REQUIS STORAGE :
--   1) bucket "audio"         (privé)  — épisodes MP3 (déjà utilisé)
--   2) bucket "public-assets" (public) — images, couvertures, PDF
--      Créer depuis Dashboard > Storage > New bucket (cocher "Public bucket").
-- =============================================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Fonction updated_at générique ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── audio_series ───────────────────────────────────────────────────────────
create table if not exists public.audio_series (
  id uuid primary key default gen_random_uuid(),
  subtheme_key   text unique not null,
  subtheme_label text not null,
  theme_key      text not null,
  theme_label    text not null,
  description    text,
  image_url      text,
  icon           text,
  accent_gradient text,
  accent_border   text,
  accent_text     text,
  featured       boolean not null default false,
  position       integer not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists audio_series_position_idx on public.audio_series(position);
create index if not exists audio_series_theme_idx    on public.audio_series(theme_key);

drop trigger if exists audio_series_updated_at on public.audio_series;
create trigger audio_series_updated_at
  before update on public.audio_series
  for each row execute function public.set_updated_at();

-- ─── audio_episodes ─────────────────────────────────────────────────────────
create table if not exists public.audio_episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.audio_series(id) on delete cascade,
  episode_slug   text unique not null,
  episode_number integer not null,
  episode_title  text not null,
  duration_target_seconds integer not null default 90,
  premium         boolean not null default true,
  is_free         boolean not null default false,
  audio_male_url   text,
  audio_female_url text,
  script          text,
  prompt          text,
  published       boolean not null default true,
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists audio_episodes_series_idx   on public.audio_episodes(series_id);
create index if not exists audio_episodes_position_idx on public.audio_episodes(series_id, position);

drop trigger if exists audio_episodes_updated_at on public.audio_episodes;
create trigger audio_episodes_updated_at
  before update on public.audio_episodes
  for each row execute function public.set_updated_at();

-- ─── audio_media (hymnes, vidéos, PDF…) ─────────────────────────────────────
create table if not exists public.audio_media (
  id uuid primary key default gen_random_uuid(),
  media_key     text unique not null,
  section       text not null default 'hymnes',   -- 'hymnes' | 'podcasts' | 'autres'
  title         text not null,
  description   text,
  media_type    text not null,                    -- 'youtube' | 'audio' | 'video' | 'pdf'
  media_url     text not null,
  thumbnail_url text,
  pdf_url       text,
  author        text,
  icon          text,
  accent        text,
  published     boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists audio_media_section_idx on public.audio_media(section, position);

drop trigger if exists audio_media_updated_at on public.audio_media;
create trigger audio_media_updated_at
  before update on public.audio_media
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.audio_series   enable row level security;
alter table public.audio_episodes enable row level security;
alter table public.audio_media    enable row level security;

-- Lecture publique : uniquement les lignes publiées
drop policy if exists "audio_series_public_read" on public.audio_series;
create policy "audio_series_public_read" on public.audio_series
  for select using (published = true);

drop policy if exists "audio_episodes_public_read" on public.audio_episodes;
create policy "audio_episodes_public_read" on public.audio_episodes
  for select using (published = true);

drop policy if exists "audio_media_public_read" on public.audio_media;
create policy "audio_media_public_read" on public.audio_media
  for select using (published = true);

-- Les écritures passent toujours par le service_role (bypass RLS),
-- via les routes /api/admin/audio/* protégées côté serveur.

-- ─── Seed initial (idempotent) ──────────────────────────────────────────────
-- Albums de base, réutilisés par la page /audio. On insère seulement si
-- la clé n'existe pas encore.
insert into public.audio_series (subtheme_key, subtheme_label, theme_key, theme_label, description, image_url, icon, accent_gradient, accent_border, accent_text, featured, position)
values
  ('valeurs_republique',     'Valeurs de la République',        'Valeurs',      'Valeurs',      'Liberté, Égalité, Fraternité — les valeurs fondamentales.', '/themes/valeurs_republique.jpg',     '🇫🇷', 'from-blue-600/30 to-indigo-600/20',   'border-blue-400/20',    'text-blue-300',    true,  1),
  ('droits_devoirs_citoyen', 'Droits et devoirs du citoyen',    'Valeurs',      'Valeurs',      'Droits fondamentaux et devoirs civiques en France.',        '/themes/droits_devoirs_citoyen.jpg', '🇫🇷', 'from-sky-600/30 to-blue-600/20',      'border-sky-400/20',     'text-sky-300',     false, 2),
  ('institutions',           'Institutions',                    'Institutions', 'Institutions', 'Président, Parlement, Gouvernement et Justice.',            '/themes/institutions.jpg',           '🏛️', 'from-violet-600/30 to-purple-600/20', 'border-violet-400/20',  'text-violet-300',  false, 3),
  ('histoire_geographie',    'Histoire et géographie',          'Histoire',     'Histoire',     'Repères historiques et géographiques essentiels.',          '/themes/histoire_geographie.jpg',    '📜', 'from-amber-600/30 to-orange-600/20',  'border-amber-400/20',   'text-amber-300',   false, 4),
  ('societe',                'Société',                         'Société',      'Société',      'Vie quotidienne, santé, éducation et services publics.',   '/themes/societe.jpg',                '👥', 'from-emerald-600/30 to-teal-600/20',  'border-emerald-400/20', 'text-emerald-300', false, 5),
  ('pourquoi_francais',      'Pourquoi devenir français(e)',    'Devenir français(e)', 'Devenir français(e)', 'Motivations et attentes du candidat à la naturalisation.', '/themes/devenir_francais.jpg', '🎖️', 'from-rose-600/30 to-pink-600/20',     'border-rose-400/20',    'text-rose-300',    false, 6),
  ('quiz_audio',             'Quiz Audio',                      'Quiz Audio',   'Quiz Audio',   'Tests audio interactifs pour réviser.',                     '/themes/quiz_audio.png',             '🎯', 'from-teal-600/30 to-cyan-600/20',     'border-teal-400/20',    'text-teal-300',    false, 7)
on conflict (subtheme_key) do nothing;

-- Hymne national (seed).
insert into public.audio_media (media_key, section, title, description, media_type, media_url, author, pdf_url, icon, accent, position)
values
  ('la-marseillaise',
   'hymnes',
   'La Marseillaise',
   'Écrite en 1792 • Symbole de la République française',
   'youtube',
   'https://www.youtube.com/embed/QY8tdnqdPwI',
   '@Hitoshi54140',
   '/La-Marseillaise-lhymne-national.pdf?v=3',
   '🇫🇷',
   'text-blue-300',
   1)
on conflict (media_key) do nothing;
