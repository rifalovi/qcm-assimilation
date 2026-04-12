"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useUser } from "./UserContext";
import AiPaywall from "./AiPaywall";

type Message = {
  role: "user" | "assistant";
  content: string;
  data?: {
    summary?: string;
    what_it_means?: string;
    what_to_do?: string;
    watch_out?: string;
    official_links?: string[];
  };
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
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "assistant",
          category: "Question libre",
          userQuestion: text,
        }),
      });

      if (res.status === 429) {
        const body = await res.json();
        // Freemium → CTA premium
        if (body.role === 'freemium') {
          setShowPaywall(true);
        } else {
          setShowPaywall(true);
        }
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
      const d = json.data as Message["data"];
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: d?.summary ?? "Réponse reçue.", data: d },
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
            className="fixed z-[60] bottom-20 right-4 h-14 w-14 flex items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:border-white/20 active:scale-95 md:bottom-6"
            aria-label="Ouvrir l'assistant IA"
          >
            <Image src="/cap-citoyen.png" alt="Assistant" width={36} height={36} className="rounded-full" />
          </button>
          {messages.length === 0 && isAuthenticated && (
            <div className="fixed z-[59] bottom-[88px] right-3 md:bottom-[52px] pointer-events-none">
              <div className="rounded-xl bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-slate-300 shadow-lg animate-pulse">
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
            className="fixed inset-0 z-[58] bg-[#0b141a] sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed z-[59] inset-x-0 bottom-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[400px] flex flex-col overflow-hidden sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-[0_25px_70px_rgba(0,0,0,0.5)]"
            style={{
              // Mobile: plein écran moins le clavier
              height: keyboardH > 0
                ? `calc(100vh - ${keyboardH}px)`
                : '100dvh',
              // Desktop: hauteur fixe
              ...(typeof window !== 'undefined' && window.innerWidth >= 640
                ? { height: 'min(480px, calc(100vh - 40px))' }
                : {}),
              background: '#0b141a',
              transition: 'height 0.15s ease',
            }}
          >
            {/* Header */}
            <div className="flex flex-none items-center gap-2.5 border-b border-white/10 bg-[#0f172a] px-4 py-3">
              <Image src="/cap-citoyen.png" alt="" width={28} height={28} className="rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Assistant Cap Citoyen</p>
                <p className="text-[10px] text-slate-400">Démarches, naturalisation, examen civique</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
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
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <span className="text-3xl mb-3">🇫🇷</span>
                  <p className="text-sm font-semibold text-white mb-1">
                    Bonjour ! Comment puis-je vous aider ?
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
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
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600/20 border border-blue-400/20 px-3 py-2">
                      <p className="text-sm text-blue-100">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[92%] space-y-2">
                      <div className="rounded-2xl rounded-bl-md bg-white/5 border border-white/10 px-3 py-2.5">
                        <p className="text-sm text-slate-200 leading-relaxed text-justify">{msg.content}</p>
                      </div>
                      {msg.data && (msg.data.what_it_means || msg.data.what_to_do || msg.data.watch_out) && (
                        <ChatDetails data={msg.data} />
                      )}
                      <p className="text-[10px] text-slate-500 px-1">
                        Indicatif — vérifiez sur{" "}
                        <a href="https://www.service-public.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-300 underline">
                          service-public.fr
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white/5 border border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-slate-400">Réflexion...</span>
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
                  <div className="rounded-2xl border border-blue-400/20 bg-gradient-to-b from-blue-500/10 to-blue-900/10 p-4 text-center">
                    <p className="text-sm font-bold text-white mb-1">
                      Vous avez utilisé vos 3 questions gratuites
                    </p>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Créez un compte gratuit pour continuer à poser vos questions et sauvegarder vos conversations.
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href="/register"
                        className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                      >
                        Créer un compte gratuit
                      </a>
                      <a
                        href="/login"
                        className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400 transition hover:text-white"
                      >
                        J'ai déjà un compte
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer input — flex-none, collé au clavier */}
            <form
              onSubmit={send}
              className="flex flex-none items-end gap-2 border-t border-white/10 bg-[#0f172a] px-3 py-2.5"
              style={{
                paddingBottom: keyboardH > 0 ? '8px' : 'max(10px, env(safe-area-inset-bottom))',
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
                placeholder={isAuthenticated ? "Votre question..." : "Connectez-vous pour poser une question"}
                disabled={!isAuthenticated || loading}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400/30 disabled:opacity-40 max-h-20"
                style={{ fontSize: '16px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || !isAuthenticated}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

function ChatDetails({ data }: { data: NonNullable<Message["data"]> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-white/5"
      >
        <span className="text-[11px] font-semibold text-slate-400">Voir les détails</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-slate-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-3 py-2.5 space-y-2.5">
          {data.what_it_means && (
            <div>
              <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-0.5">Ce que ça signifie</p>
              <p className="text-xs text-slate-300 leading-relaxed text-justify">{data.what_it_means}</p>
            </div>
          )}
          {data.what_to_do && (
            <div>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-0.5">Ce qu'il faut faire</p>
              <p className="text-xs text-slate-300 leading-relaxed text-justify">{data.what_to_do}</p>
            </div>
          )}
          {data.watch_out && (
            <div>
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-0.5">Vigilance</p>
              <p className="text-xs text-amber-200/80 leading-relaxed text-justify">{data.watch_out}</p>
            </div>
          )}
          {data.official_links && data.official_links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.official_links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-blue-300 hover:text-blue-200 underline truncate max-w-full">
                  {link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
