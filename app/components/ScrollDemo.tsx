"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, label: "Scroll vertical", sub: "Changez de question", color: "text-blue-300", numBg: "bg-blue-500/20" },
  { id: 2, label: "Swipe horizontal", sub: "3 QCM associés", color: "text-amber-300", numBg: "bg-amber-500/20" },
  { id: 3, label: "Résultats détaillés", sub: "Score · Heatmap · Erreurs", color: "text-emerald-300", numBg: "bg-emerald-500/20" },
];

function StatusBar() {
  return (
    <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0b1626", padding: "0 10px", flexShrink: 0 }}>
      <span style={{ fontSize: 7.5, color: "#334155", fontWeight: 600 }}>Cap Citoyen</span>
      <span style={{ fontSize: 7.5, color: "#334155" }}>Carlos</span>
    </div>
  );
}

function NavBar() {
  return (
    <div style={{ background: "#0b1626", borderBottom: "1px solid #131f30", padding: "6px 10px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 8, background: "#131f30", borderRadius: 6, padding: "2px 7px", color: "#64748b" }}>← Retour</span>
        <span style={{ fontSize: 8, background: "#131f30", borderRadius: 6, padding: "2px 7px", color: "#64748b" }}>400 cartes</span>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#e2e8f0", marginBottom: 5 }}>Flash-cards thématiques</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#0f1c2e", border: "1px solid #1e3050", borderRadius: 9, padding: "3px 8px", fontSize: 8, color: "#60a5fa" }}>Tous les thèmes ▾</div>
        <div style={{ display: "flex", gap: 2, background: "#0f1c2e", borderRadius: 9, padding: 2 }}>
          <span style={{ background: "#2563eb", borderRadius: 7, padding: "3px 8px", fontSize: 8, fontWeight: 700, color: "#fff" }}>Révision</span>
          <span style={{ padding: "3px 8px", fontSize: 8, color: "#475569" }}>Examen</span>
        </div>
      </div>
    </div>
  );
}

function BottomBar() {
  const items = [
    { icon: "🏠", label: "Accueil", active: false },
    { icon: "📝", label: "Entraîner", active: false },
    { icon: "🎯", label: "Examen", active: false },
    { icon: "📊", label: "Stats", active: true },
    { icon: "👤", label: "Compte", active: false },
  ];
  return (
    <div style={{ display: "flex", height: 32, borderTop: "1px solid #131f30", background: "#0b1626", flexShrink: 0, marginTop: "auto" }}>
      {items.map((item) => (
        <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <span style={{ fontSize: 11 }}>{item.icon}</span>
          <span style={{ fontSize: 6, color: item.active ? "#2563eb" : "#334155" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar() {
  return (
    <>
      <div style={{ padding: "4px 10px 0", flexShrink: 0 }}>
        <div style={{ height: 2, background: "#0d1829", borderRadius: 1 }}>
          <div style={{ height: "100%", width: "0.5%", background: "#2563eb", borderRadius: 1 }} />
        </div>
      </div>
      <div style={{ padding: "1px 10px 3px", textAlign: "right", fontSize: 6, color: "#334155", flexShrink: 0 }}>1 / 400</div>
    </>
  );
}

function Screen1() {
  const cards = [
    { tag: "SYSTÈME INSTITUTIONNEL · 1/400", tagColor: "#60a5fa", qBg: "#0f2040", qBorder: "#1d3a6b", qlColor: "#3b82f6", question: "Qui vote les lois en France ?", answer: "Les lois sont votées par le Parlement, composé de l'Assemblée nationale et du Sénat." },
    { tag: "HISTOIRE, GÉOGRAPHIE ET CULTURE · 2/400", tagColor: "#fb923c", qBg: "#1f1000", qBorder: "#6b3000", qlColor: "#f97316", question: "En quelle année commence la Révolution française ?", answer: "La Révolution française commence en 1789 avec la prise de la Bastille." },
    { tag: "PRINCIPES ET VALEURS · 3/400", tagColor: "#34d399", qBg: "#001f12", qBorder: "#005c38", qlColor: "#10b981", question: "Quelle est la devise de la République française ?", answer: "Liberté, Égalité, Fraternité — inscrite dans la Constitution de 1958." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <StatusBar />
      <NavBar />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ animation: "scrollV 5s ease-in-out infinite" }}>
          <style>{`@keyframes scrollV{0%,18%{transform:translateY(0)}35%,53%{transform:translateY(-135px)}70%,88%{transform:translateY(-270px)}100%{transform:translateY(0)}}`}</style>
          {cards.map((card, i) => (
            <div key={i} style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.07em", color: card.tagColor, marginBottom: 5 }}>{card.tag}</div>
              <div style={{ background: card.qBg, border: `1px solid ${card.qBorder}`, borderRadius: 10, padding: "7px 9px", marginBottom: 5 }}>
                <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: "0.07em", color: card.qlColor, marginBottom: 3 }}>QUESTION</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{card.question}</div>
              </div>
              <div style={{ fontSize: 7, color: "#1e3050", textAlign: "center", margin: "4px 0" }}>— Meilleure réponse —</div>
              <div style={{ background: "#0d1829", border: "1px solid #1a2840", borderRadius: 10, padding: "6px 9px", fontSize: 7.5, color: "#94a3b8", lineHeight: 1.5 }}>{card.answer}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "5px 0", borderTop: "1px solid #0d1829", marginTop: 5 }}>
                <span style={{ fontSize: 7, color: "#334155" }}>↕ Autre question</span>
                <span style={{ fontSize: 7, color: "#334155" }}>← Voir QCM</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProgressBar />
      <BottomBar />
    </div>
  );
}

function Screen2() {
  const W = 190;
  const panels = [
    { dotActive: 0, approach: "FLASH-CARD · HISTOIRE", approachColor: "#fb923c", qBg: "#1f1000", qBorder: "#6b3000", question: "En quelle année commence la Révolution française ?", type: "flash", options: [] as {text:string;state:string}[] },
    { dotActive: 1, approach: "APPROCHE 1 · QUESTION DIRECTE", approachColor: "#fb923c", qBg: "#1f1000", qBorder: "#6b3000", question: "En quelle année commence la Révolution ?", type: "qcm", options: [{ text: "1776", state: "default" }, { text: "1815", state: "default" }, { text: "1789 ✓", state: "correct" }, { text: "1905", state: "default" }] },
    { dotActive: 2, approach: "APPROCHE 2 · CONTEXTUALISÉE", approachColor: "#fb923c", qBg: "#1f1000", qBorder: "#6b3000", question: "Quel événement de 1789 marque la Révolution ?", type: "qcm", options: [{ text: "La signature de la Constitution ✗", state: "wrong" }, { text: "La prise de la Bastille ✓", state: "correct" }, { text: "L'abdication du Roi", state: "default" }] },
  ];
  const optS = (s: string): React.CSSProperties => ({
    background: s === "correct" ? "#022c18" : s === "wrong" ? "#2c0000" : "#0d1829",
    border: `1px solid ${s === "correct" ? "#047857" : s === "wrong" ? "#7f1d1d" : "#1a2840"}`,
    color: s === "correct" ? "#6ee7b7" : s === "wrong" ? "#fca5a5" : "#94a3b8",
    borderRadius: 8, padding: "5px 8px", fontSize: 8, marginBottom: 4,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <StatusBar />
      <NavBar />
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{ display: "flex", width: W * 3, animation: "swipeH 6s ease-in-out infinite" }}>
          <style>{`@keyframes swipeH{0%,18%{transform:translateX(0)}35%,53%{transform:translateX(-${W}px)}70%,88%{transform:translateX(-${W*2}px)}100%{transform:translateX(0)}}`}</style>
          {panels.map((panel, i) => (
            <div key={i} style={{ width: W, flexShrink: 0, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ background: "#131f30", borderRadius: 6, padding: "2px 7px", fontSize: 7.5, color: "#64748b" }}>← Retour</span>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[0,1,2].map((di) => di === panel.dotActive
                    ? <div key={di} style={{ width: 18, height: 3, borderRadius: 2, background: panel.approachColor }} />
                    : <div key={di} style={{ width: 7, height: 7, borderRadius: "50%", background: "#1a2840" }} />
                  )}
                </div>
              </div>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.07em", color: panel.approachColor, marginBottom: 6 }}>{panel.approach}</div>
              <div style={{ background: panel.qBg, border: `1px solid ${panel.qBorder}`, borderRadius: 10, padding: "7px 9px", marginBottom: 6 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{panel.question}</div>
              </div>
              {panel.type === "flash"
                ? <div style={{ background: "#0d1829", border: "1px solid #1a2840", borderRadius: 10, padding: "6px 9px", fontSize: 7.5, color: "#64748b", lineHeight: 1.5 }}>La Révolution française commence en 1789, marquant une rupture avec l&apos;Ancien Régime.</div>
                : panel.options.map((opt, oi) => <div key={oi} style={optS(opt.state)}>{opt.text}</div>)
              }
              <div style={{ fontSize: 7, color: "#334155", textAlign: "center", marginTop: 5 }}>{panel.type === "flash" ? "← swipe pour voir les QCM →" : "Sélectionne ta réponse"}</div>
            </div>
          ))}
        </div>
      </div>
      <ProgressBar />
      <BottomBar />
    </div>
  );
}

function Screen3() {
  const heatmap = Array.from({ length: 40 }, (_, i) => [8, 18, 26].includes(i) ? "r" : "g");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <StatusBar />
      <div style={{ height: 3, display: "flex", flexShrink: 0 }}>
        <div style={{ flex: 1, background: "#1d4ed8" }} />
        <div style={{ flex: 1, background: "#e2e8f0" }} />
        <div style={{ flex: 1, background: "#b91c1c" }} />
      </div>
      <div style={{ flex: 1, overflow: "hidden", padding: "7px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ background: "#0d1829", border: "1px solid #131f30", borderRadius: 12, padding: "7px 9px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#131f30", border: "1px solid #1a2840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>👤</div>
            <div style={{ fontSize: 6.5, color: "#334155", lineHeight: 1.4 }}><span style={{ color: "#475569", fontWeight: 600 }}>RÉPUBLIQUE FRANÇAISE</span><br />Mode entraînement · 2026</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, marginBottom: 3 }}>Carlos, voici ton résultat</div>
          <div style={{ fontSize: 7, color: "#334155", marginBottom: 6 }}>Niveau 1 · Valeurs · 40 questions</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#022c18", border: "1px solid #047857", borderRadius: 6, padding: "2px 8px", fontSize: 7.5, fontWeight: 700, color: "#34d399" }}>VALIDÉ ✓</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[
            { label: "Score", val: "37/40", bg: "#061630", border: "#0f2e5a", color: "#3b82f6" },
            { label: "Réussite", val: "93%", bg: "#01180d", border: "#024726", color: "#22c55e" },
            { label: "Erreurs", val: "3", bg: "#1a0000", border: "#5c0000", color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "5px 6px" }}>
              <div style={{ fontSize: 6.5, color: "#334155", marginBottom: 1 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: "#0d1829", border: "1px solid #131f30", borderRadius: 12, padding: "6px 9px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>Heatmap des réponses</div>
          <div style={{ fontSize: 6.5, color: "#334155", marginBottom: 6 }}>Vert = bonne réponse · Rouge = erreur</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {heatmap.map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c === "g" ? "#22c55e" : "#ef4444" }} />
            ))}
          </div>
        </div>
      </div>
      <BottomBar />
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
        <span className="mb-3 inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-300">Fonctionnalité principale</span>
        <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">Révisez comme vous <span className="text-blue-400">scrollez</span>.</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">Swipez, répondez, progressez — une expérience immersive qui transforme chaque minute en révision efficace.</p>
      </div>

      <div className="hidden sm:flex sm:justify-center sm:gap-10">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex flex-col items-center gap-4">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step.numBg} ${step.color}`}>{step.id}</div>
            <div className="relative" style={{ width: 190, height: 420 }}>
              <div className="absolute inset-0 rounded-[32px] border-[3px] border-[#1e2d45] bg-[#08101e] shadow-[0_16px_48px_rgba(0,0,0,0.7)]" />
              <div className="absolute left-1/2 top-2 h-3.5 w-14 -translate-x-1/2 rounded-full bg-[#1e2d45]" />
              <div className="absolute -right-[5px] top-20 h-9 w-1 rounded-r-sm bg-[#1e2d45]" />
              <div className="absolute -left-[5px] top-16 h-6 w-1 rounded-l-sm bg-[#1e2d45]" />
              <div className="absolute -left-[5px] top-28 h-6 w-1 rounded-l-sm bg-[#1e2d45]" />
              <div className="absolute inset-[4px] overflow-hidden rounded-[28px]">{SCREENS[i]}</div>
            </div>
            <div className="text-center">
              <p className={`text-sm font-bold ${step.color}`}>{step.label}</p>
              <p className="text-xs text-slate-500">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-5 sm:hidden">
        <div className="text-center">
          <div className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${STEPS[active].numBg} ${STEPS[active].color}`}>{active + 1}</div>
          <p className={`text-sm font-bold ${STEPS[active].color}`}>{STEPS[active].label}</p>
          <p className="text-xs text-slate-500">{STEPS[active].sub}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-20">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="relative" style={{ width: 180, height: 390 }}>
            <div className="absolute inset-0 rounded-[28px] border-[3px] border-[#1e2d45] bg-[#08101e] shadow-[0_16px_48px_rgba(0,0,0,0.7)]" />
            <div className="absolute left-1/2 top-2 h-3 w-12 -translate-x-1/2 rounded-full bg-[#1e2d45]" />
            <div className="absolute -right-[5px] top-16 h-8 w-1 rounded-r-sm bg-[#1e2d45]" />
            <div className="absolute -left-[5px] top-14 h-5 w-1 rounded-l-sm bg-[#1e2d45]" />
            <div className="absolute -left-[5px] top-24 h-5 w-1 rounded-l-sm bg-[#1e2d45]" />
            <div className="absolute inset-[4px] overflow-hidden rounded-[24px]">{SCREENS[active]}</div>
          </div>
          <button onClick={() => setActive((a) => Math.min(STEPS.length - 1, a + 1))} disabled={active === STEPS.length - 1} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-20">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button key={i} onClick={() => setActive(i)} className={`rounded-full transition-all duration-300 ${i === active ? `h-2 w-6 ${i === 0 ? "bg-blue-400" : i === 1 ? "bg-amber-400" : "bg-emerald-400"}` : "h-2 w-2 bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button onClick={() => router.push("/scroll")} className="inline-flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-base font-bold text-amber-200 shadow-[0_12px_32px_rgba(251,191,36,0.12)] transition hover:border-amber-400/50 hover:bg-amber-500/15 active:scale-[0.98]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
          Essayer le scroll
        </button>
      </div>
    </div>
  );
}
