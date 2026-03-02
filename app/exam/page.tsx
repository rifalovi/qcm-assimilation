"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "../../components/Card";
import Button from "../../components/Button";

type Level = 1 | 2 | 3;
type Theme = "Valeurs" | "Institutions" | "Histoire" | "Société";

const COUNT = 40;
const THEMES: Theme[] = ["Valeurs", "Institutions", "Histoire", "Société"];

type QcmUser = { pseudo: string; email: string };

function normEmail(v: string) {
  return v.trim().toLowerCase();
}

function loadUser(): QcmUser | null {
  if (typeof window === "undefined") return null;
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

function userKeyByEmail(email: string) {
  return normEmail(email);
}

function MarianneMark() {
  return (
    <div className="h-11 w-11 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-slate-700">
        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function ExamPage() {
  const router = useRouter();

  // ===== USER (pseudo + email) =====
  const [user, setUser] = useState<QcmUser | null>(null);
  const [hasLastResult, setHasLastResult] = useState(false);

  // modal identité
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [pseudoDraft, setPseudoDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");

  useEffect(() => {
    const u = loadUser();
    if (u) {
      setUser(u);
      setPseudoDraft(u.pseudo ?? "");
      setEmailDraft(u.email ?? "");
      const key = u.email ? userKeyByEmail(u.email) : null;
      setHasLastResult(!!(key && localStorage.getItem(`last_result:${key}`)));
    } else {
      setHasLastResult(false);
    }
  }, []);

  function openIdentityModal() {
    const u = loadUser();
    setPseudoDraft(u?.pseudo ?? "");
    setEmailDraft(u?.email ?? "");
    setPseudoOpen(true);
  }

  function clearIdentity() {
    localStorage.removeItem("qcm_user");
    setUser(null);
    setPseudoDraft("");
    setEmailDraft("");
    setHasLastResult(false);
  }

  function confirmIdentityAndRun(action: () => void) {
    const p = pseudoDraft.trim();
    const e = normEmail(emailDraft);

    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!p || !okEmail) return;

    const u: QcmUser = { pseudo: p, email: e };
    saveUser(u);
    setUser(u);

    const key = userKeyByEmail(u.email);
    setHasLastResult(!!localStorage.getItem(`last_result:${key}`));

    setPseudoOpen(false);
    action();
  }

  function smartStartExam() {
    // 1) pas identifié -> modal
    const u = loadUser();
    if (!u?.pseudo?.trim() || !u?.email?.trim()) {
      openIdentityModal();
      return;
    }
    // 2) sinon -> démarrer examen
    startExam();
  }

  // ===== SETTINGS EXAM =====
  const [level, setLevel] = useState<Level>(3);
  const [themes, setThemes] = useState<Theme[]>([...THEMES]);
  const canStart = themes.length > 0;

  const meta = useMemo(
    () => ({ level, themes, count: COUNT }),
    [level, themes]
  );

  function toggleTheme(t: Theme) {
    setThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function selectAll() {
    setThemes([...THEMES]);
  }

  function clearAll() {
    setThemes([]);
  }

  function startExam() {
    if (!canStart) return;

    // ici on garde le même process: quiz_settings + /quiz
    localStorage.setItem(
      "quiz_settings",
      JSON.stringify({
        ...meta,
        mode: "exam",
        perQuestion: 30,
        maxDuration: 900,
      })
    );
    router.push("/quiz");
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER (identique à l'accueil) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-white to-red-600" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />

        <div className="p-5 sm:p-6 lg:p-7">
          {/* Top bar */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <MarianneMark />
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
                <div className="text-sm text-slate-600">Examen blanc • Simulation 2026</div>
              </div>
            </div>

            {/* Bonjour + changer/effacer */}
            <div className="flex items-center gap-2">
              {user?.pseudo?.trim() ? (
                <div className="text-sm text-slate-700 flex items-center gap-2">
                  <span>
                    Bonjour <span className="font-semibold">{user.pseudo.trim()}</span> 👋
                  </span>
                  <span className="text-slate-400">(</span>

                  <button
                    type="button"
                    onClick={openIdentityModal}
                    className="text-xs text-slate-400 hover:text-slate-700 hover:underline transition"
                  >
                    Changer
                  </button>

                  <span className="text-slate-400">|</span>

                  <button
                    type="button"
                    onClick={clearIdentity}
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
                    onClick={openIdentityModal}
                    className="ml-2 text-xs text-slate-400 hover:text-slate-700 hover:underline transition"
                  >
                    S’identifier
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Titre centré */}
          <div className="mt-6 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Examen blanc | QCM Assimilation <span className="text-blue-700">FR</span>
            </h1>

            <p className="mt-3 text-slate-600 max-w-3xl mx-auto">
              40 questions • 30 secondes par question • Validation si{" "}
              <strong className="text-slate-900">≥ 32</strong> bonnes réponses.
            </p>

            {/* Boutons stratégiques (identiques à l'accueil) */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {hasLastResult && (
                <Button
                  className="min-w-[190px]"
                  variant="secondary"
                  onClick={() => router.push("/results?mode=exam")}
                >
                  Voir le dernier résultat
                </Button>
              )}

              <Button className="min-w-[220px]" variant="secondary" onClick={smartStartExam}>
                Essayer et laisser un avis
              </Button>

              <Button className="min-w-[180px]" variant="secondary" onClick={() => router.push("/")}>
                Mode entraînement
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU (cards) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Niveau */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Niveau</h3>
            <span className="text-sm text-slate-500">Difficulté</span>
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
        </Card>

        {/* Thèmes */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Thèmes</h3>
            <span className="text-sm text-slate-500">
              {themes.length}/{THEMES.length}
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
              <span className="font-semibold">30s</span>
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

          <Button className="mt-6 w-full" onClick={smartStartExam} disabled={!canStart}>
            Démarrer l’examen blanc
          </Button>

          <p className="mt-3 text-xs text-slate-500">
            Vous avez 30 secondes de reflexion en mode examen. Par défaut le niveau de difficulté est 3. Vous pouvez réajuster le niveau.
          </p>
        </Card>
      </div>

      {/* MODAL IDENTITÉ (pseudo + email) */}
      {pseudoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPseudoOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold">Avant de commencer</h3>
            <p className="mt-1 text-sm text-slate-600">
              Pour commencer l’examen blanc, entre un pseudo et ton adresse email.
              Ils seront associés à tes résultats.
            </p>

            <input
              value={pseudoDraft}
              onChange={(e) => setPseudoDraft(e.target.value)}
              placeholder="Pseudo (ex : Carlos)"
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              maxLength={20}
            />

            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="Adresse email"
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />

            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => setPseudoOpen(false)}>
                Annuler
              </Button>

              <Button
                type="button"
                onClick={() => confirmIdentityAndRun(startExam)}
                disabled={!pseudoDraft.trim() || !emailDraft.trim()}
              >
                Continuer
              </Button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Connexion simplifiée (pas encore de compte complet).
            </p>
          </div>
        </div>
      )}
    </main>
  );
}