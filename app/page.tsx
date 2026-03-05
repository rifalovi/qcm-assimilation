"use client";

import { useRouter } from "next/navigation";
import Card from "../components/Card";
import Button from "../components/Button";
import { useEffect, useMemo, useState } from "react";
import { loadUser, userKeyByEmail } from "../src/lib/qcmUser"; // ajuste le chemin
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
      className="h-7 w-7 text-slate-800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 8c8.5 0 15.5 7 15.5 15.5S40.5 39 32 39 16.5 32 16.5 23.5 23.5 8 32 8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M18 53c3.8-7.6 10.1-12 14-12s10.2 4.4 14 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 22c4-6 9-9 16-9 1.5 0 3 .2 4.3.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function encode(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export default function HomePage() {
  const router = useRouter();



function requireAuthAndRun(action: () => void) {
  if (!pseudo || !email) {
    setPseudoOpen(true);
    return;
  }

  action();
}

  // ===== PSEUDO (propre) =====
const [pseudo, setPseudo] = useState("");
const [email, setEmail] = useState("");

type QcmUser = { pseudo: string; email: string };

function normEmail(v: string) {
  return v.trim().toLowerCase();
}

function loadUser(): QcmUser | null {
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch {
    return null;
  }
}

function saveUser(u: QcmUser) {
  localStorage.setItem("qcm_user", JSON.stringify(u));
}

function userKey(u: QcmUser) {
  // clé stable pour lier “dernier résultat” à un utilisateur
  return normEmail(u.email);
}

const [pseudoDraft, setPseudoDraft] = useState("");
const [emailDraft, setEmailDraft] = useState("");
const [pseudoOpen, setPseudoOpen] = useState(false);

const [hasLast, setHasLast] = useState(false);
const [user, setUser] = useState<{ pseudo: string; email: string } | null>(null);

useEffect(() => {
  if (typeof window === "undefined") return;

  const rawUser = localStorage.getItem("qcm_user");
  if (!rawUser) return;

  try {
    const parsed = JSON.parse(rawUser);
    setUser(parsed);

    const key = parsed.email
      ? String(parsed.email).trim().toLowerCase()
      : "anonymous";

    const exists = !!localStorage.getItem(`last_result:${key}`);
    setHasLast(exists);
  } catch {}
}, []);

useEffect(() => {
  const u = loadUser();
  if (u) {
    setPseudo(u.pseudo);
    setEmail(u.email);
    setPseudoDraft(u.pseudo);
    setEmailDraft(u.email);
  }
}, []);

const [hasLastResult, setHasLastResult] = useState(false);

useEffect(() => {
  const u = loadUser();
  if (!u?.email) { setHasLastResult(false); return; }

  const email = u.email.trim().toLowerCase();

  async function check() {
    // 1) Vérifier Supabase
    const remote = await hasAnyResult(email);
    if (remote) { setHasLastResult(true); return; }

    // 2) Fallback localStorage
    const hasTrain = !!localStorage.getItem(`last_result:train:${email}`);
    const hasExam  = !!localStorage.getItem(`last_result:exam:${email}`);
    setHasLastResult(hasTrain || hasExam);
  }

  check();
}, [pseudo, email]);

{hasLastResult && (
  <Button variant="secondary" onClick={() => router.push("/results")}>
    Voir le dernier résultat
  </Button>
)}

// Charger pseudo enregistré au chargement


useEffect(() => {
  const raw = localStorage.getItem("qcm_user");
  if (!raw) return;

  try {
    const u = JSON.parse(raw) as { pseudo?: string; email?: string };
    if (u.pseudo) setPseudo(u.pseudo);
    if (u.email) setEmail(u.email);
    setPseudoDraft(u.pseudo ?? "");
    setEmailDraft(u.email ?? "");
  } catch {}
}, []);

function openPseudoModal() {
  // Pré-remplir avec user existant si présent
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
  localStorage.removeItem("qcm_user"); // ✅ on efface l'identité complète
  setPseudo("");
  setEmail("");
  setPseudoDraft("");
  setEmailDraft("");
  setHasLastResult(false);
  setPseudoOpen(false);
}

  // ===== QUIZ SETTINGS =====
  const [level, setLevel] = useState<Level>(1);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;

  const meta = useMemo(
    () => ({
      level,
      themes,
      count: COUNT,
      perQuestionSeconds: PER_QUESTION_SECONDS,
      mode: "train" as const,
    }),
    [level, themes]
  );



function confirmPseudoAndStart() {
  const p = pseudoDraft.trim();
  const e = emailDraft.trim().toLowerCase();

  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  if (!p || !okEmail) return;

  const u = { pseudo: p, email: e };

  localStorage.setItem("qcm_user", JSON.stringify(u));
  setPseudo(p);
  setEmail(e);

  setPseudoOpen(false);

  // ✅ on lance le test
  localStorage.setItem("quiz_settings", JSON.stringify(meta));
  router.push("/quiz");
}

function start() {
  if (!canStart) return;

  requireAuthAndRun(() => {
    localStorage.setItem("quiz_settings", JSON.stringify(meta));
    router.push("/quiz");
  });
}

function smartStart() {
  // si pas identifié → ouvrir le modal
  if (!pseudo.trim() || !email.trim()) {
    setPseudoDraft(pseudo);
    setEmailDraft(email);
    setPseudoOpen(true);
    return;
  }

  // sinon → lancer le test
  start();
}

function startExam() {
  requireAuthAndRun(() => {
    router.push("/exam");
  });
}

function confirmIdentity() {
  const p = pseudoDraft.trim();
  const e = emailDraft.trim().toLowerCase();

  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  if (!p || !okEmail) return;

  const user = { pseudo: p, email: e };
  localStorage.setItem("qcm_user", JSON.stringify(user));

  setPseudo(p);
  setEmail(e);

  setPseudoOpen(false);

  // Lance le test
  localStorage.setItem("quiz_settings", JSON.stringify(meta));
  router.push("/quiz");
}

  function toggleTheme(t: Theme) {
    setThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function selectAll() {
    setThemes([...THEMES]);
  }

  function clearAll() {
    setThemes([]);
  }

  // ===== FEEDBACK HOME (Netlify) =====
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
      "form-name": "feedback-qcm",
      rating: String(rating),
      comment: comment.trim(),
      pseudo: pseudo.trim() || "",

      // contexte page accueil
      page: "home",
      level: String(level),
      themes: themes.join(", "),
      count: String(COUNT),
      mode: "train",
    };

    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode(payload),
      });

      if (!res.ok) throw new Error("Netlify form submission failed");

      setSent(true);
      setComment("");
    } catch {
      alert("Erreur d’envoi. Réessaie.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* ================= HEADER OFFICIEL (RESPONSIVE) ================= */}
<div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
  {/* Bande tricolore */}
  <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />

  {/* halos */}
  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-100/40 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />

  {/* ✅ CONTENU */}
  <div className="p-5 sm:p-6 lg:p-7">
    {/* TOP BAR */}
    <div className="flex items-start justify-between gap-4 flex-wrap">
      {/* Bloc République */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
          <MarianneMark />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <div className="text-xs uppercase tracking-widest text-slate-500">
              République Française
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
              <span className="inline-flex h-2.5 w-4 overflow-hidden rounded-sm border border-slate-200">
                <span className="w-1/3 bg-blue-600" />
                <span className="w-1/3 bg-white" />
                <span className="w-1/3 bg-red-600" />
              </span>
              FR
            </span>
          </div>

          <div className="text-sm text-slate-600">Simulation 2026</div>
        </div>
      </div>

      {/* Bonjour + reset pseudo */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-slate-700">
<div className="flex items-center justify-end">
  {pseudo.trim() ? (
    <div className="text-sm text-slate-700 flex items-center gap-2">
      <span>
        Bonjour <span className="font-semibold">{pseudo.trim()}</span> 👋
      </span>

      <span className="text-slate-400">(</span>

      <button
        type="button"
        onClick={openPseudoModal}
        className="text-xs text-slate-400 hover:text-slate-700 hover:underline transition"
      >
        Changer
      </button>

      <span className="text-slate-400">|</span>

      <button
        type="button"
        onClick={clearPseudo}
        className="text-xs text-slate-400 hover:text-red-600 hover:underline transition"
      >
        Effacer
      </button>

      <span className="text-slate-400">)</span>
    </div>
  ) : (
    <div className="text-sm text-slate-500">
      Bonjour 👋{" "}
      <button
        type="button"
        onClick={openPseudoModal}
        className="ml-2 text-xs text-slate-400 hover:text-slate-700 hover:underline transition"
      >
        Ajouter un pseudo
      </button>
    </div>
  )}
</div>

        </div>

      
      </div>
    </div>

    {/* TITRE CENTRÉ */}
{/* Titre + sous-texte (centré, compact) */}
<div className="mt-6 text-center">
  <h1 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
    Préparez votre parcours en France <span className="text-blue-700">FR</span>
  </h1>

  <p className="mt-3 text-slate-600 max-w-3xl mx-auto">
    Testez vos connaissances sur les valeurs de la République, les institutions françaises et la vie en société • Entraînement progressif • Explications pédagogiques •
    <span className="text-red-600/80">
      {" "}
      Une banque de plus de 400 questions-réponses
    </span>{" "}
    conformes aux exigences de l’examen civique 2026.
  </p>
</div>

{/* Boutons (une seule ligne, centrés, wrap si petit écran) */}
<div className="mt-6 flex flex-wrap justify-center gap-3">
 

  {hasLastResult && (
    <Button
      className="min-w-[190px]"
      variant="secondary"
      onClick={() => router.push("/results")}
    >
      Voir le dernier résultat
    </Button>
  )}
<Button variant="secondary" onClick={smartStart}>
  Essayer et laisser un avis
</Button>
 

</div>
      </div>
</div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Niveau */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Niveau</h3>
            <span className="text-sm text-slate-500">Choisis ta difficulté</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => {
              const active = level === n;
              return (
                <button
                  key={n}
                  onClick={() => setLevel(n as Level)}
                  className={`rounded-2xl border px-4 py-4 text-center font-semibold transition-all duration-200 ${
                    active
                      ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 scale-105 shadow-md"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 hover:scale-105"
                  }`}
                >
                  Niveau {n}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-slate-600">
            <div className="font-semibold text-slate-900 mb-1">Conseil</div>
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
            <h3 className="text-lg font-bold">Thèmes</h3>
            <span className="text-sm text-slate-500">
              {themes.length}/{THEMES.length} sélectionnés
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const active = themes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTheme(t)}
                  className={`px-3 py-2 rounded-full border text-sm font-semibold transition ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button variant="secondary" onClick={clearAll}>
              Tout retirer
            </Button>
          </div>

          {!canStart && (
            <p className="mt-3 text-sm text-red-600">
              ⚠️ Sélectionne au moins un thème pour démarrer.
            </p>
          )}
        </Card>

        {/* Résumé + démarrage */}
        <Card>
          <h3 className="text-lg font-bold">Résumé du test</h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Questions</span>
              <span className="font-semibold">{COUNT}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Temps / question</span>
              <span className="font-semibold">{PER_QUESTION_SECONDS}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Validation</span>
              <span className="font-semibold">≥ 32 bonnes réponses</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Niveau</span>
              <span className="font-semibold">Niveau {level}</span>
            </div>
          </div>

<div className="mt-6 flex gap-3">
  <Button className="flex-1" onClick={start} disabled={!canStart}>
    Faire un test
  </Button>

  <Button
  className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
  onClick={startExam}
>
  Examen blanc
</Button>
</div>

          <p className="mt-3 text-xs text-slate-500">
            Ton résultat s’affichera avec les erreurs + explications.
          </p>
        </Card>
      </div>

      {/* ===== MODAL PSEUDO (OBLIGATOIRE) ===== */}
{pseudoOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setPseudoOpen(false)}
    />

    {/* Modal */}
    <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6">
      <h3 className="text-lg font-bold">Avant de commencer</h3>
      <p className="mt-1 text-sm text-slate-600">
        Pour commencer le test, entre un pseudo et ton adresse email.
        Ils seront associés à tes résultats.
      </p>

      {/* Pseudo */}
      <input
        value={pseudoDraft}
        onChange={(e) => setPseudoDraft(e.target.value)}
        placeholder="Pseudo (ex : Carlos)"
        className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        maxLength={20}
        autoFocus
      />

      {/* Email */}
      <input
        type="email"
        value={emailDraft}
        onChange={(e) => setEmailDraft(e.target.value)}
        placeholder="Adresse email"
        className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
      />

      <div className="mt-5 flex gap-2 justify-end">
        <Button
          variant="secondary"
          type="button"
          onClick={() => setPseudoOpen(false)}
        >
          Annuler
        </Button>

        <Button
          type="button"
          onClick={confirmIdentity}
          disabled={
            !pseudoDraft.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim().toLowerCase())
          }
        >
          Continuer
        </Button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Tes données ne sont pas publiques. Connexion simplifiée (pas encore de compte complet).
      </p>
    </div>
  </div>
)}

      {/* ===== MODAL FEEDBACK (HOME) ===== */}
      {openFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenFeedback(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Donner un avis</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Ton retour nous aide à améliorer l’expérience.
                </p>
              </div>

              <button
                onClick={() => setOpenFeedback(false)}
                className="text-slate-500 hover:text-slate-900"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {sent ? (
              <div className="mt-5 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800">
                Merci ✅ Ton retour a bien été envoyé.
              </div>
            ) : (
              <form
                name="feedback-qcm"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={submitFeedback}
                className="mt-5 space-y-4"
              >
                <input type="hidden" name="form-name" value="feedback-qcm" />
                <p className="hidden">
                  <label>
                    Don’t fill this out: <input name="bot-field" />
                  </label>
                </p>

                {/* Contexte */}
                <input type="hidden" name="pseudo" value={pseudo.trim() || ""} />
                <input type="hidden" name="page" value="home" />
                <input type="hidden" name="level" value={String(level)} />
                <input type="hidden" name="themes" value={themes.join(", ")} />
                <input type="hidden" name="count" value={String(COUNT)} />
                <input type="hidden" name="mode" value="train" />

                {/* Note */}
                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Note (1 à 5)
                  </label>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`h-10 w-10 rounded-xl border text-sm font-bold transition ${
                          rating === n
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                        aria-label={`Note ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="rating" value={String(rating)} />
                </div>

                {/* Commentaire */}
                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    name="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2 w-full min-h-[110px] rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Qu’est-ce qui t’a plu ? Qu’est-ce qu’on doit améliorer ?"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setOpenFeedback(false)}
                  >
                    Fermer
                  </Button>
                  <Button type="submit" disabled={sending}>
                    {sending ? "Envoi…" : "Envoyer"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===== NETLIFY: FORM HIDDEN (détection) ===== */}
      <form name="feedback-qcm" method="POST" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="feedback-qcm" />
        <input type="text" name="pseudo" />
        <input type="text" name="rating" />
        <input type="text" name="comment" />
        <input type="text" name="page" />
        <input type="text" name="level" />
        <input type="text" name="themes" />
        <input type="text" name="count" />
        <input type="text" name="mode" />
      </form>

  
    </main>
  );
}