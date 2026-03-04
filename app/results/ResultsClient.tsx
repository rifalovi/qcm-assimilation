"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "../../components/Card";
import Button from "../../components/Button";
import StatsDashboard from "../../components/StatsDashboard";

import type { ChoiceKey, Question, Theme } from "../../src/data/questions";
import { loadUser } from "../../src/lib/qcmUser";

// ✅ "force-dynamic" retiré : il était sur le mauvais fichier.
//    Le <Suspense> dans page.tsx gère déjà le rendu dynamique côté client.

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

function encode(data: Record<string, string>) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

type StoredResult = {
  meta: { level: 1 | 2 | 3; themes: string[]; count: number; mode?: "train" | "exam" } | null;
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

function choiceLabel(q: { choices: { key: ChoiceKey; label: string }[] }, key?: ChoiceKey | null) {
  if (!key) return "Aucune réponse";
  return q.choices.find((c) => c.key === key)?.label ?? "(Choix introuvable)";
}

export default function ResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = (searchParams.get("mode") === "exam" ? "exam" : "train") as "train" | "exam";
  const wantRate = searchParams.get("rate") === "1";

  const [data, setData] = useState<StoredResult | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string>("");
  const [openFeedback, setOpenFeedback] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sentFeedback, setSentFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

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
    const storageKey = email ? `last_result:${mode}:${email}` : null;
    const raw =
      (storageKey ? localStorage.getItem(storageKey) : null) ||
      localStorage.getItem("last_result");
    if (!raw) { setData(null); return; }
    try { setData(JSON.parse(raw)); } catch { setData(null); }
  }, [mode]);

  useEffect(() => { if (!wantRate) return; setOpenFeedback(true); }, [wantRate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#feedback") {
      const el = document.getElementById("feedback");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data]);

  const score = useMemo(() => {
    if (!data) return null;
    const { correct, total } = data.result;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = correct >= 32;
    return { correct, total, percent, passed };
  }, [data]);

  const wrong = useMemo(() => {
    if (!data) return [];
    return data.result.details.filter((d) => !d.ok);
  }, [data]);

  const modeLabel = useMemo(() => {
    const lvl = data?.meta?.level;
    return lvl === 3 ? "Mode examen blanc" : "Mode entraînement";
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return null;
    return computeAdvancedStats(data.questions, data.answers);
  }, [data]);

  const expertScore = useMemo(() => {
    if (!data || !score) return null;
    const lvl = data.meta?.level ?? 1;
    return computeExpertScore(score.percent, lvl);
  }, [data, score]);

  const rank = useMemo(() => {
    if (!score) return null;
    return getRank(score.percent);
  }, [score]);

  function replaySame() {
    if (!data?.meta) { router.push("/"); return; }
    localStorage.setItem("quiz_settings", JSON.stringify(data.meta));
    router.push("/quiz");
  }

  function newTest() { router.push("/"); }

  function share() {
    if (!score) return;
    const url = `${PUBLIC_URL}/`;
    const text =
      `🇫🇷 Je viens de faire une simulation QCM Assimilation 2026.\n` +
      `Score: ${score.correct}/${score.total} (${score.percent}%) — ${score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}\n` +
      `Teste-toi ici: ${url}`;
    if (navigator.share) { navigator.share({ title: "QCM Assimilation FR", text, url }).catch(() => {}); return; }
    localStorage.setItem("share_payload", JSON.stringify({ text, url }));
    router.push("/share");
  }

  function buildResultText() {
    const lines: string[] = [];
    lines.push("QCM Assimilation FR — Résultat détaillé");
    lines.push(`Date: ${new Date().toLocaleString("fr-FR")}`);
    lines.push(`Niveau: ${data?.meta?.level ?? "—"}`);
    lines.push(`Thèmes: ${data?.meta?.themes?.join(", ") ?? "—"}`);
    lines.push(`Score: ${score?.correct ?? 0}/${score?.total ?? 0} (${score?.percent ?? 0}%)`);
    lines.push(`Statut: ${score?.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}`);
    lines.push(""); lines.push("Détails question par question :"); lines.push("");
    for (const d of data?.result?.details ?? []) {
      lines.push(`• ${d.ok ? "✅" : "❌"} [${d.theme}] ${d.question}`);
      lines.push(`  - Ta réponse : ${d.user ?? "— (non répondu)"}`);
      lines.push(`  - Bonne réponse : ${d.correct}`);
      lines.push(`  - Explication : ${d.explanation}`);
      lines.push("");
    }
    return lines.join("\n");
  }

  async function copyDetailedResult() {
    try {
      await navigator.clipboard.writeText(buildResultText());
      setCopyMsg("✅ Résultat détaillé copié. Colle-le dans ton e-mail et envoie-le.");
      window.setTimeout(() => setCopyMsg(null), 4000);
    } catch {
      setCopyMsg("❌ Impossible de copier automatiquement. Essaie avec un autre navigateur.");
      window.setTimeout(() => setCopyMsg(null), 4000);
    }
  }

  function mailResult() {
    if (!data) return;
    const answeredCount = Object.values(data.answers || {})
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length;
    if (answeredCount < 32) {
      alert(`Pour envoyer le résultat par email, tu dois cocher au moins 32 réponses.\nActuellement : ${answeredCount}/40`);
      return;
    }
    const rawUser = localStorage.getItem("qcm_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const pseudoLocal = user?.pseudo || "Candidat";
    const email = user?.email || "";
    if (!email) { alert("Aucune adresse email enregistrée."); return; }
    const { correct, total } = data.result;
    const percent = Math.round((correct / total) * 100);
    const passed = correct >= 32;
    const wrongList = data.questions
      .map((q: any, i: number) => {
        const userKey = data.answers[q.id] as ChoiceKey | null | undefined;
        const correctKey = q.answer as ChoiceKey;
        const isWrong = !userKey || userKey !== correctKey;
        return {
          idx: i + 1, theme: q.theme, question: q.question, userKey, correctKey,
          userLabel: userKey ? `${userKey}) ${choiceLabel(q, userKey)}` : "Aucune réponse",
          correctLabel: `${correctKey}) ${choiceLabel(q, correctKey)}`,
          explanation: q.explanation || "", isWrong,
        };
      }).filter((x: any) => x.isWrong);
    const errorsText = wrongList.length === 0
      ? "Aucune erreur 🎉 Bravo !"
      : wrongList.slice(0, 25).map((d: any) =>
          `#${d.idx} • ${d.theme}\n${d.question}\n\nTa réponse : ${d.userLabel}\nBonne réponse : ${d.correctLabel}\n${d.explanation ? `Explication : ${d.explanation}` : ""}`
        ).join("\n\n---------------------------------\n\n");
    const subject = encodeURIComponent(`Résultat QCM Assimilation — ${pseudoLocal}`);
    const body = encodeURIComponent(
      `Bonjour ${pseudoLocal},\n\nVoici ton résultat :\n\nScore : ${correct}/${total} (${percent}%)\nRéponses cochées : ${answeredCount}/${total}\nStatut : ${passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}\n\n=================================\nQUESTIONS À REVOIR\n=================================\n${errorsText}\n\n— QCM Assimilation FR`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  async function sendFeedback() {
    if (!rating || sendingFeedback) return;
    setSendingFeedback(true);
    try {
      const payload = {
        pseudo: pseudo || "Anonyme", rating: String(rating),
        comment: comment?.trim() ?? "", createdAt: new Date().toISOString(),
        page: "results", score: JSON.stringify(score), meta: JSON.stringify(data?.meta ?? null),
      };
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "feedback", ...payload }),
      });
      if (!res.ok) throw new Error("Netlify form submission failed");
      setSentFeedback(true);
    } catch { alert("Impossible d'envoyer l'avis. Réessaie."); }
    finally { setSendingFeedback(false); }
  }

  if (!data || !score || !stats || !rank || expertScore === null) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <h1 className="text-xl font-bold">Aucun résultat</h1>
          <p className="mt-2 text-slate-600">Lance un test pour voir tes résultats ici.</p>
          <Button className="mt-4" onClick={() => router.push("/")}>Aller à l'accueil</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Bandeau officiel */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
                <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">République française</div>
              <div className="text-sm font-semibold text-slate-900">{modeLabel} • Simulation 2026</div>
            </div>
            <span className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <span className="inline-flex h-3 w-5 overflow-hidden rounded-sm border border-slate-200">
                <span className="w-1/3 bg-blue-600" /><span className="w-1/3 bg-white" /><span className="w-1/3 bg-red-600" />
              </span>
              FR
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/")}>Retour accueil</Button>
          </div>
        </div>
      </div>

      {/* Header score */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{pseudo ? `${pseudo}, voici ton résultat` : "Résultats"}</h1>
            <p className="mt-1 text-slate-600">Niveau {data.meta?.level ?? "—"} • {data.meta?.themes?.join(", ") ?? "—"} • {score.total} questions</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${score.passed ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Score</div>
            <div className="text-2xl font-bold mt-1">{score.correct}/{score.total}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Pourcentage</div>
            <div className="text-2xl font-bold mt-1">{score.percent}%</div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Erreurs</div>
            <div className="text-2xl font-bold mt-1">{wrong.length}</div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg">
          <div className="text-sm text-slate-600">Classement</div>
          <div className="mt-1 text-2xl font-extrabold">{rank}</div>
          <div className="mt-2 text-sm text-slate-700">Score expert : <span className="font-bold">{expertScore}</span></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button onClick={replaySame}>Réessayer</Button>
          <Button variant="secondary" onClick={newTest}>Nouveau test</Button>
          <Button variant="secondary" onClick={copyDetailedResult}>Copier le résultat</Button>
          <Button variant="secondary" onClick={mailResult}>Envoyer par email</Button>
          <Button variant="secondary" onClick={() => { const el = document.getElementById("feedback"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            Noter l'expérience
          </Button>
          <Button variant="secondary" onClick={share}>Partager le lien</Button>
        </div>

        {copyMsg && <p className="mt-3 text-sm text-slate-700">{copyMsg}</p>}
        <p className="mt-4 text-sm text-slate-600">Règle : validation si <strong>≥ 32</strong> réponses correctes sur 40.</p>
      </Card>

      {/* Stats par thème */}
      <Card>
        <h2 className="text-lg font-bold">Performance par thème</h2>
        <p className="mt-1 text-slate-600">Analyse stratégique de tes résultats.</p>
        <div className="mt-6"><StatsDashboard themeStats={stats.themeStats} /></div>
      </Card>

      {/* Heatmap */}
      <Card>
        <h2 className="text-lg font-bold">Heatmap des réponses</h2>
        <p className="mt-1 text-slate-600">Vert = bonne réponse • Rouge = erreur</p>
        <div className="mt-6 grid grid-cols-10 gap-2">
          {data.questions.map((q, i) => {
            const isWrong = data.answers[q.id] !== q.answer;
            return (
              <div key={q.id} className={`h-6 w-6 rounded-md transition ${isWrong ? "bg-red-500" : "bg-green-500"}`}
                title={`Question ${i + 1} — ${q.theme}`} />
            );
          })}
        </div>
      </Card>

      {/* Feedback */}
      <div id="feedback">
        <Card>
          <h2 className="text-lg font-bold">Notez votre expérience</h2>
          <p className="mt-1 text-slate-600">Votre avis nous aide à améliorer la simulation.</p>
          {sentFeedback ? (
            <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800">Merci ✅ Avis enregistré.</div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    className={`h-10 w-10 rounded-xl border font-semibold transition ${rating === n ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                className="mt-4 w-full min-h-[130px] rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Un commentaire (optionnel) : ce que tu as aimé / à améliorer…"
                value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="mt-4 flex gap-3 flex-wrap">
                <Button onClick={sendFeedback} disabled={!rating || sendingFeedback}>
                  {sendingFeedback ? "Envoi..." : "Envoyer"}
                </Button>
                <Button variant="secondary" type="button" onClick={() => { setRating(null); setComment(""); }}>Effacer</Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">Choisis une note (1 à 5).</p>
            </>
          )}
        </Card>
      </div>

      {/* Erreurs */}
      <Card>
        <h2 className="text-lg font-bold">Réviser mes erreurs</h2>
        <p className="mt-1 text-slate-600">Lis l'explication et refais un test pour consolider.</p>
        {wrong.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800">Bravo 🎉 Aucune erreur sur ce test.</div>
        ) : (
          <div className="mt-4 space-y-4">
            {wrong.slice(0, 20).map((d, i) => (
              <div key={d.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-slate-500">#{i + 1} • {d.theme}</div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">Faux</span>
                </div>
                <div className="mt-2 font-semibold">{d.question}</div>
                <div className="mt-3 text-sm"><span className="font-semibold">Ta réponse :</span> {d.user ? `${d.user}` : "— (non répondu)"}</div>
                <div className="text-sm"><span className="font-semibold">Bonne réponse :</span> {d.correct}</div>
                <div className="mt-3 text-sm text-slate-700"><span className="font-semibold">Explication :</span> {d.explanation}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Netlify hidden form */}
      <form name="feedback" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
        <input type="hidden" name="form-name" value="feedback" />
        <input name="pseudo" />
        <p hidden><label>Don't fill this out: <input name="bot-field" /></label></p>
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
