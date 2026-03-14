"use client";
// app/scroll/ScrollStudyClient.tsx — CLIENT COMPONENT

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Question, MCQVariant } from "@/types/questions";

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface Props {
  questions: Question[];
  themes: string[];
  preselectedTheme: string | null; // vient de ?theme= dans l'URL
}

// ─── ICÔNES ───────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconFilter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);


const THEME_ALIASES: Record<string, string[]> = {
  Valeurs: [
    "Valeurs",
    "Principes et valeurs de la République",
  ],
  Institutions: [
    "Institutions",
    "Système institutionnel et politique",
  ],
  Histoire: [
    "Histoire",
    "Histoire, géographie et culture",
  ],
  Société: [
    "Société",
    "Vivre dans la société française",
  ],
};


function sameTheme(a: string, b: string) {
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return true;

  for (const aliases of Object.values(THEME_ALIASES)) {
    const normalizedAliases = aliases.map(normalize);
    if (normalizedAliases.includes(na) && normalizedAliases.includes(nb)) {
      return true;
    }
  }

  return false;
}

// ─── COULEURS PAR THÈME ───────────────────────────────────────────────────────
// Chaque thème a une couleur distincte pour l'identité visuelle
const THEME_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  // Institutions
  "Institutions": {
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.2)",
  },
  "Système institutionnel et politique": {
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.2)",
  },

  // Valeurs
  "Valeurs": {
    accent: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.2)",
  },
  "Principes et valeurs de la République": {
    accent: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.2)",
  },

  // Histoire
  "Histoire": {
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
  },
  "Histoire, géographie et culture": {
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
  },

  // Société
  "Société": {
    accent: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.2)",
  },
  "Vivre dans la société française": {
    accent: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.2)",
  },

  // Optionnel : compatibilité anciens thèmes
  "Citoyenneté": {
    accent: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.2)",
  },
  "Géographie": {
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.2)",
  },
};

const DEFAULT_COLOR = {
  accent: "#60a5fa",
  bg: "rgba(96,165,250,0.08)",
  border: "rgba(96,165,250,0.2)",
};

const themeColor = (theme: string) => THEME_COLORS[theme] ?? DEFAULT_COLOR;

// ─── MCQ VIEW ─────────────────────────────────────────────────────────────────
function MCQView({
  variant,
  variantIndex,
  totalVariants,
  theme,
  fallbackQuestionText,
  onBack,
}: {
  variant: MCQVariant;
  variantIndex: number;
  totalVariants: number;
  theme: string;
  fallbackQuestionText: string;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected !== null;
  const { accent } = themeColor(theme);

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)", color: "#a0aec0" }}>
          <IconArrowLeft /> Retour
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: totalVariants }).map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === variantIndex ? "24px" : "8px", background: i === variantIndex ? accent : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
        Approche {variantIndex + 1} · {variant.title}
      </div>

      {/* ── Question rappelée ── */}
    {/* ── Question rappelée ── */}
<div
  className="rounded-2xl px-4 py-3"
  style={{
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <p
    className="text-sm font-semibold leading-snug"
    style={{ color: "#f1f5f9" }}
  >
    {variant.prompt?.trim() || fallbackQuestionText}
  </p>
</div>

      <div className="flex flex-col gap-3 flex-1 justify-center">
        {variant.options.map((opt, i) => {
          const isCorrect = i === variant.correct;
          const isSelected = selected === i;
          let bg = "rgba(255,255,255,0.05)", border = "rgba(255,255,255,0.1)", color = "#e2e8f0";
          if (revealed) {
            if (isCorrect) { bg = "rgba(52,211,153,0.15)"; border = "#34d399"; color = "#6ee7b7"; }
            else if (isSelected) { bg = "rgba(239,68,68,0.15)"; border = "#ef4444"; color = "#fca5a5"; }
          } else if (isSelected) { bg = `${accent}33`; border = accent; }

          return (
            <button key={i} onClick={() => !revealed && setSelected(i)}
              className="w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3"
              style={{ background: bg, border: `1.5px solid ${border}`, color, fontSize: "0.9rem", lineHeight: "1.4", cursor: revealed ? "default" : "pointer" }}>
              <span>{opt}</span>
              {revealed && isCorrect && <span style={{ color: "#34d399" }}><IconCheck /></span>}
              {revealed && isSelected && !isCorrect && <span style={{ color: "#ef4444" }}><IconX /></span>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="rounded-2xl p-4 text-sm leading-relaxed"
          style={{ background: `${accent}15`, border: `1px solid ${accent}40`, color: accent }}>
          💡 {variant.explanation}
        </div>
      )}
      {!revealed && <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Sélectionne ta réponse</p>}
    </div>
  );
}

// ─── FLASH VIEW ───────────────────────────────────────────────────────────────
function FlashView({ question, qIndex, total }: { question: Question; qIndex: number; total: number }) {
  const { accent, bg, border } = themeColor(question.theme);

  return (
    <div className="flex flex-col h-full p-5 gap-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>{question.theme}</span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{qIndex + 1} / {total}</span>
      </div>

      <div className="rounded-3xl p-5 flex-shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: accent }}>Question</p>
        <p className="font-semibold leading-snug" style={{ fontSize: "1.05rem", color: "#f1f5f9" }}>{question.question}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Meilleure réponse</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      <div className="flex-1 overflow-auto">
        <p style={{ fontSize: "0.92rem", color: "#cbd5e1", lineHeight: "1.7" }}>{question.best_answer}</p>
      </div>

      <div className="flex items-center justify-center gap-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span>↕</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Autre question</span>
        </div>
        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />
        <div className="flex items-center gap-1.5">
          <span>←</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Voir QCM</span>
        </div>
      </div>
    </div>
  );
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────
function QuestionCard({ question, qIndex, total, isActive }: {
  question: Question; qIndex: number; total: number; isActive: boolean;
}) {
  const [mcqIndex, setMcqIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const variants = question.mcq_variants;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) setMcqIndex(mcqIndex === null ? 0 : Math.min(mcqIndex + 1, variants.length - 1));
      else setMcqIndex(mcqIndex === null ? null : mcqIndex === 0 ? null : mcqIndex - 1);
    }
    touchStartRef.current = null;
  }, [mcqIndex, variants.length]);

  useEffect(() => { if (!isActive) setMcqIndex(null); }, [isActive]);

  const panelCount = variants.length + 1;
  const activePanel = mcqIndex === null ? 0 : mcqIndex + 1;

  return (
    <div className="relative flex-shrink-0 overflow-hidden"
      style={{ height: "100%", width: "100%", scrollSnapAlign: "start" }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex h-full"
        style={{
          width: `${panelCount * 100}%`,
          transform: `translateX(-${(activePanel * 100) / panelCount}%)`,
          transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
        <div style={{ width: `${100 / panelCount}%`, flexShrink: 0 }}>
          <FlashView question={question} qIndex={qIndex} total={total} />
        </div>
        {variants.map((variant, i) => (
          <div key={i} style={{ width: `${100 / panelCount}%`, flexShrink: 0 }}>
            <MCQView
  variant={variant}
  variantIndex={i}
  totalVariants={variants.length}
  theme={question.theme}
  fallbackQuestionText={question.question}
  onBack={() => setMcqIndex(i === 0 ? null : i - 1)}
/>
          </div>
        ))}
      </div>
      {mcqIndex === null && (
        <div className="absolute right-3 top-1/2 flex flex-col gap-1.5 pointer-events-none"
          style={{ transform: "translateY(-50%)" }}>
          {variants.map((_, i) => (
            <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%",
              background: themeColor(question.theme).accent + "80" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── THEME SELECTOR DRAWER ────────────────────────────────────────────────────
// Drawer qui monte depuis le bas, liste les thèmes avec leur couleur
function ThemeDrawer({ themes, activeTheme, onSelect, onClose }: {
  themes: string[]; activeTheme: string | null; onSelect: (t: string | null) => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 flex flex-col gap-3 max-h-[75vh] overflow-y-auto"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-lg text-white">Choisir une thématique</p>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Sélectionne un thème pour cibler ta révision
        </p>

        {/* Option "Toutes les thématiques" */}
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl transition-all duration-200"
          style={{
            background: activeTheme === null ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
            border: `1.5px solid ${activeTheme === null ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
          }}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)" }} />
            <span className="font-medium text-white">Toutes les thématiques</span>
          </div>
          {activeTheme === null && <IconCheck />}
        </button>

        {/* Un bouton par thème */}
        {themes.map((theme) => {
          const { accent, bg, border } = themeColor(theme);
          const isActive = activeTheme === theme;
          return (
            <button key={theme}
              onClick={() => { onSelect(theme); onClose(); }}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl transition-all duration-200"
              style={{
                background: isActive ? bg : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${isActive ? accent : "rgba(255,255,255,0.08)"}`,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
                <span className="font-medium" style={{ color: isActive ? accent : "#cbd5e1" }}>{theme}</span>
              </div>
              {isActive && <span style={{ color: accent }}><IconCheck /></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── EXAM MODAL ───────────────────────────────────────────────────────────────
function ExamModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-5"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="font-bold text-lg text-white">Passer en mode Examen ?</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Questions chronométrées, sans correction immédiate.
          </p>
        </div>
        <button onClick={onConfirm} className="w-full py-3.5 rounded-2xl font-semibold text-sm"
          style={{ background: "#60a5fa", color: "#0b0f1a" }}>
          Commencer l'examen blanc →
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-2xl text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
          Continuer la révision
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function ScrollStudyClient({ questions, themes, preselectedTheme }: Props) {
  const router = useRouter();

  // activeTheme : null = toutes les questions, string = filtre par thème
  // On initialise avec le thème venant de l'URL (ex: depuis la page résultats)
  const [activeTheme, setActiveTheme] = useState<string | null>(preselectedTheme);

useEffect(() => {
  setActiveTheme(preselectedTheme);
}, [preselectedTheme]);

  const [showThemeDrawer, setShowThemeDrawer] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Filtrage ────────────────────────────────────────────────────────────────
  // Quand l'utilisateur change de thème, on filtre les questions
  
  const filteredQuestions = activeTheme
  ? questions.filter((q) => sameTheme(q.theme, activeTheme))
  : questions;

  // Reset scroll au début quand le filtre change
  useEffect(() => {
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTheme]);

  // ── IntersectionObserver : détecte la carte visible ──────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(parseInt((entry.target as HTMLElement).dataset.index || "0"));
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredQuestions]); // recalcule quand les questions filtrées changent

  const currentThemeColor = activeTheme ? themeColor(activeTheme).accent : "#60a5fa";

  return (
    <div style={{
      background: "#0b0f1a", color: "#f1f5f9",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      height: "100dvh", display: "flex", flexDirection: "column",
      overflow: "hidden", maxWidth: "430px", margin: "0 auto", position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,15,26,0.95)", backdropFilter: "blur(10px)", zIndex: 10 }}>

        {/* Bouton filtre thème */}
        <button onClick={() => setShowThemeDrawer(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all"
          style={{
            background: activeTheme ? themeColor(activeTheme).bg : "rgba(255,255,255,0.06)",
            border: `1px solid ${activeTheme ? themeColor(activeTheme).border : "rgba(255,255,255,0.1)"}`,
          }}>
          <IconFilter />
          <span className="text-sm font-semibold" style={{ color: currentThemeColor }}>
            {activeTheme ?? "Tous les thèmes"}
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>▾</span>
        </button>

        {/* Toggle révision / examen */}
        <div className="flex rounded-full p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "#60a5fa", color: "#0b0f1a" }}>
            Révision
          </div>
          <button onClick={() => setShowExamModal(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            Examen
          </button>
        </div>
      </div>

      {/* ── Bandeau thème actif (affiché uniquement si filtre actif) ────────── */}
      {activeTheme && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2"
          style={{ background: themeColor(activeTheme).bg, borderBottom: `1px solid ${themeColor(activeTheme).border}` }}>
          <span className="text-xs font-semibold" style={{ color: themeColor(activeTheme).accent }}>
            📚 Révision ciblée · {activeTheme} · {filteredQuestions.length} question{filteredQuestions.length > 1 ? "s" : ""}
          </span>
          <button onClick={() => setActiveTheme(null)}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            Tout voir
          </button>
        </div>
      )}

      {/* ── Scroll Feed ───────────────────────────────────────────────────── */}
      <div ref={containerRef} style={{ flex: 1, overflowY: "scroll", scrollSnapType: "y mandatory" }}>
        {filteredQuestions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-8">
            <div>
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-white">Aucune question pour ce thème</p>
              <p className="text-sm mt-2" style={{ color: "#64748b" }}>Essaie un autre thème ou reviens plus tard.</p>
            </div>
          </div>
        ) : (
          filteredQuestions.map((q, i) => (
            <div key={`${activeTheme}-${q.id}`} data-index={i}
              style={{ height: "100%", scrollSnapAlign: "start", overflow: "hidden" }}>
              <QuestionCard question={q} qIndex={i} total={filteredQuestions.length} isActive={activeIndex === i} />
            </div>
          ))
        )}
      </div>

      {/* ── Barre de progression ──────────────────────────────────────────── */}
      {filteredQuestions.length > 0 && (
        <div className="flex-shrink-0 px-5 py-3 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,15,26,0.95)" }}>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((activeIndex + 1) / filteredQuestions.length) * 100}%`, background: `linear-gradient(90deg, ${currentThemeColor}, #818cf8)` }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)", minWidth: "48px", textAlign: "right" }}>
            {activeIndex + 1} / {filteredQuestions.length}
          </span>
        </div>
      )}

      {/* ── Modales ───────────────────────────────────────────────────────── */}
      {showThemeDrawer && (
<ThemeDrawer
  themes={themes}
  activeTheme={activeTheme}
  onSelect={(theme) => {
    setActiveTheme(theme);
    if (theme) {
      router.push(`/scroll?theme=${encodeURIComponent(theme)}`);
    } else {
      router.push("/scroll");
    }
  }}
  onClose={() => setShowThemeDrawer(false)}
/>
      )}
      {showExamModal && (
        <ExamModal onConfirm={() => { setShowExamModal(false); router.push("/exam"); }}
          onCancel={() => setShowExamModal(false)} />
      )}
    </div>
  );
}
