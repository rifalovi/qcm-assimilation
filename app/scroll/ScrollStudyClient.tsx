"use client";
import ScrollInteractions from "@/components/ScrollInteractions";
import { createClient } from "@/lib/supabase/client";
// app/scroll/ScrollStudyClient.tsx — CLIENT COMPONENT

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Question, MCQVariant } from "@/types/questions";
import { useUser, ROLE_LIMITS } from "../components/UserContext";
import { trackEvent } from "@/lib/posthog";

// Type union : question normale OU carte CTA
type CardItem = Question | { type: "cta"; ctaRole: "anonymous" | "freemium" | "premium" | "elite"; hasTheme: boolean; cardsCount: number };
function isCTA(card: CardItem): card is { type: "cta"; ctaRole: "anonymous" | "freemium" | "premium" | "elite"; hasTheme: boolean; cardsCount: number } {
  return (card as any).type === "cta";
}

// Composant carte CTA
function CTACard({ ctaRole, hasTheme, cardsCount }: { ctaRole: "anonymous" | "freemium" | "premium" | "elite"; hasTheme: boolean; cardsCount: number }) {
  const isAnon = ctaRole === "anonymous";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
        style={{
          background: isAnon ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)",
          border: isAnon ? "1px solid rgba(96,165,250,0.30)" : "1px solid rgba(251,191,36,0.30)",
        }}
      >
        {isAnon ? "🔓" : "👑"}
      </div>

      <div>
        <p
          className="text-xl font-extrabold leading-tight text-white"
          style={{ letterSpacing: "-0.01em" }}
        >
          {`Tu as vu les ${cardsCount} cartes ${hasTheme ? "de ce thème" : "gratuites"} !`}
        </p>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: isAnon ? "#bfdbfe" : "#fde68a" }}
        >
          {isAnon
            ? "Crée un compte gratuit pour accéder à 10 cartes par thème — 400 cartes au total disponibles."
            : "Passe en Premium pour accéder aux 400 cartes complètes — tous thèmes, tous niveaux."}
        </p>
      </div>

      <a
        href={isAnon ? "/register" : "/pricing"}
        onClick={() => trackEvent("upgrade_clicked", { source: "scroll_cta", role: ctaRole })}
        className="w-full max-w-xs rounded-2xl py-3.5 text-sm font-bold transition hover:brightness-110 active:scale-95"
        style={{
          background: isAnon
            ? "linear-gradient(135deg, #3b82f6, #60a5fa)"
            : "linear-gradient(135deg, #f59e0b, #fbbf24)",
          color: isAnon ? "#fff" : "#0b0f1a",
          boxShadow: isAnon
            ? "0 12px 28px rgba(59,130,246,0.35)"
            : "0 12px 28px rgba(251,191,36,0.35)",
        }}
      >
        {isAnon ? "Créer un compte gratuit →" : "Passer en Premium →"}
      </a>

      {!isAnon && (
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          19,99€/3 mois · Résiliation à tout moment
        </p>
      )}
    </div>
  );
}

interface Props {
  questions: Question[];
  themes: string[];
  preselectedTheme: string | null;
  role: "anonymous" | "freemium" | "premium" | "elite" | "moderator" | "admin" | "super_admin";
  cardsPerTheme: number;
  totalCards: number;
}

const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrowLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconFilter = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const THEME_ALIASES: Record<string, string[]> = {
  Valeurs: ["Valeurs", "Principes et valeurs de la République"],
  Institutions: ["Institutions", "Système institutionnel et politique"],
  Histoire: ["Histoire", "Histoire, géographie et culture"],
  Société: ["Société", "Vivre dans la société française"],
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

const THEME_COLORS: Record<
  string,
  {
    accent: string;
    bg: string;
    border: string;
    glow: string;
    softText: string;
    gradientA: string;
    gradientB: string;
  }
> = {
  Institutions: {
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.22)",
    glow: "rgba(96,165,250,0.22)",
    softText: "#bfdbfe",
    gradientA: "rgba(96,165,250,0.20)",
    gradientB: "rgba(59,130,246,0.06)",
  },
  "Système institutionnel et politique": {
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.22)",
    glow: "rgba(96,165,250,0.22)",
    softText: "#bfdbfe",
    gradientA: "rgba(96,165,250,0.20)",
    gradientB: "rgba(59,130,246,0.06)",
  },

  Valeurs: {
    accent: "#34d399",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.22)",
    glow: "rgba(52,211,153,0.22)",
    softText: "#a7f3d0",
    gradientA: "rgba(52,211,153,0.20)",
    gradientB: "rgba(16,185,129,0.06)",
  },
  "Principes et valeurs de la République": {
    accent: "#34d399",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.22)",
    glow: "rgba(52,211,153,0.22)",
    softText: "#a7f3d0",
    gradientA: "rgba(52,211,153,0.20)",
    gradientB: "rgba(16,185,129,0.06)",
  },

  Histoire: {
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.10)",
    border: "rgba(251,146,60,0.22)",
    glow: "rgba(251,146,60,0.22)",
    softText: "#fdba74",
    gradientA: "rgba(251,146,60,0.20)",
    gradientB: "rgba(249,115,22,0.06)",
  },
  "Histoire, géographie et culture": {
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.10)",
    border: "rgba(251,146,60,0.22)",
    glow: "rgba(251,146,60,0.22)",
    softText: "#fdba74",
    gradientA: "rgba(251,146,60,0.20)",
    gradientB: "rgba(249,115,22,0.06)",
  },

  Société: {
    accent: "#facc15",
    bg: "rgba(250,204,21,0.10)",
    border: "rgba(250,204,21,0.22)",
    glow: "rgba(250,204,21,0.20)",
    softText: "#fde68a",
    gradientA: "rgba(250,204,21,0.18)",
    gradientB: "rgba(234,179,8,0.05)",
  },
  "Vivre dans la société française": {
    accent: "#facc15",
    bg: "rgba(250,204,21,0.10)",
    border: "rgba(250,204,21,0.22)",
    glow: "rgba(250,204,21,0.20)",
    softText: "#fde68a",
    gradientA: "rgba(250,204,21,0.18)",
    gradientB: "rgba(234,179,8,0.05)",
  },

  Citoyenneté: {
    accent: "#f472b6",
    bg: "rgba(244,114,182,0.10)",
    border: "rgba(244,114,182,0.22)",
    glow: "rgba(244,114,182,0.18)",
    softText: "#f9a8d4",
    gradientA: "rgba(244,114,182,0.18)",
    gradientB: "rgba(236,72,153,0.05)",
  },
  Géographie: {
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.10)",
    border: "rgba(167,139,250,0.22)",
    glow: "rgba(167,139,250,0.18)",
    softText: "#c4b5fd",
    gradientA: "rgba(167,139,250,0.18)",
    gradientB: "rgba(139,92,246,0.05)",
  },
};

const DEFAULT_COLOR = {
  accent: "#60a5fa",
  bg: "rgba(96,165,250,0.10)",
  border: "rgba(96,165,250,0.22)",
  glow: "rgba(96,165,250,0.22)",
  softText: "#bfdbfe",
  gradientA: "rgba(96,165,250,0.20)",
  gradientB: "rgba(59,130,246,0.06)",
};

const themeColor = (theme: string) => THEME_COLORS[theme] ?? DEFAULT_COLOR;

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
  const { accent, bg, border, glow, softText, gradientA, gradientB } = themeColor(theme);

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "#cbd5e1",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <IconArrowLeft /> Retour
        </button>

        <div className="flex gap-1.5">
          {Array.from({ length: totalVariants }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === variantIndex ? "24px" : "8px",
                background: i === variantIndex ? accent : "rgba(255,255,255,0.16)",
                boxShadow: i === variantIndex ? `0 0 16px ${glow}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
        Approche {variantIndex + 1} · {variant.title}
      </div>

      <div
        className="rounded-[1.4rem] px-4 py-4 transition-all duration-300"
        style={{
  maxWidth: "85%",
  background: `linear-gradient(135deg, ${gradientA}, ${gradientB})`,
  border: `1px solid ${border}`,
  boxShadow: `0 16px 36px ${glow.replace("0.22", "0.12")}`,
}}
      >
        <p className="text-sm font-semibold leading-relaxed" style={{ color: "#f8fafc" }}>
          {variant.prompt?.trim() || fallbackQuestionText}
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3">
        {variant.options.map((opt, i) => {
          const isCorrect = i === variant.correct;
          const isSelected = selected === i;

          let bgColor = "rgba(255,255,255,0.05)";
          let borderColor = "rgba(255,255,255,0.10)";
          let textColor = "#e2e8f0";
          let shadow = "none";

          if (revealed) {
            if (isCorrect) {
              bgColor = "rgba(52,211,153,0.16)";
              borderColor = "#34d399";
              textColor = "#a7f3d0";
              shadow = "0 10px 24px rgba(52,211,153,0.16)";
            } else if (isSelected) {
              bgColor = "rgba(239,68,68,0.16)";
              borderColor = "#ef4444";
              textColor = "#fecaca";
              shadow = "0 10px 24px rgba(239,68,68,0.16)";
            }
          } else if (isSelected) {
            bgColor = bg;
            borderColor = accent;
            textColor = "#ffffff";
            shadow = `0 10px 24px ${glow}`;
          }

          return (
            <button
              key={i}
              onClick={() => !revealed && setSelected(i)}
              className="flex w-full items-center justify-between gap-3 rounded-[1.2rem] px-4 py-3.5 text-left transition-all duration-200 hover:translate-y-[-1px]"
              style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
                fontSize: "0.92rem",
                lineHeight: "1.45",
                cursor: revealed ? "default" : "pointer",
                boxShadow: shadow,
              }}
            >
              <span>{opt}</span>
              {revealed && isCorrect && (
                <span style={{ color: "#34d399" }}>
                  <IconCheck />
                </span>
              )}
              {revealed && isSelected && !isCorrect && (
                <span style={{ color: "#ef4444" }}>
                  <IconX />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div
          className="rounded-[1.2rem] p-4 text-sm leading-relaxed"
          style={{
            background: bg,
            border: `1px solid ${border}`,
            color: softText,
            boxShadow: `0 10px 24px ${glow.replace("0.22", "0.10")}`,
          }}
        >
          💡 {variant.explanation}
        </div>
      )}

      {!revealed && (
        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
          Sélectionne ta réponse
        </p>
      )}
    </div>
  );
}

function FlashView({
  question,
  qIndex,
  total,
}: {
  question: Question;
  qIndex: number;
  total: number;
}) {
  const { accent, bg, border, glow, softText, gradientA, gradientB } = themeColor(question.theme);

  return (
    <div className="flex h-full flex-col gap-2 p-3 pr-12">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
          {question.theme}
        </span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
          {qIndex + 1} / {total}
        </span>
      </div>

      <div
        className="rounded-[1.4rem] p-3 transition-all duration-300 self-start w-full"
        style={{
          background: `linear-gradient(135deg, ${gradientA}, ${gradientB})`,
          border: `1px solid ${border}`,
          boxShadow: `0 16px 36px ${glow.replace("0.22", "0.12")}`,
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
          Question
        </p>
        <p className="font-bold leading-snug" style={{ fontSize: "0.92rem", color: "#f8fafc", textAlign: "justify" }}>
          {question.question}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
          Meilleure réponse
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      <div
        className="flex-1 overflow-auto rounded-[1.5rem] px-4 py-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p style={{ fontSize: "0.92rem", color: "#dbeafe", lineHeight: "1.7", textAlign: "justify", fontWeight: "500" }}>
          {question.best_answer}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span>↕</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
            Autre question
          </span>
        </div>
        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.10)" }} />
        <div className="flex items-center gap-1.5">
          <span>←</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
            Voir QCM
          </span>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  qIndex,
  total,
  isActive,
}: {
  question: Question;
  qIndex: number;
  total: number;
  isActive: boolean;
}) {
  const [mcqIndex, setMcqIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const variants = question.mcq_variants;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) {
          setMcqIndex(mcqIndex === null ? 0 : Math.min(mcqIndex + 1, variants.length - 1));
        } else {
          setMcqIndex(mcqIndex === null ? null : mcqIndex === 0 ? null : mcqIndex - 1);
        }
      }

      touchStartRef.current = null;
    },
    [mcqIndex, variants.length]
  );

  useEffect(() => {
    if (!isActive) setMcqIndex(null);
  }, [isActive]);

  const panelCount = variants.length + 1;
  const activePanel = mcqIndex === null ? 0 : mcqIndex + 1;
  const { accent, glow } = themeColor(question.theme);

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{ height: "100%", width: "100%", scrollSnapAlign: "start" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full"
        style={{
          width: `${panelCount * 100}%`,
          transform: `translateX(-${(activePanel * 100) / panelCount}%)`,
          transition: "transform 0.34s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
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
        <div
          className="pointer-events-none absolute right-3 top-1/2 flex flex-col gap-1.5"
          style={{ transform: "translateY(-50%)" }}
        >
          {variants.map((_, i) => (
            <div
              key={i}
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: `${accent}88`,
                boxShadow: `0 0 10px ${glow}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeDrawer({
  themes,
  activeTheme,
  onSelect,
  onClose,
}: {
  themes: string[];
  activeTheme: string | null;
  onSelect: (t: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[75vh] w-full flex-col gap-3 overflow-y-auto rounded-t-[2rem] p-5 pb-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(10,15,26,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-lg font-bold text-white">Choisir une thématique</p>
          <button
            onClick={onClose}
            className="text-xl leading-none text-gray-400 transition hover:text-white"
          >
            ×
          </button>
        </div>

        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Sélectionne un thème pour cibler ta révision
        </p>

        <button
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200"
          style={{
            background:
              activeTheme === null ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
            border: `1.5px solid ${
              activeTheme === null ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.08)"
            }`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)",
              }}
            />
            <span className="font-medium text-white">Toutes les thématiques</span>
          </div>
          {activeTheme === null && <IconCheck />}
        </button>

        {themes.map((theme) => {
          const { accent, bg, border } = themeColor(theme);
          const isActive = activeTheme === theme;

          return (
            <button
              key={theme}
              onClick={() => {
                onSelect(theme);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200 hover:translate-y-[-1px]"
              style={{
                background: isActive ? bg : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${isActive ? accent : "rgba(255,255,255,0.08)"}`,
                boxShadow: isActive ? `0 10px 24px ${accent}20` : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ background: accent }} />
                <span
                  className="font-medium"
                  style={{ color: isActive ? accent : "#cbd5e1" }}
                >
                  {theme}
                </span>
              </div>
              {isActive && <span style={{ color: accent }}><IconCheck /></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExamModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-5 pb-8"
      style={{
        background: "rgba(0,0,0,0.70)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-[2rem] p-6"
        style={{
          background:
            "linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(10,15,26,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.40)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mb-3 text-4xl">🎓</div>
          <p className="text-lg font-bold text-white">Passer en mode Examen ?</p>
          <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>
            Questions chronométrées, sans correction immédiate.
          </p>
        </div>

        <button
          onClick={onConfirm}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition hover:brightness-105"
          style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            color: "#0b0f1a",
            boxShadow: "0 12px 28px rgba(96,165,250,0.30)",
          }}
        >
          Commencer l'examen blanc →
        </button>

        <button
          onClick={onCancel}
          className="w-full rounded-2xl py-3 text-sm font-medium transition hover:bg-white/10"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "#94a3b8",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Continuer la révision
        </button>
      </div>
    </div>
  );
}

  
export default function ScrollStudyClient({ questions, themes, preselectedTheme, role, cardsPerTheme, totalCards }: Props) {
const router = useRouter();
const limits = ROLE_LIMITS[role];
const visibleQuestions = questions;

const [userId, setUserId] = useState<string | undefined>(undefined);
const [sessionId] = useState<string>(() => {
  if (typeof window === "undefined") return "anonymous";
  const existing = localStorage.getItem("qcm_session_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("qcm_session_id", id);
  return id;
});

useEffect(() => {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) setUserId(user.id);
  });
}, []);

  // Construire le tableau avec CTA injectée à la fin si pas premium
  const buildCardsWithCta = (questions: Question[], themeActive: boolean): CardItem[] => {
    if (['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role)) return questions;
    return [...questions, { type: "cta", ctaRole: role as "anonymous" | "freemium" | "premium" | "elite", hasTheme: themeActive, cardsCount: questions.length }];
  };

  const [activeTheme, setActiveTheme] = useState<string | null>(preselectedTheme);
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bloquer le scroll natif du navigateur
useEffect(() => {
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  return () => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
  };
}, []);

  useEffect(() => {
    setActiveTheme(preselectedTheme);
  }, [preselectedTheme]);

  const filteredQuestions = activeTheme
    ? visibleQuestions.filter((q) => sameTheme(q.theme, activeTheme))
    : questions;

  useEffect(() => {
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt((entry.target as HTMLElement).dataset.index || "0");
            setActiveIndex(idx);
            const card = filteredQuestions[idx];
            if (card && !(card as any).type) {
              trackEvent("scroll_card_viewed", {
                question_id: (card as any).id,
                theme: (card as any).theme,
                index: idx,
              });
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredQuestions]);

  const currentThemeAccent = activeTheme ? themeColor(activeTheme).accent : "#60a5fa";
  const currentThemeBg = activeTheme ? themeColor(activeTheme).bg : "rgba(255,255,255,0.06)";
  const currentThemeBorder = activeTheme
    ? themeColor(activeTheme).border
    : "rgba(255,255,255,0.10)";

  return (
    <div
      style={{
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 28%), radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 24%), linear-gradient(180deg, #08101d 0%, #070d18 45%, #050913 100%)",
        color: "#f1f5f9",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        height: "calc(100svh - 120px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        maxWidth: "390px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(7,12,22,0.88)",
          backdropFilter: "blur(14px)",
          zIndex: 10,
        }}
      >
<div className="mb-3 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <button
      onClick={() => router.push("/")}
      className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    </button>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#94a3b8" }}>
        Révision immersive
      </p>
      <p className="mt-1 text-sm font-semibold text-white">Flash-cards thématiques</p>
    </div>
  </div>

          <div
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#cbd5e1",
            }}
          >
            {filteredQuestions.length} cartes
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowThemeDrawer(true)}
            className="flex items-center gap-2 rounded-2xl px-3 py-2 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: currentThemeBg,
              border: `1px solid ${currentThemeBorder}`,
              boxShadow: activeTheme ? `0 10px 24px ${currentThemeAccent}22` : "none",
            }}
          >
            <IconFilter />
            <span className="text-sm font-semibold truncate max-w-[140px] block" style={{ color: currentThemeAccent }}>
              {activeTheme ?? "Tous les thèmes"}
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              ▾
            </span>
          </button>

          <div
            className="flex rounded-full p-1 gap-1"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                color: "#0b0f1a",
                boxShadow: "0 8px 18px rgba(96,165,250,0.22)",
              }}
            >
              Révision
            </div>

            <button
              onClick={() => setShowExamModal(true)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition hover:text-white"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Examen
            </button>
          </div>
        </div>
      </div>

      {activeTheme && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-2"
          style={{
            background: themeColor(activeTheme).bg,
            borderBottom: `1px solid ${themeColor(activeTheme).border}`,
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: themeColor(activeTheme).accent }}
          >
            📚 Révision ciblée · {activeTheme} · {filteredQuestions.length} question
            {filteredQuestions.length > 1 ? "s" : ""}
          </span>

          <button
            onClick={() => setActiveTheme(null)}
            className="rounded-full px-2 py-0.5 text-xs transition hover:opacity-85"
            style={{
              background: "rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.58)",
            }}
          >
            Tout voir
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
        }}
      >
        {filteredQuestions.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <div>
              <p className="mb-4 text-4xl">🔍</p>
              <p className="font-semibold text-white">Aucune question pour ce thème</p>
              <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
                Essaie un autre thème ou reviens plus tard.
              </p>
            </div>
          </div>
        ) : (
          buildCardsWithCta(filteredQuestions, !!activeTheme).map((card, i) => (
            <div
              key={isCTA(card) ? "cta" : `${activeTheme}-${card.id}`}
              data-index={i}
              style={{
                height: "100%",
                scrollSnapAlign: "start",
                overflow: "hidden",
              }}
            >
              {isCTA(card) ? (
                <CTACard ctaRole={card.ctaRole} hasTheme={card.hasTheme} cardsCount={card.cardsCount} />
              ) : (
                <div className="relative h-full">
                  <QuestionCard
                    question={card}
                    qIndex={i}
                    total={filteredQuestions.length}
                    isActive={activeIndex === i}
                  />
                  <ScrollInteractions
                    questionId={card.id}
                    userId={userId}
                    sessionId={sessionId}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {filteredQuestions.length > 0 && (
        <div
          className="flex-shrink-0 px-5 py-3 flex items-center gap-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(7,12,22,0.90)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="flex-1 overflow-hidden rounded-full"
            style={{
              height: "4px",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(Math.min(activeIndex + 1, filteredQuestions.length) / filteredQuestions.length) * 100}%`,
                background: `linear-gradient(90deg, ${currentThemeAccent}, #818cf8)`,
                boxShadow: `0 0 20px ${currentThemeAccent}40`,
              }}
            />
          </div>

          <span
            className="text-xs font-medium"
            style={{
              color: "rgba(255,255,255,0.42)",
              minWidth: "48px",
              textAlign: "right",
            }}
          >
            {Math.min(activeIndex + 1, filteredQuestions.length)} / {filteredQuestions.length}
          </span>
        </div>
      )}

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
        <ExamModal
          onConfirm={() => {
            setShowExamModal(false);
            router.push("/exam");
          }}
          onCancel={() => setShowExamModal(false)}
        />
      )}
    </div>
  );
}