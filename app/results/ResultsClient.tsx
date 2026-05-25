"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  AlertTriangle,
  Smartphone,
  MapPin,
  Lock,
  BookOpen,
  CheckCircle2,
  XCircle,
  Crown,
  TrendingUp,
  Lightbulb,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import {
  saveFeedbackToSupabase,
  loadLastResultsFromSupabase,
  loadLastResultFromSupabase,
} from "../../src/lib/saveResult";
import HistoryCard from "../../components/HistoryCard";
import ProgressionChart from "../../components/ProgressionChart";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatsDashboard from "../../components/StatsDashboard";
import type { ChoiceKey, Question, Theme } from "../../src/data/questions";
import { loadUser } from "../../src/lib/qcmUser";
import { useUser, ROLE_LIMITS } from "../components/UserContext";
import AiExplanationCard from "../components/AiExplanationCard";
import AiCoachCard from "../components/AiCoachCard";

function computeAdvancedStats(
  questions: Question[],
  answers: Record<string, ChoiceKey | null>
) {
  const themeStats: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    if (!themeStats[q.theme]) themeStats[q.theme] = { correct: 0, total: 0 };
    themeStats[q.theme].total++;
    const user = answers[q.id];
    if (user !== null && user === q.answer) themeStats[q.theme].correct++;
  }
  return {
    themeStats: themeStats as Record<Theme, { correct: number; total: number }>,
  };
}

function computeExpertScore(percent: number, level: 1 | 2 | 3) {
  const multiplier = level === 3 ? 1.4 : level === 2 ? 1.2 : 1.0;
  return Math.round(percent * multiplier);
}

function getRankLabel(percent: number) {
  if (percent >= 90) return "Excellent niveau";
  if (percent >= 75) return "Très bon niveau";
  if (percent >= 60) return "Niveau correct";
  if (percent >= 50) return "Niveau fragile";
  return "Insuffisant";
}

function getRankIcon(percent: number) {
  if (percent >= 90) return <Trophy size={15} />;
  if (percent >= 75) return <Medal size={15} />;
  if (percent >= 60) return <Award size={15} />;
  if (percent >= 50) return <Award size={15} />;
  return <AlertTriangle size={15} />;
}

type StoredResult = {
  meta: {
    level: 1 | 2 | 3;
    themes: string[];
    count: number;
    mode?: "train" | "exam";
  } | null;
  questions: Question[];
  answers: Record<string, ChoiceKey | null>;
  result: {
    correct: number;
    total: number;
    details: Array<{
      id: string;
      theme: string;
      question: string;
      user: ChoiceKey | null;
      correct: ChoiceKey;
      ok: boolean;
      explanation: string;
      choices: { key: ChoiceKey; label: string }[];
    }>;
  };
};

function choiceLabel(
  q: { choices: { key: ChoiceKey; label: string }[] },
  key?: ChoiceKey | null
) {
  if (!key) return "Aucune réponse";
  return q.choices.find((c) => c.key === key)?.label ?? "(Choix introuvable)";
}

const THEME_MAPPING: Record<string, string> = {
  Institutions: "Système institutionnel et politique",
  Valeurs: "Principes et valeurs de la République",
  Histoire: "Histoire, géographie et culture",
  Société: "Vivre dans la société française",
  "Système institutionnel et politique": "Système institutionnel et politique",
  "Principes et valeurs de la République":
    "Principes et valeurs de la République",
  "Histoire, géographie et culture": "Histoire, géographie et culture",
  "Vivre dans la société française": "Vivre dans la société française",
};

function ThemeRevisionCard({
  theme,
  correct,
  total,
}: {
  theme: string;
  correct: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPoor = pct < 70;
  const color = isPoor ? "var(--cc-danger)" : "var(--cc-success)";
  const supabaseTheme = THEME_MAPPING[theme] ?? theme;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border p-4"
      style={{
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        background: `color-mix(in srgb, ${color} 10%, var(--cc-surface))`,
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: "var(--cc-text)" }}>{theme}</p>
        <p className="mt-0.5 text-xs" style={{ color }}>
          {correct}/{total} correct{correct > 1 ? "s" : ""} · {pct}%
        </p>
      </div>

      <span className="shrink-0 text-base font-bold" style={{ color }}>{pct}%</span>

      <Link
        href={`/scroll?theme=${encodeURIComponent(supabaseTheme)}`}
        className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85"
        style={{ background: color, color: "var(--cc-surface)" }}
      >
        Réviser →
      </Link>
    </div>
  );
}

function StatTile({
  label,
  value,
  color = "var(--cc-primary)",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        background: `color-mix(in srgb, ${color} 10%, var(--cc-surface))`,
      }}
    >
      <div className="text-sm" style={{ color: "var(--cc-text-muted)" }}>{label}</div>
      <div className="mt-1 text-2xl font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function ResultsClient() {
  const router = useRouter();
  const prefetchScroll = () => {
    router.prefetch("/scroll");
  };
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") === "exam" ? "exam" : "train") as
    | "train"
    | "exam";
  const wantRate = searchParams.get("rate") === "1";

  const [data, setData] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sentFeedback, setSentFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { role } = useUser();
  const limits = ROLE_LIMITS[role];

  const PUBLIC_URL = "https://cap-citoyen.fr";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawUser = localStorage.getItem("qcm_user");
    if (!rawUser) return;
    try {
      const u = JSON.parse(rawUser) as { pseudo?: string };
      if (u?.pseudo) setPseudo(String(u.pseudo));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = loadUser();
    const email = u?.email ? u.email.trim().toLowerCase() : "";

    async function fetchResult() {
      const storageKey = email ? `last_result:${mode}:${email}` : null;
      const raw = (storageKey ? localStorage.getItem(storageKey) : null) ?? localStorage.getItem("last_result");
      if (raw) {
        try {
          setData(JSON.parse(raw));
          setLoading(false);
          return;
        } catch {}
      }

      if (email) {
        const remote = await loadLastResultFromSupabase(email, mode);
        if (remote) {
          setData({
            meta: {
              level: remote.level,
              themes: remote.themes,
              count: remote.score_total,
              mode: remote.mode,
            },
            questions: remote.questions,
            answers: remote.answers,
            result: {
              correct: remote.score_correct,
              total: remote.score_total,
              details: remote.details,
            },
          });
        }
      }
      setLoading(false);
    }

    fetchResult();
  }, [mode]);

  useEffect(() => {
    const u = loadUser();
    if (!u?.email) return;
    loadLastResultsFromSupabase(u.email.trim().toLowerCase(), mode).then(setHistory);
  }, [mode]);

  useEffect(() => {
    if (wantRate) {
      const el = document.getElementById("feedback");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [wantRate, data]);

  const score = useMemo(() => {
    if (!data) return null;
    const { correct, total } = data.result;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percent, passed: correct >= 32 };
  }, [data]);

  const wrong = useMemo(
    () => (!data ? [] : data.result.details.filter((d) => !d.ok)),
    [data]
  );

  const modeLabel = mode === "exam" ? "Mode examen blanc" : "Mode entraînement";

  const stats = useMemo(
    () => (!data ? null : computeAdvancedStats(data.questions, data.answers)),
    [data]
  );

  const expertScore = useMemo(
    () =>
      !data || !score ? null : computeExpertScore(score.percent, data.meta?.level ?? 1),
    [data, score]
  );

  const rank = useMemo(() => (!score ? null : getRankLabel(score.percent)), [score]);

  function replaySame() {
    if (!data?.meta) {
      router.push(mode === "exam" ? "/exam" : "/");
      return;
    }
    localStorage.setItem(
      "quiz_settings",
      JSON.stringify({
        ...data.meta,
        mode,
        perQuestion: mode === "exam" ? 30 : 20,
        maxDuration: mode === "exam" ? 900 : undefined,
      })
    );
    router.push("/quiz");
  }

  function share() {
    if (!score) return;
    const url = `${PUBLIC_URL}/`;
    const text = `🇫🇷 Je viens de faire une simulation Cap Citoyen 2026.
Score: ${score.correct}/${score.total} (${score.percent}%) — ${
      score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"
    }
Teste-toi ici: ${url}`;

    if (navigator.share) {
      navigator.share({ title: "Cap Citoyen", text, url }).catch(() => {});
      return;
    }

    localStorage.setItem("share_payload", JSON.stringify({ text, url }));
    router.push("/share");
  }

  function buildResultText() {
    const lines = [
      "Cap Citoyen — Résultat détaillé",
      `Date: ${new Date().toLocaleString("fr-FR")}`,
      `Niveau: ${data?.meta?.level ?? "—"}`,
      `Thèmes: ${data?.meta?.themes?.join(", ") ?? "—"}`,
      `Score: ${score?.correct ?? 0}/${score?.total ?? 0} (${score?.percent ?? 0}%)`,
      `Statut: ${score?.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}`,
      "",
      "Détails question par question :",
      "",
    ];

    for (const d of data?.result?.details ?? []) {
      lines.push(
        `• ${d.ok ? "✅" : "❌"} [${d.theme}] ${d.question}`,
        `  - Ta réponse : ${d.user ?? "— (non répondu)"}`,
        `  - Bonne réponse : ${d.correct}`,
        `  - Explication : ${d.explanation}`,
        ""
      );
    }

    return lines.join("\n");
  }

  async function copyDetailedResult() {
    try {
      await navigator.clipboard.writeText(buildResultText());
      setCopyMsg("Résultat détaillé copié. Colle-le dans ton e-mail et envoie-le.");
    } catch {
      setCopyMsg("Impossible de copier automatiquement. Essaie avec un autre navigateur.");
    }
    window.setTimeout(() => setCopyMsg(null), 4000);
  }

  function mailResult() {
    if (!data) return;

    const answeredCount = Object.values(data.answers || {}).filter(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    ).length;

    if (answeredCount < 32) {
      alert(
        `Pour envoyer le résultat par email, tu dois cocher au moins 32 réponses.\nActuellement : ${answeredCount}/40`
      );
      return;
    }

    const rawUser = localStorage.getItem("qcm_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const pseudoLocal = user?.pseudo || "Candidat";
    const email = user?.email || "";

    if (!email) {
      alert("Aucune adresse email enregistrée.");
      return;
    }

    const { correct, total } = data.result;
    const percent = Math.round((correct / total) * 100);
    const passed = correct >= 32;

    const wrongList = data.questions
      .map((q: any, i: number) => {
        const userKey = data.answers[q.id] as ChoiceKey | null | undefined;
        const correctKey = q.answer as ChoiceKey;
        return {
          idx: i + 1,
          theme: q.theme,
          question: q.question,
          isWrong: !userKey || userKey !== correctKey,
          userLabel: userKey
            ? `${userKey}) ${choiceLabel(q, userKey)}`
            : "Aucune réponse",
          correctLabel: `${correctKey}) ${choiceLabel(q, correctKey)}`,
          explanation: q.explanation || "",
        };
      })
      .filter((x: any) => x.isWrong);

    const errorsText =
      wrongList.length === 0
        ? "Aucune erreur ! Bravo !"
        : wrongList
            .slice(0, 25)
            .map(
              (d: any) =>
                `#${d.idx} • ${d.theme}\n${d.question}\n\nTa réponse : ${d.userLabel}\nBonne réponse : ${d.correctLabel}\n${
                  d.explanation ? `Explication : ${d.explanation}` : ""
                }`
            )
            .join("\n\n---------------------------------\n\n");

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      `Résultat Cap Citoyen — ${pseudoLocal}`
    )}&body=${encodeURIComponent(
      `Bonjour ${pseudoLocal},

Score : ${correct}/${total} (${percent}%)
Réponses cochées : ${answeredCount}/${total}
Statut : ${passed ? "VALIDÉ" : "NON VALIDÉ"}

=================================
QUESTIONS À REVOIR
=================================
${errorsText}

— Cap Citoyen`
    )}`;
  }

  async function sendFeedback() {
    if (!rating || sendingFeedback) return;
    setSendingFeedback(true);

    try {
      const u = loadUser();
      await saveFeedbackToSupabase({
        email: u?.email ?? "",
        pseudo: pseudo || "Anonyme",
        rating,
        comment: comment?.trim() ?? "",
        page: "results",
        score_percent: score?.percent,
      });
      setSentFeedback(true);
    } catch {
      alert("Impossible d'envoyer l'avis. Réessaie.");
    } finally {
      setSendingFeedback(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-surface)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--cc-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--cc-text-muted)" }}>Chargement des résultats…</p>
        </div>
      </div>
    );
  }

  if (!data || !score || !stats || !rank || expertScore === null) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <h1 className="text-xl font-bold" style={{ color: "var(--cc-text)" }}>Aucun résultat</h1>
          <p className="mt-2" style={{ color: "var(--cc-text-muted)" }}>
            Lance un test pour voir tes résultats ici.
          </p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Aller à l'accueil
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 space-y-6 sm:px-6 sm:py-8">
      {/* ===== HERO HEADER ===== */}
      <section className="relative overflow-hidden rounded-[2rem] shadow-[0_25px_70px_rgba(2,8,23,0.42)]" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-raised)" }}>
        <div className="flex h-1.5 w-full">
          <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
          <div className="flex-1" style={{ background: "var(--cc-surface-raised)" }} />
          <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
        </div>

        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--cc-flag-blue) 15%, transparent)" }} />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--cc-primary) 10%, transparent)" }} />

        <div className="relative p-5 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl backdrop-blur-md" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--cc-text)" }}>
                  <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: "var(--cc-text-muted)" }}>
                  République française
                </div>
                <div className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
                  {modeLabel} • Simulation 2026
                </div>
              </div>

              <span className="ml-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
                <span className="inline-flex h-3 w-5 overflow-hidden rounded-sm" style={{ border: "1px solid var(--cc-border)" }}>
                  <span className="w-1/3" style={{ background: "var(--cc-flag-blue)" }} />
                  <span className="w-1/3" style={{ background: "var(--cc-surface-raised)" }} />
                  <span className="w-1/3" style={{ background: "var(--cc-flag-red)" }} />
                </span>
                FR
              </span>
            </div>

            <Button variant="secondary" onClick={() => router.push("/")}>
              Retour accueil
            </Button>
          </div>

          <div className="mt-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--cc-text)" }}>
                {pseudo ? `${pseudo}, voici ton résultat` : "Résultats"}
              </h1>
              <p className="mt-2" style={{ color: "var(--cc-text-muted)" }}>
                Niveau {data.meta?.level ?? "—"} •{" "}
                {data.meta?.themes?.join(", ") ?? "—"} • {score.total} questions
              </p>
            </div>

            {limits.canSeeThemeStats ? (
              score.passed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: "color-mix(in srgb, var(--cc-success) 30%, transparent)", background: "color-mix(in srgb, var(--cc-success) 10%, var(--cc-surface))", color: "var(--cc-success)" }}>
                  <CheckCircle2 size={14} /> VALIDÉ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: "color-mix(in srgb, var(--cc-danger) 30%, transparent)", background: "color-mix(in srgb, var(--cc-danger) 10%, var(--cc-surface))", color: "var(--cc-danger)" }}>
                  <XCircle size={14} /> NON VALIDÉ
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 30%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 10%, var(--cc-surface))", color: "var(--cc-primary)" }}>
                {getRankIcon(score.percent)} {rank}
              </span>
            )}
          </div>
        </div>
      </section>

      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Score" value={`${score.correct}/${score.total}`} color="var(--cc-primary)" />
          <StatTile label="Pourcentage" value={`${score.percent}%`} color="var(--cc-success)" />
          <StatTile label="Erreurs" value={String(wrong.length)} color="var(--cc-danger)" />
        </div>

        <div className="mt-6 rounded-[1.6rem] p-6" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)" }}>
          <div className="text-sm" style={{ color: "var(--cc-text-muted)" }}>Classement</div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-extrabold" style={{ color: "var(--cc-text)" }}>
            {getRankIcon(score.percent)}
            {rank}
          </div>
          <div className="mt-2 text-sm" style={{ color: "var(--cc-text-muted)" }}>
            Score expert : <span className="font-bold" style={{ color: "var(--cc-text)" }}>{expertScore}</span>
          </div>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          <button onClick={replaySame}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid color-mix(in srgb, var(--cc-primary) 30%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 8%, var(--cc-surface))", color: "var(--cc-primary)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Réessayer</span>
          </button>
          <button onClick={() => router.push(mode === "exam" ? "/exam" : "/")}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Nouveau test</span>
          </button>
          <button onClick={copyDetailedResult}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Copier</span>
          </button>
          <button onClick={mailResult}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid color-mix(in srgb, var(--cc-primary) 20%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 8%, var(--cc-surface))", color: "var(--cc-primary)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Email</span>
          </button>
          <button onClick={() => { const el = document.getElementById("feedback"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid color-mix(in srgb, var(--cc-warning) 30%, transparent)", background: "color-mix(in srgb, var(--cc-warning) 8%, var(--cc-surface))", color: "var(--cc-warning)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Avis</span>
          </button>
          <button onClick={() => router.push("/leaderboard")}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid color-mix(in srgb, var(--cc-warning) 30%, transparent)", background: "color-mix(in srgb, var(--cc-warning) 8%, var(--cc-surface))", color: "var(--cc-warning)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Classement</span>
          </button>
          <button onClick={share}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid color-mix(in srgb, var(--cc-success) 30%, transparent)", background: "color-mix(in srgb, var(--cc-success) 8%, var(--cc-surface))", color: "var(--cc-success)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Partager</span>
          </button>
          <button onClick={() => router.push("/resources")}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95"
            style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-[10px] font-medium leading-tight text-center">Liens officiels</span>
          </button>
        </div>

        {/* ===== BLOC MODE FICHES ===== */}
        <div
          className="mt-6 rounded-[1.5rem] p-5"
          style={{ border: "1px solid color-mix(in srgb, var(--cc-primary) 25%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 6%, var(--cc-surface))" }}
          onMouseEnter={prefetchScroll}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ border: "1px solid color-mix(in srgb, var(--cc-primary) 25%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 12%, var(--cc-surface))", color: "var(--cc-primary)" }}>
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>Mode fiches — révision par swipe</p>
              <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
                Swipe les questions • scroll vertical • scroll horizontal
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const url = data.meta?.themes?.[0]
                ? `/scroll?theme=${encodeURIComponent(data.meta.themes[0])}`
                : "/scroll";
              router.push(url);
            }}
            className="w-full rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 active:scale-95"
            style={{ background: "var(--cc-primary)", color: "var(--cc-surface)", border: "none" }}
          >
            Réviser ce thème
          </button>
        </div>

        {/* ===== BLOC CENTRE AGRÉÉ ===== */}
        <div className="mt-6 rounded-[1.5rem] p-5" style={{ border: "1px solid color-mix(in srgb, var(--cc-warning) 30%, transparent)", background: "color-mix(in srgb, var(--cc-warning) 6%, var(--cc-surface))" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ border: "1px solid color-mix(in srgb, var(--cc-warning) 30%, transparent)", background: "color-mix(in srgb, var(--cc-warning) 12%, var(--cc-surface))", color: "var(--cc-warning)" }}>
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>
                Passer l'examen dans un centre
              </p>
              <p className="text-xs" style={{ color: "var(--cc-text-muted)" }}>
                Consulte la carte officielle pour trouver un centre agréé proche de chez toi.
              </p>
            </div>
          </div>

          <a
            href="https://www.cci.fr/formation/cci-formez-vous-avec-le-test-dintegration-republicaine"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 active:scale-95"
            style={{ background: "var(--cc-warning)", color: "var(--cc-surface)", border: "none" }}
          >
            <MapPin size={14} /> Trouver un centre agréé ↗
          </a>

          <p className="mt-3 text-xs text-center" style={{ color: "var(--cc-text-disabled)" }}>
            Lien officiel CCI France • Tarifs et disponibilités variables selon le centre
          </p>
        </div>

        {copyMsg && (
          <p className="mt-3 text-sm" style={{ color: "var(--cc-text-muted)" }}>{copyMsg}</p>
        )}

        {limits.canSeeThemeStats && (
          <p className="mt-4 text-sm" style={{ color: "var(--cc-text-muted)" }}>
            Règle : validation si <strong style={{ color: "var(--cc-text)" }}>≥ 32</strong> réponses correctes sur 40.
          </p>
        )}
      </Card>

      {/* ===== COACHING IA ===== */}
      {data && score && stats && (
        <Card>
          <AiCoachCard
            scorePercent={score.percent}
            correctCount={score.correct}
            totalQuestions={score.total}
            strengths={
              Object.entries(stats.themeStats)
                .filter(([, v]) => v.total > 0 && (v.correct / v.total) >= 0.7)
                .map(([k]) => k)
            }
            weaknesses={
              Object.entries(stats.themeStats)
                .filter(([, v]) => v.total > 0 && (v.correct / v.total) < 0.7)
                .map(([k]) => k)
            }
          />
        </Card>
      )}

      {/* ===== EXAM CONVERSION — visible pour anonymous/freemium en mode examen ===== */}
      {mode === "exam" && !limits.canSeeThemeStats && (
        <div
          className="overflow-hidden rounded-[1.8rem] border"
          style={{
            borderColor: "color-mix(in srgb, var(--cc-primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--cc-primary) 5%, var(--cc-surface))",
          }}
        >
          {/* Tricolore */}
          <div className="flex h-1 w-full">
            <div className="flex-1" style={{ background: "var(--cc-flag-blue)" }} />
            <div className="flex-1" style={{ background: "white" }} />
            <div className="flex-1" style={{ background: "var(--cc-flag-red)" }} />
          </div>

          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="mb-5 text-center">
              <span className="cc-badge cc-badge-info mb-3 block w-fit mx-auto">Résultats examen blanc</span>
              <h2 className="text-xl font-extrabold" style={{ color: "var(--cc-text)" }}>
                Débloquez votre analyse complète
              </h2>
              <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--cc-text-muted)" }}>
                {score.passed
                  ? `Bravo — ${score.correct}/${score.total} (${score.percent}%) ! Accédez aux stats détaillées pour confirmer vos points forts.`
                  : `Score : ${score.correct}/${score.total} (${score.percent}%). Vos erreurs par thème sont masquées — choisissez un Pass pour les analyser.`}
              </p>
            </div>

            {/* Ce que ça débloque */}
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Stats par thème" },
                { label: "Corrections IA" },
                { label: "Coach IA" },
                { label: "Examens illimités" },
              ].map((feat) => (
                <div
                  key={feat.label}
                  className="rounded-xl border px-3 py-2 text-center text-xs font-medium"
                  style={{ borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 8%, var(--cc-surface))", color: "var(--cc-primary)" }}
                >
                  {feat.label}
                </div>
              ))}
            </div>

            {/* Plans */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--cc-text-muted)" }}>Pass Express</div>
                <div className="text-2xl font-extrabold" style={{ color: "var(--cc-primary)" }}>4,99 €</div>
                <div className="text-xs mb-3" style={{ color: "var(--cc-text-disabled)" }}>7 jours · accès immédiat</div>
                <a href="/pricing" className="cc-btn cc-btn-secondary w-full justify-center text-xs block text-center">
                  Choisir
                </a>
              </div>

              <div
                className="rounded-2xl border p-4 relative"
                style={{ borderColor: "var(--cc-primary)", background: "var(--cc-primary-soft)" }}
              >
                <div
                  className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "var(--cc-primary)", color: "var(--cc-surface)" }}
                >
                  Recommandé
                </div>
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--cc-text)" }}>Pass Sérénité</div>
                <div className="text-2xl font-extrabold" style={{ color: "var(--cc-primary)" }}>9,99 €</div>
                <div className="text-xs mb-3" style={{ color: "var(--cc-text-muted)" }}>30 jours · 4× plus de temps</div>
                <a href="/pricing" className="cc-btn cc-btn-primary w-full justify-center text-xs block text-center">
                  Choisir
                </a>
              </div>
            </div>

            {role === "anonymous" && (
              <p className="mt-4 text-center text-xs" style={{ color: "var(--cc-text-disabled)" }}>
                Pas encore de compte ?{" "}
                <a href="/register" className="transition hover:opacity-80" style={{ color: "var(--cc-primary)" }}>
                  Créer un compte gratuit →
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== STATS PAR THÈME — gated ===== */}
      {!limits.canSeeThemeStats ? (
        <div className="relative overflow-hidden rounded-[1.8rem]">
          {/* Aperçu flouté */}
          <div className="pointer-events-none select-none blur-sm opacity-60">
            <Card>
              <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>Performance par thème</h2>
              <div className="mt-4 space-y-3">
                {["Valeurs", "Institutions", "Histoire", "Société"].map((theme) => (
                  <div key={theme} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                    <span className="text-sm" style={{ color: "var(--cc-text-muted)" }}>{theme}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full" style={{ background: "var(--cc-border)" }}>
                        <div className="h-2 rounded-full" style={{ width: "65%", background: "var(--cc-primary)" }} />
                      </div>
                      <span className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>65%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.8rem] p-6 text-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(2px)" }}>
            <Lock size={40} className="mx-auto mb-3" style={{ color: "var(--cc-text-muted)" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--cc-text)" }}>
              <span className="flex items-center justify-center gap-2">
                {role === "anonymous"
                  ? score.percent === 100
                    ? <><Sparkles size={18} /> Score parfait — sauvegarde cette performance !</>
                    : score.percent >= 75
                    ? <><TrendingUp size={18} /> Inscris-toi pour suivre ta progression</>
                    : <><Lightbulb size={18} /> Inscris-toi pour comprendre et progresser</>
                  : <><Sparkles size={18} /> Choisissez un Pass pour tout débloquer</>}
              </span>
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--cc-text-muted)" }}>
              {role === "anonymous"
                ? score.percent === 100
                  ? "Tu viens de faire un sans-faute ! Crée un compte pour sauvegarder ce résultat et suivre ta progression."
                  : score.percent >= 75
                  ? "Tu progresses bien ! Crée un compte gratuit pour garder un historique de tes résultats."
                  : "Accède aux stats détaillées, corrections complètes et tous les niveaux."
                : "Analyse tes erreurs par thème et comprends où tu dois progresser."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {role === "anonymous" ? (
                <>
                  <a href="/register" className="cc-btn cc-btn-primary">
                    Créer un compte gratuit
                  </a>
                  <a href="/login" className="cc-btn cc-btn-secondary">
                    J'ai déjà un compte
                  </a>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <a href="/pricing" className="cc-btn cc-btn-primary">
                    <Sparkles size={15} /> Choisir un Pass
                  </a>
                  <a href="/login" className="text-xs transition hover:opacity-80" style={{ color: "var(--cc-text-disabled)" }}>
                    J'ai déjà un compte →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>Performance par thème</h2>
            <p className="mt-1" style={{ color: "var(--cc-text-muted)" }}>Analyse stratégique de tes résultats.</p>
            <div className="mt-6">
              <StatsDashboard themeStats={stats.themeStats} />
            </div>
            <div className="mt-6 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
                <BookOpen size={15} style={{ color: "var(--cc-primary)" }} />
                Révise un thème en mode flash-cards
              </p>
              {Object.entries(stats.themeStats).map(([theme, { correct, total }]) => (
                <ThemeRevisionCard key={theme} theme={theme} correct={correct} total={total} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>Heatmap des réponses</h2>
            <p className="mt-1" style={{ color: "var(--cc-text-muted)" }}>Vert = bonne réponse • Rouge = erreur</p>
            <div className="mt-6 grid grid-cols-10 gap-2">
              {data.questions.map((q, i) => (
                <div key={q.id}
                  className="h-6 w-6 rounded-md transition"
                  style={{ background: data.answers[q.id] !== q.answer ? "var(--cc-danger)" : "var(--cc-success)" }}
                  title={`Question ${i + 1} — ${q.theme}`}
                />
              ))}
            </div>
          </Card>

          <HistoryCard entries={history} mode={mode} />
          <ProgressionChart entries={history} />

          <Card>
            <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>Réviser mes erreurs</h2>
            <p className="mt-1" style={{ color: "var(--cc-text-muted)" }}>Lis l'explication et refais un test pour consolider.</p>
            {wrong.length === 0 ? (
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--cc-success) 30%, transparent)", background: "color-mix(in srgb, var(--cc-success) 10%, var(--cc-surface))", color: "var(--cc-success)" }}>
                <PartyPopper size={18} />
                <span>Aucune erreur sur ce test. Bravo !</span>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {wrong.slice(0, 20).map((d, i) => (
                  <div key={d.id} className="rounded-2xl p-4" style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-sm" style={{ color: "var(--cc-text-muted)" }}>#{i + 1} • {d.theme}</div>
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold" style={{ borderColor: "color-mix(in srgb, var(--cc-danger) 30%, transparent)", background: "color-mix(in srgb, var(--cc-danger) 10%, var(--cc-surface))", color: "var(--cc-danger)" }}>
                        <XCircle size={11} /> Faux
                      </span>
                    </div>
                    <div className="mt-2 font-semibold" style={{ color: "var(--cc-text)" }}>{d.question}</div>
                    <div className="mt-3 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "color-mix(in srgb, var(--cc-danger) 25%, transparent)", background: "color-mix(in srgb, var(--cc-danger) 8%, var(--cc-surface))" }}>
                      <span className="font-semibold" style={{ color: "var(--cc-danger)" }}>✗ Ta réponse :</span>{" "}
                      <span style={{ color: "var(--cc-danger)" }}>
                        {d.user ? `${d.user}) ${d.choices.find(c => c.key === d.user)?.label ?? ""}` : "— (non répondu)"}
                      </span>
                    </div>
                    <div className="mt-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "color-mix(in srgb, var(--cc-success) 25%, transparent)", background: "color-mix(in srgb, var(--cc-success) 8%, var(--cc-surface))" }}>
                      <span className="font-semibold" style={{ color: "var(--cc-success)" }}>✓ Bonne réponse :</span>{" "}
                      <span style={{ color: "var(--cc-success)" }}>
                        {d.correct}) {d.choices.find(c => c.key === d.correct)?.label ?? ""}
                      </span>
                    </div>
                    <div className="mt-3 text-sm" style={{ color: "var(--cc-text-muted)" }}>
                      <span className="font-semibold" style={{ color: "var(--cc-text)" }}>Explication :</span>{" "}
                      {d.explanation}
                    </div>
                    <AiExplanationCard
                      questionId={d.id}
                      question={d.question}
                      userAnswer={d.user ?? ""}
                      correctAnswer={d.correct}
                      explanation={d.explanation}
                      choices={d.choices}
                      theme={d.theme}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ===== FEEDBACK ===== */}
      <div id="feedback">
        <Card>
          <h2 className="text-lg font-bold" style={{ color: "var(--cc-text)" }}>Notez votre expérience</h2>
          <p className="mt-1" style={{ color: "var(--cc-text-muted)" }}>
            Votre avis nous aide à améliorer la simulation.
          </p>

          {sentFeedback ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--cc-success) 30%, transparent)", background: "color-mix(in srgb, var(--cc-success) 10%, var(--cc-surface))", color: "var(--cc-success)" }}>
              <CheckCircle2 size={16} /> Merci — avis enregistré.
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="h-10 w-10 rounded-xl border font-semibold transition"
                    style={rating === n
                      ? { borderColor: "color-mix(in srgb, var(--cc-primary) 30%, transparent)", background: "color-mix(in srgb, var(--cc-primary) 15%, var(--cc-surface))", color: "var(--cc-primary)" }
                      : { borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <textarea
                className="mt-4 min-h-[130px] w-full rounded-2xl p-4 text-sm focus:outline-none"
                style={{ border: "1px solid var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)" }}
                placeholder="Un commentaire (optionnel) : ce que tu as aimé / à améliorer…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="mt-4 flex gap-3 flex-wrap">
                <Button onClick={sendFeedback} disabled={!rating || sendingFeedback}>
                  {sendingFeedback ? "Envoi..." : "Envoyer"}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setRating(null); setComment(""); }}
                >
                  Effacer
                </Button>
              </div>

              <p className="mt-3 text-xs" style={{ color: "var(--cc-text-muted)" }}>
                Choisis une note (1 à 5).
              </p>
            </>
          )}
        </Card>
      </div>

      <form
        name="feedback"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        hidden
      >
        <input type="hidden" name="form-name" value="feedback" />
        <input name="pseudo" />
        <input name="rating" />
        <textarea name="comment" />
        <input name="createdAt" />
        <input name="page" />
        <input name="score" />
        <input name="meta" />
      </form>
    </main>
  );
}
