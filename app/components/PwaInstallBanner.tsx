"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Ne pas afficher dans Capacitor natif
    if ((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) return;

    // Ne pas afficher si déjà en mode standalone (déjà installée)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Vérifier le dismiss (7 jours)
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Capturer le beforeinstallprompt
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Afficher après 30s ou au 2ème visite
    const visitCount = parseInt(localStorage.getItem("pwa_visit_count") ?? "0", 10) + 1;
    localStorage.setItem("pwa_visit_count", String(visitCount));

    if (visitCount >= 2) {
      // 2ème visite → afficher après 3s
      const timer = setTimeout(() => setShow(true), 3000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", onBeforeInstall); };
    } else {
      // 1ère visite → afficher après 30s
      const timer = setTimeout(() => setShow(true), 30000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", onBeforeInstall); };
    }
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("pwa_banner_dismissed", String(Date.now()));
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        dismiss();
      }
      setDeferredPrompt(null);
    } else {
      // Fallback : sur iOS/Safari, pas de beforeinstallprompt
      // On montre juste les instructions
      dismiss();
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-16 left-3 right-3 z-[70] md:bottom-4 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border border-blue-400/20 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl" style={{ background: "var(--cc-surface-alt)" }}>
        <div className="flex items-start gap-3">
          <Image
            src="/cap-citoyen.png"
            alt="Cap Citoyen"
            width={44}
            height={44}
            className="rounded-xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>Installer Cap Citoyen</p>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--cc-text-muted)" }}>
              Accédez à la plateforme directement depuis votre écran d'accueil
            </p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg hover:text-white hover:bg-white/10 transition" style={{ color: "var(--cc-text-disabled)" }}
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          onClick={install}
          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.98]"
        >
          Installer l'application
        </button>
      </div>
    </div>
  );
}
