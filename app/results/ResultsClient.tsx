"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

// Précharge la page scroll au survol

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

function getRank(percent: number) {
  if (percent >= 90) return "🏆 Excellent niveau";
  if (percent >= 75) return "🥇 Très bon niveau";
  if (percent >= 60) return "🥈 Niveau correct";
  if (percent >= 50) return "🥉 Niveau fragile";
  return "⚠️ Insuffisant";
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
  const supabaseTheme = THEME_MAPPING[theme] ?? theme;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
        isPoor
          ? "border-red-400/20 bg-red-500/10"
          : "border-emerald-400/20 bg-emerald-500/10"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{theme}</p>
        <p
          className={`mt-0.5 text-xs ${
            isPoor ? "text-red-200" : "text-emerald-200"
          }`}
        >
          {correct}/{total} correct{correct > 1 ? "s" : ""} · {pct}%
        </p>
      </div>

      <span
        className={`shrink-0 text-base font-bold ${
          isPoor ? "text-red-300" : "text-emerald-300"
        }`}
      >
        {pct}%
      </span>

      <Link
        href={`/scroll?theme=${encodeURIComponent(supabaseTheme)}`}
        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85 ${
          isPoor
            ? "bg-red-500 text-white"
            : "bg-emerald-400 text-slate-950"
        }`}
      >
        Réviser →
      </Link>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
  accent?: "blue" | "emerald" | "red" | "amber";
}) {
  const styles = {
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    red: "border-red-400/20 bg-red-500/10 text-red-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[accent]}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

export default function ResultsClient() {
  const router = useRouter();
  const prefetchScroll = () => {
  router.prefetch('/scroll');
};
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") === "exam" ? "exam" : "train") as
    | "train"
    | "exam";
  const wantRate = searchParams.get("rate") === "1";

  const [data, setData] = useState<StoredResult | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sentFeedback, setSentFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { role } = useUser();
  const limits = ROLE_LIMITS[role];

  const PUBLIC_URL = "https://qcm-assimilation-fr.netlify.app";

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
      const raw = storageKey ? localStorage.getItem(storageKey) : null;
      if (raw) {
        try {
          setData(JSON.parse(raw));
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
    }

    fetchResult();
  }, [mode]);

  useEffect(() => {
    const u = loadUser();
    if (!u?.email) return;
    loadLastResultsFromSupabase(u.email.trim().toLowerCase(), mode).then(
      setHistory
    );
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

  const rank = useMemo(() => (!score ? null : getRank(score.percent)), [score]);

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
    const text = `🇫🇷 Je viens de faire une simulation QCM Assimilation 2026.
Score: ${score.correct}/${score.total} (${score.percent}%) — ${
      score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"
    }
Teste-toi ici: ${url}`;

    if (navigator.share) {
      navigator.share({ title: "QCM Assimilation FR", text, url }).catch(() => {});
      return;
    }

    localStorage.setItem("share_payload", JSON.stringify({ text, url }));
    router.push("/share");
  }

  function buildResultText() {
    const lines = [
      "QCM Assimilation FR — Résultat détaillé",
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
      setCopyMsg(
        "✅ Résultat détaillé copié. Colle-le dans ton e-mail et envoie-le."
      );
    } catch {
      setCopyMsg(
        "❌ Impossible de copier automatiquement. Essaie avec un autre navigateur."
      );
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
        ? "Aucune erreur 🎉 Bravo !"
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
      `Résultat QCM Assimilation — ${pseudoLocal}`
    )}&body=${encodeURIComponent(
      `Bonjour ${pseudoLocal},

Score : ${correct}/${total} (${percent}%)
Réponses cochées : ${answeredCount}/${total}
Statut : ${passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}

=================================
QUESTIONS À REVOIR
=================================
${errorsText}

— QCM Assimilation FR`
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

  if (!data || !score || !stats || !rank || expertScore === null) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <h1 className="text-xl font-bold text-white">Aucun résultat</h1>
          <p className="mt-2 text-slate-300">
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
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/92 to-slate-800/92 shadow-[0_25px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl">
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-red-600" />
        </div>

        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative p-5 sm:p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-slate-200"
                >
                  <path
                    d="M20 21a8 8 0 0 0-16 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest text-slate-400">
                  République française
                </div>
                <div className="text-sm font-semibold text-white">
                  {modeLabel} • Simulation 2026
                </div>
              </div>

              <span className="ml-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                <span className="inline-flex h-3 w-5 overflow-hidden rounded-sm border border-white/10">
                  <span className="w-1/3 bg-blue-600" />
                  <span className="w-1/3 bg-white" />
                  <span className="w-1/3 bg-red-600" />
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
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {pseudo ? `${pseudo}, voici ton résultat` : "Résultats"}
              </h1>
              <p className="mt-2 text-slate-300">
                Niveau {data.meta?.level ?? "—"} •{" "}
                {data.meta?.themes?.join(", ") ?? "—"} • {score.total} questions
              </p>
            </div>

            {limits.canSeeThemeStats ? (
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                score.passed
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/20 bg-red-500/10 text-red-200"
              }`}>
                {score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}
              </span>
            ) : (
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-200">
                {rank}
              </span>
            )}
          </div>
        </div>
      </section>

      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Score" value={`${score.correct}/${score.total}`} accent="blue" />
          <StatTile label="Pourcentage" value={`${score.percent}%`} accent="emerald" />
          <StatTile label="Erreurs" value={String(wrong.length)} accent="red" />
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.03] p-6">
          <div className="text-sm text-slate-400">Classement</div>
          <div className="mt-1 text-2xl font-extrabold text-white">{rank}</div>
          <div className="mt-2 text-sm text-slate-300">
            Score expert : <span className="font-bold text-white">{expertScore}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
  <Button onClick={replaySame}>Réessayer</Button>
  <Button variant="secondary" onClick={() => router.push(mode === "exam" ? "/exam" : "/")}>
    Nouveau test
  </Button>
  <Button variant="secondary" onClick={copyDetailedResult}>
    Copier
  </Button>
  <Button variant="secondary" onClick={mailResult}>
    Email
  </Button>
  <Button variant="secondary" onClick={() => {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }}>
    Avis
  </Button>
  <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
    Classement
  </Button>
  <Button variant="secondary" onClick={share}>
    Partager
  </Button>
</div>

{/* ===== BLOC SCROLL — visible pour tous ===== */}
<div className="mt-6 rounded-[1.5rem] border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5" onMouseEnter={prefetchScroll}>
  <div className="flex items-center gap-3 mb-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-lg flex-shrink-0">
      📱
    </div>
    <div>
      <p className="text-sm font-bold text-white">Révise comme sur TikTok</p>
      <p className="text-xs text-slate-400">Swipe les questions •scroll vertical • scroll horizontal</p>
    </div>
  </div>
  <button
  onClick={() => {
    const url = data.meta?.themes?.[0] 
      ? `/scroll?theme=${encodeURIComponent(data.meta.themes[0])}` 
      : '/scroll';
    router.push(url);
  }}
  className="w-full rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 active:scale-95"
>
  Réviser ce thème
</button>
</div>

        {copyMsg && <p className="mt-3 text-sm text-slate-300">{copyMsg}</p>}

      {limits.canSeeThemeStats && (
  <p className="mt-4 text-sm text-slate-400">
    Règle : validation si <strong className="text-white">≥ 32</strong> réponses
    correctes sur 40.
  </p>
)}
      </Card>

      
        {!limits.canSeeThemeStats ? (
  <div className="relative overflow-hidden rounded-[1.8rem]">
    
    {/* Aperçu flouté — visible mais illisible */}
    <div className="pointer-events-none select-none blur-sm opacity-60">
      <Card>
        <h2 className="text-lg font-bold text-white">Performance par thème</h2>
        <div className="mt-4 space-y-3">
          {["Valeurs", "Institutions", "Histoire", "Société"].map((theme) => (
            <div key={theme} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-sm text-slate-300">{theme}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: "65%" }} />
                </div>
                <span className="text-xs text-slate-400">65%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Overlay avec CTA */}
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.8rem] bg-slate-900/80 backdrop-blur-[2px] p-6 text-center">
      <p className="text-3xl mb-3">🔒</p>
      <h2 className="text-xl font-bold text-white mb-2">
        {role === "anonymous" ? "Inscris-toi pour voir tes erreurs" : "Passe en Premium pour débloquer"}
      </h2>
      <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
        {role === "anonymous"
          ? "Comprends pourquoi tu as ce résultat, analyse tes performances par thème."
          : "Accède aux stats détaillées, corrections complètes et tous les niveaux."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {role === "anonymous" ? (
          <>
            <a href="/register" className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 text-sm transition">
              Créer un compte gratuit
            </a>
            <a href="/login" className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold px-6 py-3 text-sm transition">
              J'ai déjà un compte
            </a>
          </>
        ) : (
          <a href="/account" className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-6 py-3 text-sm transition">
            👑 Passer en Premium
          </a>
        )}
      </div>
    </div>
  </div>
      ) : (
        <>
          <Card>
            <h2 className="text-lg font-bold text-white">Performance par thème</h2>
            <p className="mt-1 text-slate-300">Analyse stratégique de tes résultats.</p>
            <div className="mt-6">
              <StatsDashboard themeStats={stats.themeStats} />
            </div>
            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-slate-200">
                📚 Révise un thème en mode flash-cards
              </p>
              {Object.entries(stats.themeStats).map(([theme, { correct, total }]) => (
                <ThemeRevisionCard key={theme} theme={theme} correct={correct} total={total} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-white">Heatmap des réponses</h2>
            <p className="mt-1 text-slate-300">Vert = bonne réponse • Rouge = erreur</p>
            <div className="mt-6 grid grid-cols-10 gap-2">
              {data.questions.map((q, i) => (
                <div key={q.id}
                  className={`h-6 w-6 rounded-md transition ${
                    data.answers[q.id] !== q.answer ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  title={`Question ${i + 1} — ${q.theme}`}
                />
              ))}
            </div>
          </Card>

          <HistoryCard entries={history} mode={mode} />
          <ProgressionChart entries={history} />

          <Card>
            <h2 className="text-lg font-bold text-white">Réviser mes erreurs</h2>
            <p className="mt-1 text-slate-300">Lis l'explication et refais un test pour consolider.</p>
            {wrong.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-green-400/20 bg-green-500/10 p-4 text-green-200">
                Bravo 🎉 Aucune erreur sur ce test.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {wrong.slice(0, 20).map((d, i) => (
                  <div key={d.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-sm text-slate-400">#{i + 1} • {d.theme}</div>
                      <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-200">Faux</span>
                    </div>
                    <div className="mt-2 font-semibold text-white">{d.question}</div>
                    <div className="mt-3 text-sm text-slate-200">
                      <span className="font-semibold text-white">Ta réponse :</span>{" "}
                      {d.user ?? "— (non répondu)"}
                    </div>
                    <div className="text-sm text-slate-200">
                      <span className="font-semibold text-white">Bonne réponse :</span>{" "}
                      {d.correct}
                    </div>
                    <div className="mt-3 text-sm text-slate-300">
                      <span className="font-semibold text-white">Explication :</span>{" "}
                      {d.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <div id="feedback">
        <Card>
          <h2 className="text-lg font-bold text-white">Notez votre expérience</h2>
          <p className="mt-1 text-slate-300">
            Votre avis nous aide à améliorer la simulation.
          </p>

          {sentFeedback ? (
            <div className="mt-4 rounded-2xl border border-green-400/20 bg-green-500/10 p-4 text-green-200">
              Merci ✅ Avis enregistré.
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`h-10 w-10 rounded-xl border font-semibold transition ${
                      rating === n
                        ? "border-blue-400/30 bg-blue-500/15 text-blue-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <textarea
                className="mt-4 min-h-[130px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
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
                  onClick={() => {
                    setRating(null);
                    setComment("");
                  }}
                >
                  Effacer
                </Button>
              </div>

              <p className="mt-3 text-xs text-slate-400">
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