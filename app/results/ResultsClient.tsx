"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { saveFeedbackToSupabase } from "../../src/lib/saveResult";
import { loadLastResultsFromSupabase } from "../../src/lib/saveResult";
import HistoryCard from "../../components/HistoryCard";
import ProgressionChart from "../../components/ProgressionChart";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatsDashboard from "../../components/StatsDashboard";
import { loadLastResultFromSupabase } from "../../src/lib/saveResult";
import type { ChoiceKey, Question, Theme } from "../../src/data/questions";
import { loadUser } from "../../src/lib/qcmUser";

function computeAdvancedStats(questions: Question[], answers: Record<string, ChoiceKey | null>) {
  const themeStats: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    if (!themeStats[q.theme]) themeStats[q.theme] = { correct: 0, total: 0 };
    themeStats[q.theme].total++;
    const user = answers[q.id];
    if (user !== null && user === q.answer) themeStats[q.theme].correct++;
  }
  return { themeStats: themeStats as Record<Theme, { correct: number; total: number }> };
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
  meta: { level: 1 | 2 | 3; themes: string[]; count: number; mode?: "train" | "exam" } | null;
  questions: Question[];
  answers: Record<string, ChoiceKey | null>;
  result: {
    correct: number; total: number;
    details: Array<{
      id: string; theme: string; question: string;
      user: ChoiceKey | null; correct: ChoiceKey;
      ok: boolean; explanation: string;
      choices: { key: ChoiceKey; label: string }[];
    }>;
  };
};

function choiceLabel(q: { choices: { key: ChoiceKey; label: string }[] }, key?: ChoiceKey | null) {
  if (!key) return "Aucune réponse";
  return q.choices.find((c) => c.key === key)?.label ?? "(Choix introuvable)";
}

// ─────────────────────────────────────────────────────────────
// Composant carte thème avec bouton Réviser
// ─────────────────────────────────────────────────────────────
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

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl p-4"
      style={{
        background: isPoor ? "rgba(239,68,68,0.07)" : "rgba(52,211,153,0.07)",
        border: `1px solid ${isPoor ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)"}`,
      }}
    >
      {/* Nom + score */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {theme}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: isPoor ? "#fca5a5" : "#6ee7b7" }}
        >
          {correct}/{total} correct{correct > 1 ? "s" : ""} · {pct}%
        </p>
      </div>

      {/* Badge % */}
      <span
        className="text-base font-bold shrink-0"
        style={{ color: isPoor ? "#ef4444" : "#34d399", minWidth: "44px", textAlign: "center" }}
      >
        {pct}%
      </span>

      {/* Bouton Réviser — toujours visible */}
      <Link
        href={`/scroll?theme=${encodeURIComponent(theme)}`}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: isPoor ? "#ef4444" : "#34d399",
          color: isPoor ? "#fff" : "#0b1a14",
        }}
      >
        Réviser →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
export default function ResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") === "exam" ? "exam" : "train") as "train" | "exam";
  const wantRate = searchParams.get("rate") === "1";

  const [data, setData] = useState<StoredResult | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sentFeedback, setSentFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const PUBLIC_URL = "https://qcm-assimilation-fr.netlify.app";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawUser = localStorage.getItem("qcm_user");
    if (!rawUser) return;
    try { const u = JSON.parse(rawUser) as { pseudo?: string }; if (u?.pseudo) setPseudo(String(u.pseudo)); } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = loadUser();
    const email = u?.email ? u.email.trim().toLowerCase() : "";
    async function fetchResult() {
      const storageKey = email ? `last_result:${mode}:${email}` : null;
      const raw = storageKey ? localStorage.getItem(storageKey) : null;
      if (raw) { try { setData(JSON.parse(raw)); return; } catch {} }
      if (email) {
        const remote = await loadLastResultFromSupabase(email, mode);
        if (remote) setData({ meta: { level: remote.level, themes: remote.themes, count: remote.score_total, mode: remote.mode }, questions: remote.questions, answers: remote.answers, result: { correct: remote.score_correct, total: remote.score_total, details: remote.details } });
      }
    }
    fetchResult();
  }, [mode]);

  useEffect(() => {
    const u = loadUser();
    if (!u?.email) return;
    loadLastResultsFromSupabase(u.email.trim().toLowerCase(), mode).then(setHistory);
  }, [mode]);

  useEffect(() => { if (wantRate) { const el = document.getElementById("feedback"); if (el) el.scrollIntoView({ behavior: "smooth" }); } }, [wantRate, data]);

  const score = useMemo(() => {
    if (!data) return null;
    const { correct, total } = data.result;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percent, passed: correct >= 32 };
  }, [data]);

  const wrong = useMemo(() => !data ? [] : data.result.details.filter((d) => !d.ok), [data]);
  const modeLabel = mode === "exam" ? "Mode examen blanc" : "Mode entraînement";
  const stats = useMemo(() => !data ? null : computeAdvancedStats(data.questions, data.answers), [data]);
  const expertScore = useMemo(() => (!data || !score) ? null : computeExpertScore(score.percent, data.meta?.level ?? 1), [data, score]);
  const rank = useMemo(() => !score ? null : getRank(score.percent), [score]);

  function replaySame() {
    if (!data?.meta) { router.push(mode === "exam" ? "/exam" : "/"); return; }
    localStorage.setItem("quiz_settings", JSON.stringify({ ...data.meta, mode, perQuestion: mode === "exam" ? 30 : 20, maxDuration: mode === "exam" ? 900 : undefined }));
    router.push("/quiz");
  }

  function share() {
    if (!score) return;
    const url = `${PUBLIC_URL}/`;
    const text = `🇫🇷 Je viens de faire une simulation QCM Assimilation 2026.\nScore: ${score.correct}/${score.total} (${score.percent}%) — ${score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}\nTeste-toi ici: ${url}`;
    if (navigator.share) { navigator.share({ title: "QCM Assimilation FR", text, url }).catch(() => {}); return; }
    localStorage.setItem("share_payload", JSON.stringify({ text, url }));
    router.push("/share");
  }

  function buildResultText() {
    const lines = ["QCM Assimilation FR — Résultat détaillé", `Date: ${new Date().toLocaleString("fr-FR")}`, `Niveau: ${data?.meta?.level ?? "—"}`, `Thèmes: ${data?.meta?.themes?.join(", ") ?? "—"}`, `Score: ${score?.correct ?? 0}/${score?.total ?? 0} (${score?.percent ?? 0}%)`, `Statut: ${score?.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}`, "", "Détails question par question :", ""];
    for (const d of data?.result?.details ?? []) { lines.push(`• ${d.ok ? "✅" : "❌"} [${d.theme}] ${d.question}`, `  - Ta réponse : ${d.user ?? "— (non répondu)"}`, `  - Bonne réponse : ${d.correct}`, `  - Explication : ${d.explanation}`, ""); }
    return lines.join("\n");
  }

  async function copyDetailedResult() {
    try { await navigator.clipboard.writeText(buildResultText()); setCopyMsg("✅ Résultat détaillé copié. Colle-le dans ton e-mail et envoie-le."); }
    catch { setCopyMsg("❌ Impossible de copier automatiquement. Essaie avec un autre navigateur."); }
    window.setTimeout(() => setCopyMsg(null), 4000);
  }

  function mailResult() {
    if (!data) return;
    const answeredCount = Object.values(data.answers || {}).filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length;
    if (answeredCount < 32) { alert(`Pour envoyer le résultat par email, tu dois cocher au moins 32 réponses.\nActuellement : ${answeredCount}/40`); return; }
    const rawUser = localStorage.getItem("qcm_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const pseudoLocal = user?.pseudo || "Candidat";
    const email = user?.email || "";
    if (!email) { alert("Aucune adresse email enregistrée."); return; }
    const { correct, total } = data.result;
    const percent = Math.round((correct / total) * 100);
    const passed = correct >= 32;
    const wrongList = data.questions.map((q: any, i: number) => {
      const userKey = data.answers[q.id] as ChoiceKey | null | undefined;
      const correctKey = q.answer as ChoiceKey;
      return { idx: i + 1, theme: q.theme, question: q.question, isWrong: !userKey || userKey !== correctKey, userLabel: userKey ? `${userKey}) ${choiceLabel(q, userKey)}` : "Aucune réponse", correctLabel: `${correctKey}) ${choiceLabel(q, correctKey)}`, explanation: q.explanation || "" };
    }).filter((x: any) => x.isWrong);
    const errorsText = wrongList.length === 0 ? "Aucune erreur 🎉 Bravo !" : wrongList.slice(0, 25).map((d: any) => `#${d.idx} • ${d.theme}\n${d.question}\n\nTa réponse : ${d.userLabel}\nBonne réponse : ${d.correctLabel}\n${d.explanation ? `Explication : ${d.explanation}` : ""}`).join("\n\n---------------------------------\n\n");
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Résultat QCM Assimilation — ${pseudoLocal}`)}&body=${encodeURIComponent(`Bonjour ${pseudoLocal},\n\nScore : ${correct}/${total} (${percent}%)\nRéponses cochées : ${answeredCount}/${total}\nStatut : ${passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}\n\n=================================\nQUESTIONS À REVOIR\n=================================\n${errorsText}\n\n— QCM Assimilation FR`)}`;
  }

  async function sendFeedback() {
    if (!rating || sendingFeedback) return;
    setSendingFeedback(true);
    try {
      const u = loadUser();
      await saveFeedbackToSupabase({ email: u?.email ?? "", pseudo: pseudo || "Anonyme", rating, comment: comment?.trim() ?? "", page: "results", score_percent: score?.percent });
      setSentFeedback(true);
    } catch { alert("Impossible d'envoyer l'avis. Réessaie."); }
    finally { setSendingFeedback(false); }
  }

  // ===== ÉTAT VIDE =====
  if (!data || !score || !stats || !rank || expertScore === null) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Aucun résultat</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Lance un test pour voir tes résultats ici.</p>
          <Button className="mt-4" onClick={() => router.push("/")}>Aller à l'accueil</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">

      {/* ===== BANDEAU OFFICIEL ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700 dark:text-slate-300">
                <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">République française</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{modeLabel} • Simulation 2026</div>
            </div>
            <span className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="inline-flex h-3 w-5 overflow-hidden rounded-sm border border-slate-200 dark:border-slate-600">
                <span className="w-1/3 bg-blue-600" /><span className="w-1/3 bg-white dark:bg-slate-200" /><span className="w-1/3 bg-red-600" />
              </span>
              FR
            </span>
          </div>
          <Button variant="secondary" onClick={() => router.push("/")}>Retour accueil</Button>
        </div>
      </div>

      {/* ===== HEADER SCORE ===== */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {pseudo ? `${pseudo}, voici ton résultat` : "Résultats"}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Niveau {data.meta?.level ?? "—"} • {data.meta?.themes?.join(", ") ?? "—"} • {score.total} questions
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${score.passed ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"}`}>
            {score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}
          </span>
        </div>

        {/* Tuiles score */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[{ label: "Score", value: `${score.correct}/${score.total}` }, { label: "Pourcentage", value: `${score.percent}%` }, { label: "Erreurs", value: String(wrong.length) }].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{value}</div>
            </div>
          ))}
        </div>

        {/* Rang */}
        <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-gradient-to-br from-white dark:from-slate-700 to-slate-50 dark:to-slate-800 p-6 shadow-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">Classement</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{rank}</div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">Score expert : <span className="font-bold">{expertScore}</span></div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button onClick={replaySame}>Réessayer</Button>
          <Button variant="secondary" onClick={() => router.push(mode === "exam" ? "/exam" : "/")}>Nouveau test</Button>
          <Button variant="secondary" onClick={copyDetailedResult}>Copier le résultat</Button>
          <Button variant="secondary" onClick={mailResult}>Envoyer par email</Button>
          <Button variant="secondary" onClick={() => { const el = document.getElementById("feedback"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Noter l'expérience</Button>
          <Button variant="secondary" onClick={() => router.push("/leaderboard")}>🏆 Classement</Button>
          <Button variant="secondary" onClick={share}>Partager le lien</Button>
        </div>

        {copyMsg && <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{copyMsg}</p>}
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Règle : validation si <strong>≥ 32</strong> réponses correctes sur 40.</p>
      </Card>

      {/* ===== STATS PAR THÈME ===== */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Performance par thème</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Analyse stratégique de tes résultats.</p>

        {/* Graphique existant */}
        <div className="mt-6">
          <StatsDashboard themeStats={stats.themeStats} />
        </div>

        {/* ── NOUVEAU : cartes thème + bouton Réviser ── */}
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            📚 Révise un thème en mode flash-cards
          </p>
          {Object.entries(stats.themeStats).map(([theme, { correct, total }]) => (
            <ThemeRevisionCard
              key={theme}
              theme={theme}
              correct={correct}
              total={total}
            />
          ))}
        </div>
      </Card>

      {/* ===== HEATMAP ===== */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Heatmap des réponses</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Vert = bonne réponse • Rouge = erreur</p>
        <div className="mt-6 grid grid-cols-10 gap-2">
          {data.questions.map((q, i) => (
            <div key={q.id} className={`h-6 w-6 rounded-md transition ${data.answers[q.id] !== q.answer ? "bg-red-500" : "bg-green-500"}`} title={`Question ${i + 1} — ${q.theme}`} />
          ))}
        </div>
      </Card>

      {/* ===== FEEDBACK ===== */}
      <div id="feedback">
        <Card>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notez votre expérience</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Votre avis nous aide à améliorer la simulation.</p>
          {sentFeedback ? (
            <div className="mt-4 rounded-2xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 text-green-800 dark:text-green-300">Merci ✅ Avis enregistré.</div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    className={`h-10 w-10 rounded-xl border font-semibold transition ${rating === n ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                className="mt-4 w-full min-h-[130px] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Un commentaire (optionnel) : ce que tu as aimé / à améliorer…"
                value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="mt-4 flex gap-3 flex-wrap">
                <Button onClick={sendFeedback} disabled={!rating || sendingFeedback}>{sendingFeedback ? "Envoi..." : "Envoyer"}</Button>
                <Button variant="secondary" type="button" onClick={() => { setRating(null); setComment(""); }}>Effacer</Button>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Choisis une note (1 à 5).</p>
            </>
          )}
        </Card>
      </div>

      {/* ===== HISTORIQUE & PROGRESSION ===== */}
      <HistoryCard entries={history} mode={mode} />
      <ProgressionChart entries={history} />

      {/* ===== RÉVISER LES ERREURS ===== */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Réviser mes erreurs</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Lis l'explication et refais un test pour consolider.</p>
        {wrong.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 text-green-800 dark:text-green-300">
            Bravo 🎉 Aucune erreur sur ce test.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {wrong.slice(0, 20).map((d, i) => (
              <div key={d.id} className="rounded-2xl border border-slate-200 dark:border-slate-600 p-4 bg-white dark:bg-slate-700">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-slate-500 dark:text-slate-400">#{i + 1} • {d.theme}</div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">Faux</span>
                </div>
                <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{d.question}</div>
                <div className="mt-3 text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">Ta réponse :</span> {d.user ?? "— (non répondu)"}</div>
                <div className="text-sm text-slate-800 dark:text-slate-200"><span className="font-semibold">Bonne réponse :</span> {d.correct}</div>
                <div className="mt-3 text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Explication :</span> {d.explanation}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* NETLIFY HIDDEN FORM */}
      <form name="feedback" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
        <input type="hidden" name="form-name" value="feedback" />
        <input name="pseudo" /><input name="rating" /><textarea name="comment" />
        <input name="createdAt" /><input name="page" /><input name="score" /><input name="meta" />
      </form>
    </main>
  );
}
