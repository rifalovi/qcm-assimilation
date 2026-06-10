"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, label: "Scroll vertical", sub: "Changez de question", accent: "var(--cc-primary)" },
  { id: 2, label: "Swipe horizontal", sub: "3 QCM associés", accent: "var(--cc-warning)" },
  { id: 3, label: "Résultats détaillés", sub: "Score · Heatmap · Erreurs", accent: "var(--cc-success)" },
];

function StatusBar() {
  return (
    <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--cc-surface-alt)", borderBottom: "1px solid var(--cc-border)", padding: "0 10px", flexShrink: 0 }}>
      <span style={{ fontSize: 7.5, color: "var(--cc-text-disabled)", fontWeight: 600 }}>Cap Citoyen</span>
      <span style={{ fontSize: 7.5, color: "var(--cc-text-disabled)" }}>Carlos</span>
    </div>
  );
}

// En-tête commun aux écrans d'étude (scroll / QCM)
function StudyHeader() {
  return (
    <div style={{ background: "var(--cc-surface)", borderBottom: "1px solid var(--cc-border)", padding: "6px 10px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 8, background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", borderRadius: 6, padding: "2px 7px", color: "var(--cc-text-muted)" }}>← Retour</span>
        <span style={{ fontSize: 8, background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", borderRadius: 6, padding: "2px 7px", color: "var(--cc-text-muted)" }}>400 cartes</span>
      </div>
      <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: "0.16em", color: "var(--cc-text-disabled)", marginBottom: 2 }}>RÉVISION IMMERSIVE</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--cc-text)", marginBottom: 6 }}>Flash-cards thématiques</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--cc-primary-soft)", border: "1px solid color-mix(in srgb, var(--cc-primary) 25%, transparent)", borderRadius: 9, padding: "3px 8px", fontSize: 8, fontWeight: 600, color: "var(--cc-primary)" }}>Tous les thèmes ▾</div>
        <div style={{ display: "flex", gap: 2, background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", borderRadius: 9, padding: 2 }}>
          <span style={{ background: "var(--cc-primary)", borderRadius: 7, padding: "3px 8px", fontSize: 8, fontWeight: 700, color: "#fff" }}>Révision</span>
          <span style={{ padding: "3px 8px", fontSize: 8, color: "var(--cc-text-muted)" }}>Examen</span>
        </div>
      </div>
    </div>
  );
}

// Barre de progression réelle (remplace l'ancienne nav 5 onglets)
function ProgressBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px 8px", borderTop: "1px solid var(--cc-border)", background: "var(--cc-surface)", flexShrink: 0, marginTop: "auto" }}>
      <div style={{ flex: 1, height: 3, background: "var(--cc-surface-raised)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: "12%", background: "var(--cc-primary)", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 6.5, color: "var(--cc-text-disabled)", fontWeight: 500, minWidth: 28, textAlign: "right" }}>1 / 400</span>
    </div>
  );
}

function Screen1() {
  const cards = [
    { tag: "SYSTÈME INSTITUTIONNEL · 1/400", accent: "var(--cc-primary)", question: "Qui vote les lois en France ?", answer: "Les lois sont votées par le Parlement, composé de l'Assemblée nationale et du Sénat." },
    { tag: "HISTOIRE, GÉOGRAPHIE ET CULTURE · 2/400", accent: "var(--cc-warning)", question: "En quelle année commence la Révolution française ?", answer: "La Révolution française commence en 1789 avec la prise de la Bastille." },
    { tag: "PRINCIPES ET VALEURS · 3/400", accent: "var(--cc-success)", question: "Quelle est la devise de la République française ?", answer: "Liberté, Égalité, Fraternité — inscrite dans la Constitution de 1958." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--cc-surface)" }}>
      <StatusBar />
      <StudyHeader />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ animation: "scrollV 5s ease-in-out infinite" }}>
          <style>{`@keyframes scrollV{0%,18%{transform:translateY(0)}35%,53%{transform:translateY(-135px)}70%,88%{transform:translateY(-270px)}100%{transform:translateY(0)}}`}</style>
          {cards.map((card, i) => (
            <div key={i} style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.07em", color: card.accent, marginBottom: 5 }}>{card.tag}</div>
              <div style={{ background: `color-mix(in srgb, ${card.accent} 10%, var(--cc-surface))`, border: `1px solid color-mix(in srgb, ${card.accent} 28%, transparent)`, borderRadius: 10, padding: "7px 9px", marginBottom: 5 }}>
                <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: "0.07em", color: card.accent, marginBottom: 3 }}>QUESTION</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--cc-text)", lineHeight: 1.3 }}>{card.question}</div>
              </div>
              <div style={{ fontSize: 7, color: "var(--cc-text-disabled)", textAlign: "center", margin: "4px 0" }}>— Meilleure réponse —</div>
              <div style={{ background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", borderRadius: 10, padding: "6px 9px", fontSize: 7.5, color: "var(--cc-text-muted)", lineHeight: 1.5 }}>{card.answer}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "5px 0", borderTop: "1px solid var(--cc-border)", marginTop: 5 }}>
                <span style={{ fontSize: 7, color: "var(--cc-text-disabled)" }}>↕ Autre question</span>
                <span style={{ fontSize: 7, color: "var(--cc-text-disabled)" }}>← Voir QCM</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProgressBar />
    </div>
  );
}

function Screen2() {
  const W = 190;
  const accent = "var(--cc-warning)";
  const panels = [
    { dotActive: 0, approach: "FLASH-CARD · HISTOIRE", question: "En quelle année commence la Révolution française ?", type: "flash", options: [] as { text: string; state: string }[] },
    { dotActive: 1, approach: "APPROCHE 1 · QUESTION DIRECTE", question: "En quelle année commence la Révolution ?", type: "qcm", options: [{ text: "1776", state: "default" }, { text: "1815", state: "default" }, { text: "1789 ✓", state: "correct" }, { text: "1905", state: "default" }] },
    { dotActive: 2, approach: "APPROCHE 2 · CONTEXTUALISÉE", question: "Quel événement de 1789 marque la Révolution ?", type: "qcm", options: [{ text: "La signature de la Constitution ✗", state: "wrong" }, { text: "La prise de la Bastille ✓", state: "correct" }, { text: "L'abdication du Roi", state: "default" }] },
  ];
  const optS = (s: string): React.CSSProperties => ({
    background: s === "correct" ? "color-mix(in srgb, var(--cc-success) 12%, var(--cc-surface))" : s === "wrong" ? "color-mix(in srgb, var(--cc-danger) 12%, var(--cc-surface))" : "var(--cc-surface-alt)",
    border: `1px solid ${s === "correct" ? "var(--cc-success)" : s === "wrong" ? "var(--cc-danger)" : "var(--cc-border)"}`,
    color: s === "correct" ? "var(--cc-success)" : s === "wrong" ? "var(--cc-danger)" : "var(--cc-text-muted)",
    borderRadius: 8, padding: "5px 8px", fontSize: 8, fontWeight: 500, marginBottom: 4,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--cc-surface)" }}>
      <StatusBar />
      <StudyHeader />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ display: "flex", width: W * 3, animation: "swipeH 6s ease-in-out infinite" }}>
          <style>{`@keyframes swipeH{0%,18%{transform:translateX(0)}35%,53%{transform:translateX(-${W}px)}70%,88%{transform:translateX(-${W * 2}px)}100%{transform:translateX(0)}}`}</style>
          {panels.map((panel, i) => (
            <div key={i} style={{ width: W, flexShrink: 0, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", borderRadius: 6, padding: "2px 7px", fontSize: 7.5, color: "var(--cc-text-muted)" }}>← Retour</span>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[0, 1, 2].map((di) => di === panel.dotActive
                    ? <div key={di} style={{ width: 18, height: 3, borderRadius: 2, background: accent }} />
                    : <div key={di} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cc-border-strong)" }} />
                  )}
                </div>
              </div>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.07em", color: accent, marginBottom: 6 }}>{panel.approach}</div>
              <div style={{ background: `color-mix(in srgb, ${accent} 10%, var(--cc-surface))`, border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`, borderRadius: 10, padding: "7px 9px", marginBottom: 6 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--cc-text)", lineHeight: 1.3 }}>{panel.question}</div>
              </div>
              {panel.type === "flash"
                ? <div style={{ background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", borderRadius: 10, padding: "6px 9px", fontSize: 7.5, color: "var(--cc-text-muted)", lineHeight: 1.5 }}>La Révolution française commence en 1789, marquant une rupture avec l&apos;Ancien Régime.</div>
                : panel.options.map((opt, oi) => <div key={oi} style={optS(opt.state)}>{opt.text}</div>)
              }
              <div style={{ fontSize: 7, color: "var(--cc-text-disabled)", textAlign: "center", marginTop: 5 }}>{panel.type === "flash" ? "← swipe pour voir les QCM →" : "Sélectionne ta réponse"}</div>
            </div>
          ))}
        </div>
      </div>
      <ProgressBar />
    </div>
  );
}

function Screen3() {
  const heatmap = Array.from({ length: 40 }, (_, i) => ([8, 18, 26].includes(i) ? "r" : "g"));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--cc-surface)" }}>
      <StatusBar />
      {/* Bandeau tricolore */}
      <div style={{ height: 3, display: "flex", flexShrink: 0 }}>
        <div style={{ flex: 1, background: "var(--cc-flag-blue)" }} />
        <div style={{ flex: 1, background: "var(--cc-surface-raised)" }} />
        <div style={{ flex: 1, background: "var(--cc-flag-red)" }} />
      </div>
      <div style={{ flex: 1, overflow: "hidden", padding: "7px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Carte profil / statut */}
        <div style={{ background: "var(--cc-surface-raised)", border: "1px solid var(--cc-border)", borderRadius: 12, padding: "7px 9px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--cc-surface-alt)", border: "1px solid var(--cc-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>👤</div>
            <div style={{ fontSize: 6.5, color: "var(--cc-text-muted)", lineHeight: 1.4 }}><span style={{ color: "var(--cc-text-muted)", fontWeight: 600 }}>RÉPUBLIQUE FRANÇAISE</span><br />Mode entraînement · 2026</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cc-text)", lineHeight: 1.2, marginBottom: 3 }}>Carlos, voici ton résultat</div>
          <div style={{ fontSize: 7, color: "var(--cc-text-disabled)", marginBottom: 6 }}>Niveau 1 · Valeurs · 40 questions</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "color-mix(in srgb, var(--cc-success) 12%, var(--cc-surface))", border: "1px solid color-mix(in srgb, var(--cc-success) 35%, transparent)", borderRadius: 999, padding: "2px 8px", fontSize: 7.5, fontWeight: 700, color: "var(--cc-success)" }}>VALIDÉ ✓</span>
        </div>
        {/* Tuiles statistiques */}
        <div style={{ display: "flex", gap: 5 }}>
          {[
            { label: "Score", val: "37/40", color: "var(--cc-primary)" },
            { label: "Réussite", val: "93%", color: "var(--cc-success)" },
            { label: "Erreurs", val: "3", color: "var(--cc-danger)" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: `color-mix(in srgb, ${s.color} 10%, var(--cc-surface))`, border: `1px solid color-mix(in srgb, ${s.color} 30%, transparent)`, borderRadius: 10, padding: "5px 6px" }}>
              <div style={{ fontSize: 6.5, color: "var(--cc-text-muted)", marginBottom: 1 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>
        {/* Heatmap */}
        <div style={{ flex: 1, background: "var(--cc-surface)", border: "1px solid var(--cc-border)", borderRadius: 12, padding: "6px 9px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--cc-text)", marginBottom: 2 }}>Heatmap des réponses</div>
          <div style={{ fontSize: 6.5, color: "var(--cc-text-disabled)", marginBottom: 6 }}>Vert = bonne réponse · Rouge = erreur</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {heatmap.map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 4, background: c === "g" ? "var(--cc-success)" : "var(--cc-danger)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SCREENS = [<Screen1 key={1} />, <Screen2 key={2} />, <Screen3 key={3} />];

export default function ScrollDemo() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <span className="cc-badge cc-badge-info mb-3 inline-flex" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>Fonctionnalité principale</span>
        <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: "var(--cc-text)" }}>Révisez comme vous <span style={{ color: "var(--cc-primary)" }}>scrollez</span>.</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: "var(--cc-text-muted)" }}>Swipez, répondez, progressez — une expérience immersive qui transforme chaque minute en révision efficace.</p>
      </div>

      <div className="hidden sm:flex sm:justify-center sm:gap-10">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex flex-col items-center gap-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: `color-mix(in srgb, ${step.accent} 15%, var(--cc-surface))`, color: step.accent }}>{step.id}</div>
            <div className="relative" style={{ width: 190, height: 420 }}>
              <div className="absolute inset-0 rounded-[32px] border-[3px]" style={{ borderColor: "var(--cc-border-strong)", background: "var(--cc-surface-raised)", boxShadow: "var(--cc-shadow-lg)" }} />
              <div className="absolute left-1/2 top-2 h-3.5 w-14 -translate-x-1/2 rounded-full" style={{ background: "var(--cc-border-strong)" }} />
              <div className="absolute inset-[4px] overflow-hidden rounded-[28px]">{SCREENS[i]}</div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: step.accent }}>{step.label}</p>
              <p className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>{step.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-5 sm:hidden">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold" style={{ background: `color-mix(in srgb, ${STEPS[active].accent} 15%, var(--cc-surface))`, color: STEPS[active].accent }}>{active + 1}</div>
          <p className="text-sm font-bold" style={{ color: STEPS[active].accent }}>{STEPS[active].label}</p>
          <p className="text-xs" style={{ color: "var(--cc-text-disabled)" }}>{STEPS[active].sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} className="flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-20" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="relative" style={{ width: 180, height: 390 }}>
            <div className="absolute inset-0 rounded-[28px] border-[3px]" style={{ borderColor: "var(--cc-border-strong)", background: "var(--cc-surface-raised)", boxShadow: "var(--cc-shadow-lg)" }} />
            <div className="absolute left-1/2 top-2 h-3 w-12 -translate-x-1/2 rounded-full" style={{ background: "var(--cc-border-strong)" }} />
            <div className="absolute inset-[4px] overflow-hidden rounded-[24px]">{SCREENS[active]}</div>
          </div>
          <button onClick={() => setActive((a) => Math.min(STEPS.length - 1, a + 1))} disabled={active === STEPS.length - 1} className="flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-20" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button key={i} onClick={() => setActive(i)} className="rounded-full transition-all duration-300" style={i === active ? { height: 8, width: 24, background: step.accent } : { height: 8, width: 8, background: "var(--cc-border-strong)" }} />
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button onClick={() => router.push("/scroll")} className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 text-base font-bold transition hover:-translate-y-0.5 active:scale-[0.98]" style={{ border: "1px solid color-mix(in srgb, var(--cc-primary) 30%, transparent)", background: "var(--cc-primary-soft)", color: "var(--cc-primary)", boxShadow: "var(--cc-shadow)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></svg>
          Essayer le scroll
        </button>
      </div>
    </div>
  );
}
