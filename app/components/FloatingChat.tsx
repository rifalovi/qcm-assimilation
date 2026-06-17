"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useUser } from "./UserContext";
import AiPaywall from "./AiPaywall";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const HIDDEN_PATHS = ["/admin", "/login", "/register", "/reset-password", "/quiz", "/exam", "/assistant"];

export default function FloatingChat() {
  const pathname = usePathname();
  const { isAuthenticated } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSignupCta, setShowSignupCta] = useState(false);
  const [keyboardH, setKeyboardH] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus l'input quand le panel s'ouvre
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard detection — même logique que la messagerie
  useEffect(() => {
    if (!open) {
      setKeyboardH(0);
      return;
    }

    // 1. visualViewport (web / PWA / Safari)
    const vv = window.visualViewport;
    if (vv) {
      function onResize() {
        if (!vv) return;
        const kbH = window.innerHeight - vv.height;
        setKeyboardH(kbH > 100 ? kbH : 0);
      }
      vv.addEventListener("resize", onResize);
      return () => vv.removeEventListener("resize", onResize);
    }

    // 2. Fallback Capacitor natif: observer --keyboard-height
    const observer = new MutationObserver(() => {
      const val = getComputedStyle(document.documentElement).getPropertyValue("--keyboard-height");
      setKeyboardH(parseInt(val, 10) || 0);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [open]);

  // Scroll en bas quand le clavier change
  useEffect(() => {
    if (keyboardH > 0) {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }, [keyboardH]);

  // Masquer sur certaines pages
  const hidden =
    HIDDEN_PATHS.some((p) => pathname.startsWith(p)) ||
    !!pathname.match(/^\/communaute\/messages\/.+/);

  // Vérifier le quota côté client pour les anonymes
  function checkClientQuota(): boolean {
    if (isAuthenticated) return true; // géré côté serveur

    const today = new Date().toDateString();
    const key = "chatbot_anon_usage";
    const raw = localStorage.getItem(key);
    let usage = { date: today, count: 0 };

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) usage = parsed;
      } catch {}
    }

    if (usage.count >= 3) return false;

    usage.count++;
    localStorage.setItem(key, JSON.stringify(usage));
    return true;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // Quota anonyme côté client
    if (!isAuthenticated && !checkClientQuota()) {
      setShowSignupCta(true);
      return;
    }

    setInput("");
    setShowPaywall(false);
    setShowSignupCta(false);

    const updatedMessages: Message[] = [...messages, { role: "user" as const, content: text }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Envoyer l'historique conversationnel (max 10 derniers messages)
      const historyForApi = updatedMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          userQuestion: text,
          chatHistory: historyForApi.slice(0, -1), // exclure le dernier (= userQuestion)
        }),
      });

      if (res.status === 429) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Erreur, veuillez réessayer." },
        ]);
        setLoading(false);
        return;
      }

      const json = await res.json();
      const d = json.data as { response?: string; off_topic?: boolean; suggest_page?: string };
      const responseText = d?.response ?? "Je n'ai pas pu traiter votre question.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur réseau, veuillez réessayer." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* ── BOUTON FLOTTANT (visible quand fermé) ── */}
      {!open && (
        <>
          <button
            onClick={() => setOpen(true)}
            className="fixed z-[60] bottom-20 right-4 h-14 w-14 flex items-center justify-center rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:border-white/20 active:scale-95 md:bottom-6"
            style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}
            aria-label="Ouvrir l'assistant IA"
          >
            <Image src="/cap-citoyen.png" alt="Assistant" width={36} height={36} className="rounded-full" />
          </button>
          {messages.length === 0 && isAuthenticated && (
            <div className="fixed z-[59] bottom-[88px] right-3 md:bottom-[52px] pointer-events-none">
              <div className="rounded-xl border px-3 py-1.5 text-xs shadow-lg animate-pulse" style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)", color: "var(--cc-text-muted)" }}>
                Une question ?
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PANEL CHAT (plein écran mobile, flottant desktop) ── */}
      {open && (
        <>
          {/* Overlay opaque — bloque le contenu derrière (mobile uniquement) */}
          <div
            className="fixed inset-0 z-[58] bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed z-[59] inset-x-0 bottom-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[400px] flex flex-col overflow-hidden sm:rounded-2xl sm:border sm:shadow-[0_25px_70px_rgba(0,0,0,0.5)]"
            style={{
              // Mobile: plein écran moins le clavier
              height: keyboardH > 0
                ? `calc(100vh - ${keyboardH}px)`
                : '100dvh',
              // Desktop: hauteur fixe
              ...(typeof window !== 'undefined' && window.innerWidth >= 640
                ? { height: 'min(480px, calc(100vh - 40px))' }
                : {}),
              background: 'var(--cc-surface-alt)',
              borderColor: 'var(--cc-border)',
              transition: 'height 0.15s ease',
            }}
          >
            {/* Header */}
            <div className="flex flex-none items-center gap-2.5 border-b px-4 py-3" style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)" }}>
              <Image src="/cap-citoyen.png" alt="" width={28} height={28} className="rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>Assistant Cap Citoyen</p>
                <p className="text-[10px]" style={{ color: "var(--cc-text-muted)" }}>Démarches, naturalisation, examen civique</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70" style={{ background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages — flex-1, prend tout l'espace entre header et footer */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3 space-y-3 [scrollbar-width:none]"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              {/* Anonyme : le chat nécessite un compte → invitation à s'inscrire */}
              {!isAuthenticated && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--cc-primary-soft)" }}>
                    <Image src="/cap-citoyen.png" alt="" width={36} height={36} className="rounded-full" />
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--cc-text)" }}>
                    Discutez avec l'assistant Cap Citoyen
                  </p>
                  <p className="text-xs leading-relaxed mb-4 max-w-[260px]" style={{ color: "var(--cc-text-muted)" }}>
                    Le chat est disponible une fois votre compte créé. Inscrivez-vous gratuitement pour poser vos questions sur la naturalisation et l'examen civique.
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[240px]">
                    <a
                      href="/register"
                      className="block w-full rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
                      style={{ background: "var(--cc-primary)", color: "#fff" }}
                    >
                      Créer un compte gratuit
                    </a>
                    <a
                      href="/login"
                      className="block w-full rounded-xl border px-4 py-2 text-xs transition hover:opacity-80"
                      style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
                    >
                      J'ai déjà un compte
                    </a>
                  </div>
                </div>
              )}

              {isAuthenticated && messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--cc-text)" }}>
                    Bonjour ! Comment puis-je vous aider ?
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                    Posez-moi vos questions sur les démarches de naturalisation, l'examen civique, ou votre préparation.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {[
                      "Délai après dépôt du dossier ?",
                      "Comment préparer l'entretien ?",
                      "Récépissé de complétude ?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="rounded-lg border px-2.5 py-1.5 text-[11px] transition hover:opacity-80" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div
                      className="max-w-[85%] rounded-2xl rounded-br-md border px-3 py-2"
                      style={{
                        background: "var(--cc-primary-soft)",
                        borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
                      }}
                    >
                      <p className="text-sm" style={{ color: "var(--cc-primary)" }}>{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[92%] rounded-2xl rounded-bl-md border px-3 py-2.5" style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--cc-text)" }}>{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border px-4 py-3" style={{ background: "var(--cc-surface-alt)", borderColor: "var(--cc-border)" }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--cc-primary)", animationDelay: "0ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--cc-primary)", animationDelay: "150ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "var(--cc-primary)", animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs" style={{ color: "var(--cc-text-muted)" }}>Réflexion...</span>
                    </div>
                  </div>
                </div>
              )}

              {showPaywall && (
                <div className="px-1">
                  <AiPaywall mode="assistant" />
                </div>
              )}

              {showSignupCta && (
                <div className="px-1">
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{
                      background: "var(--cc-primary-soft)",
                      borderColor: "color-mix(in srgb, var(--cc-primary) 25%, transparent)",
                    }}
                  >
                    <p className="text-sm font-bold mb-1" style={{ color: "var(--cc-text)" }}>
                      Vous avez utilisé vos 3 questions gratuites
                    </p>
                    <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
                      Créez un compte gratuit pour continuer à poser vos questions et sauvegarder vos conversations.
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href="/register"
                        className="block w-full rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
                        style={{ background: "var(--cc-primary)", color: "#fff" }}
                      >
                        Créer un compte gratuit
                      </a>
                      <a
                        href="/login"
                        className="block w-full rounded-xl border px-4 py-2 text-xs transition hover:opacity-80"
                        style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text-muted)" }}
                      >
                        J'ai déjà un compte
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer input — flex-none, collé au clavier. Masqué pour l'anonyme. */}
            {isAuthenticated && (
            <form
              onSubmit={send}
              className="flex flex-none items-end gap-2 border-t px-3 py-2.5"
              style={{ background: "var(--cc-surface)", borderColor: "var(--cc-border)", paddingBottom: keyboardH > 0 ? '8px' : 'max(10px, env(safe-area-inset-bottom))' }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
                placeholder={isAuthenticated ? "Votre question..." : "Connectez-vous pour poser une question"}
                disabled={!isAuthenticated || loading}
                rows={1}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm placeholder:opacity-40 focus:outline-none disabled:opacity-40 max-h-20"
                style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)", color: "var(--cc-text)", fontSize: '16px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || !isAuthenticated}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:opacity-90 disabled:opacity-30"
                style={{ background: "var(--cc-primary)", color: "#fff" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </form>
            )}
          </div>
        </>
      )}
    </>
  );
}

