"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "../components/UserContext";

type LocalUser = { pseudo?: string; email?: string };

const OFFICIAL_LINKS = {
  centers: "https://www.service-public.gouv.fr/particuliers/vosdroits/R74875",
  examInfo:
    "https://www.immigration.interieur.gouv.fr/Immigration/Examen-civique-pour-une-premiere-demande-de-titre-de-sejour-pluriannuel",
  officialQuestions:
    "https://www.immigration.interieur.gouv.fr/Integration-et-Acces-a-la-nationalite/La-nationalite-francaise/Les-procedures-d-acces-a-la-nationalite-francaise",

  charter:
    "https://www.prefecturedepolice.interieur.gouv.fr/sites/default/files/Documents/Chartedesdroitsetdevoirs.pdf",
};

function loadLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

function HeroButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex min-w-[210px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200";
  const styles =
    variant === "primary"
      ? "border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_40px_rgba(37,99,235,0.36)] active:scale-[0.98]"
      : "border border-white/10 bg-slate-800/80 text-slate-100 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-blue-400/25 hover:bg-slate-700/85 active:scale-[0.98]";

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: string;
}) {
  return (
    <section className="card">
      <div className="mb-5 flex items-start gap-3">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
            {icon}
          </div>
        )}
        <div>
          <h2 className="section-title text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ChecklistItem({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/20">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm text-emerald-300">
          ✓
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-7 text-slate-300">{text}</p>
        </div>
      </div>
    </div>
  );
}

function PathStep({
  step,
  title,
  text,
  accent = "blue",
}: {
  step: string;
  title: string;
  text: string;
  accent?: "blue" | "violet" | "amber" | "emerald";
}) {
  const styles = {
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  };

  return (
    <div className={`rounded-[1.4rem] border p-5 ${styles[accent]} shadow-[0_18px_45px_rgba(2,8,23,0.22)]`}>
      <div className="mb-3 inline-flex rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
        Étape {step}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7">{text}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  cta,
  featured = false,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)] transition-all duration-300 hover:-translate-y-1 ${
        featured
          ? "border-blue-400/25 bg-gradient-to-br from-blue-500/12 via-indigo-500/10 to-sky-500/12"
          : "border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_35%)]" />

      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl ${
              featured
                ? "border-blue-400/20 bg-blue-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            {icon}
          </div>
          <div>
            {featured && (
              <div className="mb-1 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
                Fonctionnalité phare
              </div>
            )}
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>

        <p className="text-sm leading-7 text-slate-300">{description}</p>

        <div className="mt-5">
          <Link
            href={href}
            className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
              featured
                ? "border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]"
                : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 active:scale-[0.98]"
            }`}
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MindNode({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.22)]">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResourceLinkCard({
  icon,
  title,
  source,
  text,
  href,
  note,
}: {
  icon: string;
  title: string;
  source: string;
  text: string;
  href: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.22)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-slate-400">{source}</p>
        </div>
      </div>

      <p className="text-sm leading-7 text-slate-300">{text}</p>

      <div className="mt-5">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"
        >
          Voir plus ↗
        </a>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-500">{note}</p>
    </div>
  );
}

function AccountModal({
  open,
  onClose,
  onTest,
}: {
  open: boolean;
  onClose: () => void;
  onTest: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
              Commencez intelligemment
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Testez votre niveau et créez votre compte
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Faites d’abord un test pour voir votre niveau, puis créez un compte gratuit pour sauvegarder vos résultats et suivre votre progression.
            </p>
          </div>

          <button onClick={onClose} className="text-slate-500 transition hover:text-white">
            ✕
          </button>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <p className="text-sm font-bold text-white">Pourquoi commencer par un test ?</p>
              <p className="mt-1 text-sm leading-7 text-slate-300">
                Vous identifiez rapidement vos points forts, vos lacunes et les thèmes à réviser en priorité.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onTest}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Tester mes connaissances
          </button>

          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}

function PremiumModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 shadow-[0_25px_70px_rgba(2,8,23,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
              Débloquez le niveau supérieur
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Passez en Premium pour aller plus loin
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Accédez à plus de questions, aux niveaux avancés, aux statistiques détaillées et à une expérience de préparation plus complète.
            </p>
          </div>

          <button onClick={onClose} className="text-slate-500 transition hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">👑</div>
            <p className="text-sm leading-7 text-slate-300">
              Plus de contenu pour réviser sans limite trop vite atteinte.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-xl">📊</div>
            <p className="text-sm leading-7 text-slate-300">
              Une meilleure lecture de vos performances et de vos marges de progression.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-xl">🎯</div>
            <p className="text-sm leading-7 text-slate-300">
              Une préparation plus sérieuse avant le passage réel de l’examen.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(251,191,36,0.22)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Voir les offres Premium
          </Link>

          <Link
            href="/account"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            Mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const router = useRouter();
  const { username, role, loading } = useUser();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;

    const localUser = loadLocalUser();
    const hasRealAccount = Boolean(username);

    // Modal 1 : sans vrai compte (y compris pseudo compte local)
    if (!hasRealAccount) {
      const alreadySeen = sessionStorage.getItem("resources_account_modal_seen") === "1";
      if (alreadySeen) return;

      const timer = window.setTimeout(() => {
        setShowAccountModal(true);
        sessionStorage.setItem("resources_account_modal_seen", "1");
      }, 5000);

      return () => window.clearTimeout(timer);
    }

    // Modal 2 : compte existant mais non premium
    if (hasRealAccount && role !== "premium" && role !== "elite") {
      const alreadySeen = sessionStorage.getItem("resources_premium_modal_seen") === "1";
      if (alreadySeen) return;

      const timer = window.setTimeout(() => {
        setShowPremiumModal(true);
        sessionStorage.setItem("resources_premium_modal_seen", "1");
      }, 6000);

      return () => window.clearTimeout(timer);
    }
  }, [username, role, loading]);

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-8 sm:space-y-10">
          {/* HERO */}
          <section className="relative overflow-visible rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
            <div className="flex h-1.5 w-full">
              <div className="flex-1 bg-blue-600" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-red-600" />
            </div>

            <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl animate-soft-float" />

            <div className="relative px-5 py-7 sm:px-8 sm:py-9">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-14 overflow-hidden rounded-lg border border-white/10 shadow-md">
                    <span className="flex-1 bg-blue-700" />
                    <span className="flex-1 bg-white" />
                    <span className="flex-1 bg-red-600" />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      République française
                    </div>
                    <div className="text-xs text-slate-400">Plateforme d'entraînement 2026</div>
                  </div>
                </div>


              </div>

              <div className="text-center">
              <div className="mb-3 inline-flex w-fit items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 mx-auto">
                Ressources utiles
              </div>

              <h1 className="animate-title-reveal mx-auto max-w-5xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                Organisez votre <span className="text-blue-400">révision</span>, structurez votre{" "}
                <span className="text-blue-400">parcours</span> et avancez avec méthode.
              </h1>

              <p className="mx-auto mt-4 max-w-4xl text-sm leading-8 text-slate-300 sm:text-base">
                Cette page vous aide à mieux utiliser la plateforme, à prioriser vos efforts et à
                construire un parcours de préparation plus efficace, avant d’aller consulter les
                ressources externes.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                <HeroButton onClick={() => router.push("/scroll")} variant="primary">
                  🚀 Réviser en scroll
                </HeroButton>

                <HeroButton onClick={() => router.push("/quiz")} variant="secondary">
                  🎯 Faire un test
                </HeroButton>

                <HeroButton onClick={() => router.push("/results")} variant="secondary">
                  📊 Voir mes résultats
                </HeroButton>
              </div>
            </div>
            </div>
          </section>

          <SectionCard
            icon="✅"
            title="Checklist pour bien réussir"
            subtitle="Avant de penser au centre d’examen, assurez-vous d’avoir posé les bonnes bases."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ChecklistItem
                title="Commencer par un test"
                text="Faites une première session pour repérer rapidement votre niveau et identifier les thèmes qui vous posent le plus de difficultés."
              />
              <ChecklistItem
                title="Réviser régulièrement en scroll"
                text="Utilisez la révision courte et fréquente pour ancrer les notions sans vous fatiguer, en particulier sur les thèmes que vous maîtrisez moins."
              />
              <ChecklistItem
                title="Lire les explications après chaque erreur"
                text="Ne vous contentez pas de corriger : prenez le temps de comprendre pourquoi la bonne réponse est correcte."
              />
              <ChecklistItem
                title="Suivre ses résultats"
                text="Consultez vos scores, vos erreurs fréquentes et vos progrès pour ajuster votre stratégie de révision."
              />
              <ChecklistItem
                title="Revenir sur les thèmes faibles"
                text="Une progression réelle vient souvent d’un travail ciblé sur 1 ou 2 thèmes prioritaires, pas d’une révision dispersée."
              />
              <ChecklistItem
                title="Consulter les ressources officielles au bon moment"
                text="Les liens externes doivent venir en complément, une fois que vous avez déjà commencé à vous préparer sérieusement."
              />
            </div>
          </SectionCard>

          <SectionCard
            icon="🧭"
            title="Le parcours conseillé sur la plateforme"
            subtitle="Une méthode simple pour tirer le meilleur parti de l’application."
          >
            <div className="grid gap-4 lg:grid-cols-4">
              <PathStep
                step="1"
                title="Découvrir"
                text="Lisez la page info pour comprendre le cadre général, puis faites un premier test sans pression."
                accent="blue"
              />
              <PathStep
                step="2"
                title="Diagnostiquer"
                text="Analysez vos résultats pour repérer vos thèmes faibles et les types de questions qui vous bloquent."
                accent="violet"
              />
              <PathStep
                step="3"
                title="Réviser"
                text="Travaillez vos thèmes prioritaires en mode scroll pour progresser plus vite et mémoriser durablement."
                accent="amber"
              />
              <PathStep
                step="4"
                title="Valider"
                text="Refaites un test ou un examen blanc, puis utilisez les ressources externes comme étape suivante."
                accent="emerald"
              />
            </div>
          </SectionCard>

          <SectionCard
            icon="🧠"
            title="Carte mentale de préparation"
            subtitle="Une vue simple des grands leviers pour progresser efficacement."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <MindNode
                title="1. Comprendre"
                items={[
                  "Savoir ce qu’on attend de vous",
                  "Repérer les thèmes importants",
                  "Se familiariser avec la logique des questions",
                ]}
              />
              <MindNode
                title="2. S'entraîner"
                items={[
                  "Faire un test global",
                  "Identifier ses faiblesses",
                  "Mesurer son niveau de départ",
                ]}
              />
              <MindNode
                title="3. Réviser intelligemment"
                items={[
                  "Utiliser le scroll régulièrement",
                  "Relire les explications",
                  "Revenir sur les erreurs fréquentes",
                ]}
              />
              <MindNode
                title="4. Consolider"
                items={[
                  "Suivre ses progrès",
                  "Comparer ses nouveaux scores",
                  "Renforcer les thèmes fragiles",
                ]}
              />
              <MindNode
                title="5. Se projeter"
                items={[
                  "Faire un examen blanc",
                  "Gérer son rythme",
                  "Gagner en confiance",
                ]}
              />
              <MindNode
                title="6. Passer à l’étape suivante"
                items={[
                  "Consulter les ressources officielles",
                  "Vérifier le centre agréé",
                  "Choisir le bon moment",
                ]}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon="📱"
            title="Les meilleurs points d’entrée dans l’application"
            subtitle="Conservez une logique simple : d’abord l’apprentissage, ensuite l’action."
          >
            <div className="grid gap-5 md:grid-cols-3">
              <FeatureCard
                icon="📱"
                title="Réviser en scroll"
                description="Le mode le plus immersif pour apprendre rapidement, réviser souvent et revenir facilement sur un thème précis."
                href="/scroll"
                cta="Ouvrir la révision"
                featured
              />

              <FeatureCard
                icon="🎯"
                title="Faire un test"
                description="Le meilleur point de départ si vous voulez mesurer votre niveau actuel et savoir où concentrer vos efforts."
                href="/quiz"
                cta="Commencer un test"
              />

              <FeatureCard
                icon="📊"
                title="Voir mes résultats"
                description="La bonne page pour comprendre vos progrès, revoir vos erreurs et décider quoi réviser ensuite."
                href="/results"
                cta="Accéder aux résultats"
              />
            </div>
          </SectionCard>

          <SectionCard
            icon="🏛️"
            title="Ressources utiles à consulter au bon moment"
            subtitle="Des compléments officiels à utiliser sans quitter trop tôt votre parcours de révision."
          >
            <div className="grid gap-5 lg:grid-cols-4">
              <ResourceLinkCard
                icon="📍"
                title="Centre agréé"
                source="Service-Public"
                text="À consulter lorsque votre préparation est déjà bien avancée, pour vérifier les centres, les dates et les disponibilités."
                href={OFFICIAL_LINKS.centers}
                note="Tarifs et disponibilités variables selon le centre."
              />

              <ResourceLinkCard
                icon="📘"
                title="Informations officielles"
                source="Immigration / Intérieur"
                text="Pour relire le cadre officiel, vérifier certains points et compléter votre compréhension du dispositif."
                href={OFFICIAL_LINKS.examInfo}
                note="Source utile pour vérifier les modalités officielles de l’examen."
              />

              <ResourceLinkCard
                icon="📝"
                title="Questions / ressources officielles"
                source="Immigration / Intérieur"
                text="En complément de l’application, pour recouper vos révisions avec les ressources publiques disponibles."
                href={OFFICIAL_LINKS.officialQuestions}
                note="À utiliser comme complément, pas comme point de départ principal."
              />
              <ResourceLinkCard
  icon="📜"
  title="Charte des droits et devoirs du citoyen français"
  source="République française"
  text="Document officiel remis lors de la naturalisation. Il résume les valeurs, principes et responsabilités du citoyen français."
  href={OFFICIAL_LINKS.charter}
  note="PDF officiel — à lire pour bien comprendre les valeurs de la République."
/>








            </div>
          </SectionCard>
        </div>
      </main>

      <AccountModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onTest={() => {
          setShowAccountModal(false);
          router.push("/quiz");
        }}
      />

      <PremiumModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}