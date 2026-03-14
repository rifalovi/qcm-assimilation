"use client";

import { useRouter } from "next/navigation";
import Card from "../components/Card";
import Button from "../components/Button";
import { useEffect, useMemo, useState } from "react";
import { hasAnyResult } from "../src/lib/saveResult";

type Level = 1 | 2 | 3;
type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";

const COUNT = 40;
const PER_QUESTION_SECONDS = 20;
const THEMES: Theme[] = ["Valeurs", "Institutions", "Histoire", "Société"];

function MarianneMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-7 w-7 text-slate-800 dark:text-slate-200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M32 8c8.5 0 15.5 7 15.5 15.5S40.5 39 32 39 16.5 32 16.5 23.5 23.5 8 32 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 53c3.8-7.6 10.1-12 14-12s10.2 4.4 14 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 22c4-6 9-9 16-9 1.5 0 3 .2 4.3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

type QcmUser = { pseudo: string; email: string };

function normEmail(v: string) { return v.trim().toLowerCase(); }

function loadUserLocal(): QcmUser | null {
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch { return null; }
}

function saveUser(u: QcmUser) {
  localStorage.setItem("qcm_user", JSON.stringify(u));
}

export default function HomePage() {
  const router = useRouter();

  // ===== IDENTITY =====
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [hasLastResult, setHasLastResult] = useState(false);

  useEffect(() => {
    const u = loadUserLocal();
    if (u) {
      setPseudo(u.pseudo);
      setEmail(u.email);
      setPseudoDraft(u.pseudo);
      setEmailDraft(u.email);
    }
  }, []);

  useEffect(() => {
    const u = loadUserLocal();
    if (!u?.email) { setHasLastResult(false); return; }
    const e = u.email.trim().toLowerCase();
    async function check() {
      const remote = await hasAnyResult(e);
      if (remote) { setHasLastResult(true); return; }
      const hasTrain = !!localStorage.getItem(`last_result:train:${e}`);
      const hasExam = !!localStorage.getItem(`last_result:exam:${e}`);
      setHasLastResult(hasTrain || hasExam);
    }
    check();
  }, [pseudo, email]);

  function requireAuthAndRun(action: () => void) {
    if (!pseudo || !email) { setPseudoOpen(true); return; }
    action();
  }

  function openPseudoModal() {
    try {
      const raw = localStorage.getItem("qcm_user");
      if (raw) {
        const u = JSON.parse(raw) as { pseudo?: string; email?: string };
        setPseudoDraft(u.pseudo ?? pseudo ?? "");
        setEmailDraft(u.email ?? email ?? "");
      } else {
        setPseudoDraft(pseudo ?? "");
        setEmailDraft(email ?? "");
      }
    } catch {
      setPseudoDraft(pseudo ?? "");
      setEmailDraft(email ?? "");
    }
    setPseudoOpen(true);
  }

  function clearPseudo() {
    localStorage.removeItem("qcm_user");
    setPseudo(""); setEmail(""); setPseudoDraft(""); setEmailDraft("");
    setHasLastResult(false); setPseudoOpen(false);
  }

  function confirmIdentity() {
    const p = pseudoDraft.trim();
    const e = emailDraft.trim().toLowerCase();
    if (!p || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;
    const u = { pseudo: p, email: e };
    saveUser(u); setPseudo(p); setEmail(e); setPseudoOpen(false);
    localStorage.setItem("quiz_settings", JSON.stringify(meta));
    router.push("/quiz");
  }

  // ===== QUIZ SETTINGS =====
  const [level, setLevel] = useState<Level>(1);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;

  const meta = useMemo(() => ({
    level, themes, count: COUNT,
    perQuestionSeconds: PER_QUESTION_SECONDS,
    mode: "train" as const,
  }), [level, themes]);

  function start() {
    if (!canStart) return;
    requireAuthAndRun(() => {
      localStorage.setItem("quiz_settings", JSON.stringify(meta));
      router.push("/quiz");
    });
  }

  function smartStart() {
    if (!pseudo.trim() || !email.trim()) {
      setPseudoDraft(pseudo); setEmailDraft(email); setPseudoOpen(true); return;
    }
    start();
  }

  function startExam() {
    requireAuthAndRun(() => { router.push("/exam"); });
  }

  function toggleTheme(t: Theme) {
    setThemes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  // ===== FEEDBACK =====
  const [openFeedback, setOpenFeedback] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const payload: Record<string, string> = {
      "form-name": "feedback-qcm", rating: String(rating),
      comment: comment.trim(), pseudo: pseudo.trim() || "",
      page: "home", level: String(level), themes: themes.join(", "),
      count: String(COUNT), mode: "train",
    };
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode(payload),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true); setComment("");
    } catch { alert("Erreur d'envoi. Réessaie."); }
    finally { setSending(false); }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">

      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        {/* Bande tricolore */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />

        {/* Halos */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-100/40 dark:bg-red-900/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-100/30 dark:bg-blue-900/20 blur-3xl" />

        <div className="p-5 sm:p-6 lg:p-7">
          {/* TOP BAR */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Bloc République */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                <MarianneMark />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    République Française
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="inline-flex h-2.5 w-4 overflow-hidden rounded-sm border border-slate-200 dark:border-slate-600">
                      <span className="w-1/3 bg-blue-600" />
                      <span className="w-1/3 bg-white dark:bg-slate-200" />
                      <span className="w-1/3 bg-red-600" />
                    </span>
                    FR
                  </span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Simulation 2026</div>
              </div>
            </div>

            {/* Pseudo */}
            <div className="flex items-center gap-2">
              {pseudo.trim() ? (
                <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>Bonjour <span className="font-semibold">{pseudo.trim()}</span> 👋</span>
                  <span className="text-slate-400">(</span>
                  <button type="button" onClick={openPseudoModal}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline transition">
                    Changer
                  </button>
                  <span className="text-slate-400">|</span>
                  <button type="button" onClick={clearPseudo}
                    className="text-xs text-slate-400 hover:text-red-600 hover:underline transition">
                    Déconnexion
                  </button>
                  <span className="text-slate-400">)</span>
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Bonjour 👋{" "}
                  <button type="button" onClick={openPseudoModal}
                    className="ml-2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline transition">
                    Ajouter un pseudo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TITRE */}
          <div className="mt-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Préparez votre parcours en France <span className="text-blue-700 dark:text-blue-400">FR</span>
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Testez vos connaissances sur les valeurs de la République, les institutions françaises et la vie en société •
              Entraînement progressif • Explications pédagogiques •
              <span className="text-red-600/80 dark:text-red-400"> Une banque de plus de 400 questions-réponses</span>{" "}
              conformes aux exigences de l'examen civique 2026.
            </p>
          </div>

          {/* BOUTONS HERO */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">

  <Button variant="secondary" onClick={() => router.push("/info")}>
    📖 Comprendre l'examen
  </Button>

  {hasLastResult && (
    <Button variant="secondary" onClick={() => router.push("/results")}>
      {/* ✅ /results — pas /info */}
      Voir le dernier résultat
    </Button>
  )}

  <Button variant="secondary" onClick={smartStart}>
    Essayer et laisser un avis
  </Button>

</div>
        </div>
      </div>

      {/* ===== GRID ===== */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Niveau */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Niveau</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">Choisis ta difficulté</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => {
              const active = level === n;
              return (
                <button key={n} onClick={() => setLevel(n as Level)}
                  className={`rounded-2xl border px-4 py-4 text-center font-semibold transition-all duration-200 ${
                    active
                      ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 scale-105 shadow-md"
                      : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105"
                  }`}>
                  Niveau {n}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Conseil</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Niveau 1 : bases (valeurs, repères clés)</li>
              <li>Niveau 2 : détails + pièges fréquents</li>
              <li>Niveau 3 : approfondissement</li>
            </ul>
          </div>
        </Card>

        {/* Thèmes */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thèmes</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {themes.length}/{THEMES.length} sélectionnés
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const active = themes.includes(t);
              return (
                <button key={t} onClick={() => toggleTheme(t)}
                  className={`px-3 py-2 rounded-full border text-sm font-semibold transition ${
                    active
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}>
                  {t}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setThemes([...THEMES])}>Tout sélectionner</Button>
            <Button variant="secondary" onClick={() => setThemes([])}>Tout retirer</Button>
          </div>
          {!canStart && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              ⚠️ Sélectionne au moins un thème pour démarrer.
            </p>
          )}
        </Card>

        {/* Résumé */}
        <Card>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Résumé du test</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Questions", COUNT],
              ["Temps / question", `${PER_QUESTION_SECONDS}s`],
              ["Validation", "≥ 32 bonnes réponses"],
              ["Niveau", `Niveau ${level}`],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button className="flex-1" onClick={start} disabled={!canStart}>
              Faire un test
            </Button>
            <Button
              className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
              onClick={startExam}>
              Examen blanc
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Ton résultat s'affichera avec les erreurs + explications.
          </p>
        </Card>
      </div>

      {/* ===== MODAL PSEUDO ===== */}
      {pseudoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPseudoOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Avant de commencer</h3>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
  
    <a href={"/register?pseudo=" + encodeURIComponent(pseudoDraft) + "&email=" + encodeURIComponent(emailDraft)}
    className="text-blue-500 hover:underline font-medium"
  >
    Créer un vrai compte
  </a>
  {" "}pour sauvegarder ton historique et accéder aux stats complètes.
</p>
            <input
              value={pseudoDraft}
              onChange={(e) => setPseudoDraft(e.target.value)}
              placeholder="Pseudo (ex : Carlos)"
              className="mt-4 w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              maxLength={20}
              autoFocus
            />
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Adresse email"
              className="mt-3 w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>Annuler</Button>
              <Button type="button" onClick={confirmIdentity}
                disabled={!pseudoDraft.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim().toLowerCase())}>
                Continuer
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Tes données ne sont pas publiques.
            </p>
          </div>
        </div>
      )}

      {/* ===== MODAL FEEDBACK ===== */}
      {openFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenFeedback(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Donner un avis</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ton retour nous aide à améliorer l'expérience.</p>
              </div>
              <button onClick={() => setOpenFeedback(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">✕</button>
            </div>
            {sent ? (
              <div className="mt-5 rounded-2xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 text-green-800 dark:text-green-300">
                Merci ✅ Ton retour a bien été envoyé.
              </div>
            ) : (
              <form name="feedback-qcm" method="POST" data-netlify="true" onSubmit={submitFeedback} className="mt-5 space-y-4">
                <input type="hidden" name="form-name" value="feedback-qcm" />
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Note (1 à 5)</label>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)}
                        className={`h-10 w-10 rounded-xl border text-sm font-bold transition ${
                          rating === n
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Commentaire (optionnel)</label>
                  <textarea name="comment" value={comment} onChange={(e) => setComment(e.target.value)}
                    className="mt-2 w-full min-h-[110px] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Qu'est-ce qui t'a plu ? Qu'est-ce qu'on doit améliorer ?" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" type="button" onClick={() => setOpenFeedback(false)}>Fermer</Button>
                  <Button type="submit" disabled={sending}>{sending ? "Envoi…" : "Envoyer"}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* NETLIFY HIDDEN FORM */}
      <form name="feedback-qcm" method="POST" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="feedback-qcm" />
        <input type="text" name="pseudo" /><input type="text" name="rating" />
        <input type="text" name="comment" /><input type="text" name="page" />
        <input type="text" name="level" /><input type="text" name="themes" />
        <input type="text" name="count" /><input type="text" name="mode" />
      </form>

    </main>
  );
}
