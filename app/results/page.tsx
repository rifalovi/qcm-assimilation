"use client";



import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import Card from "../../components/Card";
import Button from "../../components/Button";
import StatsDashboard from "../../components/StatsDashboard";

import type { ChoiceKey, Question, Theme } from "../../src/data/questions";
import { loadUser, userKeyByEmail } from "../../src/lib/qcmUser"; // ajuste le chemin

export const dynamic = "force-dynamic";
// -----------------------------
// Helpers: stats + score expert
// -----------------------------
function computeAdvancedStats(questions: Question[], answers: Record<string, ChoiceKey | null>) {
  const themeStats: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    if (!themeStats[q.theme]) themeStats[q.theme] = { correct: 0, total: 0 };
    themeStats[q.theme].total++;

    const user = answers[q.id];
    if (user !== null && user === q.answer) {
      themeStats[q.theme].correct++;
    }
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

// -----------------------------
// Types
// -----------------------------


type StoredResult = {
  meta: { level: 1 | 2 | 3; themes: string[]; count: number } | null;
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

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredResult | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

const searchParams = useSearchParams();
const wantRate = searchParams.get("rate") === "1";
const mode = (searchParams.get("mode") === "exam" ? "exam" : "train") as "train" | "exam";
const [pseudo, setPseudo] = useState<string>("");

type ChoiceKey = "A" | "B" | "C" | "D";

function choiceLabel(q: { choices: { key: ChoiceKey; label: string }[] }, key?: ChoiceKey | null) {
  if (!key) return "Aucune réponse";
  return q.choices.find((c) => c.key === key)?.label ?? "(Choix introuvable)";
}

function mailResult() {
  if (!data) return;

  // 🔒 règle anti “speed-run” : au moins 32 réponses cochées
  const answeredCount = Object.values(data.answers || {})
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .length;

  if (answeredCount < 32) {
    alert(
      `Pour envoyer le résultat par email, tu dois cocher au moins 32 réponses.\nActuellement : ${answeredCount}/40`
    );
    return;
  }

  const rawUser = localStorage.getItem("qcm_user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const pseudo = user?.pseudo || "Candidat";
  const email = user?.email || "";

  if (!email) {
    alert("Aucune adresse email enregistrée.");
    return;
  }

const { correct, total } = data.result;
const percent = Math.round((correct / total) * 100);
const passed = percent >= 80; // seuil validation 32/40

  // 🔎 questions ratées (ou non répondues)
  const wrong = data.questions
    .map((q: any, i: number) => {
      const userKey = data.answers[q.id] as ChoiceKey | null | undefined;
      const correctKey = q.answer as ChoiceKey;

      const isWrong = !userKey || userKey !== correctKey;

      return {
        idx: i + 1,
        theme: q.theme,
        question: q.question,
        userKey,
        correctKey,
        userLabel: userKey ? `${userKey}) ${choiceLabel(q, userKey)}` : "Aucune réponse",
        correctLabel: `${correctKey}) ${choiceLabel(q, correctKey)}`,
        explanation: q.explanation || "",
        isWrong,
      };
    })
    .filter((x: any) => x.isWrong);

  const errorsText =
    wrong.length === 0
      ? "Aucune erreur 🎉 Bravo !"
      : wrong
          .slice(0, 25) // sécurité mailto
          .map(
            (d: any) =>
              `#${d.idx} • ${d.theme}
${d.question}

Ta réponse : ${d.userLabel}
Bonne réponse : ${d.correctLabel}
${d.explanation ? `Explication : ${d.explanation}` : ""}`
          )
          .join("\n\n---------------------------------\n\n");

  const subject = encodeURIComponent(`Résultat QCM Assimilation — ${pseudo}`);

  const body = encodeURIComponent(
`Bonjour ${pseudo},

Voici ton résultat :

Score : ${correct}/${total} (${percent}%)
Réponses cochées : ${answeredCount}/${total}
Statut : ${passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}

=================================
QUESTIONS À REVOIR
=================================
${errorsText}

— QCM Assimilation FR`
  );

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}


// 2) Charger le dernier résultat (lié à l’email si possible)
useEffect(() => {
  const u = loadUser(); // doit exister chez toi
  
  const key = u?.email ? `last_result:${mode}:${u.email.trim().toLowerCase()}` : null;

  const raw =
    (key ? localStorage.getItem(`last_result:${key}`) : null) ||
    localStorage.getItem("last_result"); // fallback

  if (!raw) {
    setData(null);
    return;
  }

  try {
    setData(JSON.parse(raw));
  } catch {
    setData(null);
  }
}, []);

// 3) Si on arrive avec ?rate=1 → ouvrir le feedback
useEffect(() => {
  if (!wantRate) return;
  setOpenFeedback(true);
}, [wantRate]);

  const score = useMemo(() => {
    if (!data) return null;
    const { correct, total } = data.result;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = correct >= 32; // règle actuelle
    return { correct, total, percent, passed };
  }, [data]);

  const wrong = useMemo(() => {
    if (!data) return [];
    return data.result.details.filter((d) => !d.ok);
  }, [data]);

  useEffect(() => {
  if (typeof window === "undefined") return;
  if (window.location.hash === "#feedback") {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, []);

  const [openFeedback, setOpenFeedback] = useState(false);

const [comment, setComment] = useState("");
const [sending, setSending] = useState(false);
const [sent, setSent] = useState(false);



async function submitFeedback(e: React.FormEvent) {
  e.preventDefault();
  if (!score || !data?.meta) return;

  setSending(true);

  const payload: Record<string, string> = {
    "form-name": "feedback-qcm",
    rating: String(rating),
    comment: comment.trim(),
    level: String(data.meta.level ?? ""),
    themes: (data.meta.themes ?? []).join(", "),
    count: String(data.meta.count ?? ""),
    score: `${score.correct}/${score.total}`,
    percent: String(score.percent),
    passed: score.passed ? "yes" : "no",
    // Optionnel: mode si tu l’as
    mode: (data.meta as any).mode ? String((data.meta as any).mode) : "train",
    page: "results",
  };

  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode(payload),
    });

    setSent(true);
    setComment("");
  } catch {
    alert("Erreur d’envoi. Réessaie.");
  } finally {
    setSending(false);
  }
}
    const modeLabel = useMemo(() => {
    // Auto: si niveau 3 => examen blanc (simple et fiable pour ton usage actuel)
    const lvl = data?.meta?.level;
    return lvl === 3 ? "Mode examen blanc" : "Mode entraînement";
  }, [data]);

  // ✅ stats + expert score + rank
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

const [rating, setRating] = useState<number | null>(null);
const [feedback, setFeedback] = useState("");
const [sentFeedback, setSentFeedback] = useState(false);
const PUBLIC_URL = "https://TON-DOMAINE-OU-URL-NETLIFY"; // à remplacer après déploiement


const [pendingScrollToFeedback, setPendingScrollToFeedback] = useState(false);
const [sendingFeedback, setSendingFeedback] = useState(false);


// 1) On détecte si on arrive avec #feedback
useEffect(() => {
  if (typeof window === "undefined") return;
  if (window.location.hash === "#feedback") {
    setPendingScrollToFeedback(true);
  }
}, []);

// 2) On scroll seulement quand le DOM contient vraiment le bloc (donc après data/score)
useEffect(() => {
  if (!pendingScrollToFeedback) return;
  if (!data || !score) return;

  const el = document.getElementById("feedback");
  if (!el) return;

  // petit délai pour laisser le layout se stabiliser
  const t = window.setTimeout(() => {
    const yOffset = -90; // ajuste si ton header cache le haut
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setPendingScrollToFeedback(false);
  }, 150);

  return () => window.clearTimeout(t);
}, [pendingScrollToFeedback, data, score]);


  function replaySame() {
    if (!data?.meta) {
      router.push("/");
      return;
    }
    localStorage.setItem("quiz_settings", JSON.stringify(data.meta));
    router.push("/quiz");
  }

  function newTest() {
    router.push("/");
  }
  function backHome() {
  router.push("/");
}

function share() {
  if (!score) return;

  const url = `${PUBLIC_URL}/`; // ou `${PUBLIC_URL}?ref=share`
  const text =
    `🇫🇷 Je viens de faire une simulation QCM Assimilation 2026.\n` +
    `Score: ${score.correct}/${score.total} (${score.percent}%) — ${score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}\n` +
    `Teste-toi ici: ${url}`;

  // Web Share (mobile / certains navigateurs)
  if (navigator.share) {
    navigator.share({ title: "QCM Assimilation FR", text, url }).catch(() => {});
    return;
  }

  function scrollToFeedback() {
  const el = document.getElementById("feedback");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}



  // Fallback: ouvrir une page de partage interne
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
  lines.push("");
  lines.push("Détails question par question :");
  lines.push("");

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

  if (!data || !score || !stats || !rank || expertScore === null) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <h1 className="text-xl font-bold">Aucun résultat</h1>
          <p className="mt-2 text-slate-600">
            Lance un test pour voir tes résultats ici.
          </p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Aller à l’accueil
          </Button>
        </Card>
      </main>
    );
  }

function encode(data: Record<string, string>) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

async function sendFeedback() {
  if (!rating || sendingFeedback) return;

  setSendingFeedback(true);

  try {
    const payload = {
  pseudo: pseudo || "Anonyme",
  rating: String(rating),
  comment: comment?.trim() ?? "",
  createdAt: new Date().toISOString(),
  page: "results",
  score: JSON.stringify(score),
  meta: JSON.stringify(data?.meta ?? null),
    };
    

    // ✅ Envoi vers Netlify Forms
    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode({ "form-name": "feedback", ...payload }),
    });

    if (!res.ok) throw new Error("Netlify form submission failed");

    setSentFeedback(true);
  } catch (e) {
    alert("Impossible d’envoyer l’avis. Réessaie.");
  } finally {
    setSendingFeedback(false);
  }
}

  return (
  <main className="max-w-5xl mx-auto p-4 space-y-6">
          {/* Mini bandeau officiel */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tricolore discret */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />

        <div className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* “Marianne” neutre (icone) */}
            <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
                <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500">
                République française
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {modeLabel} • Simulation 2026
              </div>
            </div>

            {/* pastille drapeau */}
            <span className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              <span className="inline-flex h-3 w-5 overflow-hidden rounded-sm border border-slate-200">
                <span className="w-1/3 bg-blue-600" />
                <span className="w-1/3 bg-white" />
                <span className="w-1/3 bg-red-600" />
              </span>
              FR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/")}>
              Retour accueil
            </Button>
          </div>
        </div>
      </div>

    {/* Header score */}
    <Card>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
  {pseudo ? `${pseudo}, voici ton résultat` : "Résultats"}
</h1>
          <p className="mt-1 text-slate-600">
            Niveau {data.meta?.level ?? "—"} • {data.meta?.themes?.join(", ") ?? "—"} • {score.total} questions
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold border ${
            score.passed
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {score.passed ? "VALIDÉ ✅" : "NON VALIDÉ ❌"}
        </span>
      </div>

     
      {/* SCORE GRID */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Score</div>
          <div className="text-2xl font-bold mt-1">
            {score.correct}/{score.total}
          </div>
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

      {/* 🏆 BADGE EXPERT PREMIUM */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg">
        <div className="text-sm text-slate-600">Classement</div>
        <div className="mt-1 text-2xl font-extrabold">{rank}</div>
        <div className="mt-2 text-sm text-slate-700">
          Score expert : <span className="font-bold">{expertScore}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
  <Button onClick={replaySame}>Réessayer</Button>

  <Button variant="secondary" onClick={newTest}>
    Nouveau test
  </Button>

     <Button variant="secondary" onClick={copyDetailedResult}>
    Copier le résultat
  </Button>

  <Button variant="secondary" onClick={mailResult}>
  Envoyer par email
</Button>

  

   <Button
    variant="secondary"
    onClick={() => {
      const el = document.getElementById("feedback");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }}
  >
    Noter l’expérience
  </Button>

  <Button variant="secondary" onClick={share}>
    Partager le lien
  </Button>
</div>
{copyMsg && (
  <p className="mt-3 text-sm text-slate-700">{copyMsg}</p>
)}


      <p className="mt-4 text-sm text-slate-600">
        Règle : validation si <strong>≥ 32</strong> réponses correctes sur 40.
      </p>
    </Card>

    {/* 📊 STATS PAR THÈME */}
    <Card>
      <h2 className="text-lg font-bold">Performance par thème</h2>
      <p className="mt-1 text-slate-600">
        Analyse stratégique de tes résultats.
      </p>

      <div className="mt-6">
        <StatsDashboard themeStats={stats.themeStats} />
      </div>
    </Card>

    {/* 🔥 HEATMAP */}
    <Card>
      <h2 className="text-lg font-bold">Heatmap des réponses</h2>
      <p className="mt-1 text-slate-600">
        Vert = bonne réponse • Rouge = erreur
      </p>

      <div className="mt-6 grid grid-cols-10 gap-2">
        {data.questions.map((q, i) => {
          const isWrong = data.answers[q.id] !== q.answer;

          return (
            <div
              key={q.id}
              className={`h-6 w-6 rounded-md transition ${
                isWrong ? "bg-red-500" : "bg-green-500"
              }`}
              title={`Question ${i + 1} — ${q.theme}`}
            />
          );
        })}
      </div>
    </Card>
 <div id="feedback">
  <Card>
    <h2 className="text-lg font-bold">Notez votre expérience</h2>
    <p className="mt-1 text-slate-600">
      Votre avis nous aide à améliorer la simulation.
    </p>

    {sentFeedback ? (
      <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800">
        Merci ✅ Avis enregistré.
      </div>
    ) : (
      <>
        {/* Note */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`h-10 w-10 rounded-xl border font-semibold transition ${
                rating === n
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Commentaire */}
        <textarea
          className="mt-4 w-full min-h-[130px] rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Un commentaire (optionnel) : ce que tu as aimé / à améliorer…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Boutons */}
        <div className="mt-4 flex gap-3 flex-wrap">
          <Button
            onClick={sendFeedback}
            disabled={!rating || sendingFeedback}
          >
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

        <p className="mt-3 text-xs text-slate-500">
          Choisis une note (1 à 5).
        </p>
      </>
    )}
  </Card>
</div>
    {/* Review erreurs */}
    <Card>
      <h2 className="text-lg font-bold">Réviser mes erreurs</h2>
      <p className="mt-1 text-slate-600">
        Lis l’explication et refais un test pour consolider.
      </p>

      {wrong.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800">
          Bravo 🎉 Aucune erreur sur ce test.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {wrong.slice(0, 20).map((d, i) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-slate-500">
                  #{i + 1} • {d.theme}
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
                  Faux
                </span>
              </div>

              <div className="mt-2 font-semibold">{d.question}</div>

              <div className="mt-3 text-sm">
                <span className="font-semibold">Ta réponse :</span>{" "}
                {d.user ? `${d.user}` : "— (non répondu)"}
              </div>

              <div className="text-sm">
                <span className="font-semibold">Bonne réponse :</span> {d.correct}
              </div>

              <div className="mt-3 text-sm text-slate-700">
                <span className="font-semibold">Explication :</span>{" "}
                {d.explanation}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
    
{/* Netlify hidden form (obligatoire pour détection au build) */}
<form
  name="feedback"
  method="POST"
  data-netlify="true"
  data-netlify-honeypot="bot-field"
  hidden
>
  <input type="hidden" name="form-name" value="feedback" />
  <input name="pseudo" />

  {/* Honeypot anti-bot */}
  <p hidden>
    <label>
      Don’t fill this out: <input name="bot-field" />
    </label>
  </p>

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
