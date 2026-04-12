"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
  const { isAuthenticated, role } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Détermine si le chat doit être masqué
  const hidden =
    HIDDEN_PATHS.some((p) => pathname.startsWith(p)) ||
    !!pathname.match(/^\/communaute\/messages\/.+/);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setShowPaywall(false);
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
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      if (res.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Connectez-vous pour utiliser l'assistant IA.",
          },
        ]);
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
        {
          role: "assistant",
          content: d?.summary ?? "Réponse reçue.",
          data: d,
        },
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
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed z-[60] flex items-center justify-center rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 ${
          open
            ? "bottom-[440px] right-4 h-10 w-10 bg-slate-800 border border-white/10 sm:bottom-[520px]"
            : "bottom-20 right-4 h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 md:bottom-6"
        }`}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant IA"}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-xl">🤖</span>
        )}
      </button>

      {/* Badge notification quand fermé et pas de messages */}
      {!open && messages.length === 0 && isAuthenticated && (
        <div className="fixed z-[59] bottom-[88px] right-3 md:bottom-[52px] pointer-events-none">
          <div className="rounded-xl bg-slate-800 border border-white/10 px-3 py-1.5 text-xs text-slate-300 shadow-lg animate-pulse">
            Une question ?
          </div>
        </div>
      )}

      {/* Panel chat */}
      {open && (
        <div
          className="fixed z-[59] bottom-4 right-4 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.5)] md:bottom-6"
          style={{
            height: "min(420px, calc(100vh - 120px))",
            background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(10,15,30,0.98) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
            <span className="text-lg">🤖</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Assistant Cap Citoyen</p>
              <p className="text-[10px] text-slate-400">Démarches, naturalisation, examen civique</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ height: "calc(100% - 116px)" }}>
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
                    {/* Summary = message principal */}
                    <div className="rounded-2xl rounded-bl-md bg-white/5 border border-white/10 px-3 py-2.5">
                      <p className="text-sm text-slate-200 leading-relaxed text-justify">{msg.content}</p>
                    </div>

                    {/* Détails dépliables */}
                    {msg.data && (msg.data.what_it_means || msg.data.what_to_do || msg.data.watch_out) && (
                      <ChatDetails data={msg.data} />
                    )}

                    {/* Mention obligatoire */}
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

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="border-t border-white/10 px-3 py-2.5 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
              placeholder={isAuthenticated ? "Votre question..." : "Connectez-vous pour poser une question"}
              disabled={!isAuthenticated || loading}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400/30 disabled:opacity-40 max-h-20"
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
      )}
    </>
  );
}

// Sous-composant pour les détails dépliables
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
