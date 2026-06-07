import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "./components/AppHeader";
import PostHogProvider from "./components/PostHogProvider";
import { Suspense } from "react";
import { UserProvider } from "./components/UserContext";
import BottomNav from "@/components/BottomNav"
import FloatingChat from "./components/FloatingChat"
import PushNotificationManager from "./components/PushNotificationManager"
import PwaInstallBanner from "./components/PwaInstallBanner"
import ConditionalFooter from "@/components/ConditionalFooter";
import ConditionalShell from "@/components/ConditionalShell";
import CapacitorProvider from "@/components/CapacitorProvider"

export const viewport = {
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  title: "Cap Citoyen — Examen civique & naturalisation 2026",
  description: "Réussissez l'examen civique et votre parcours de naturalisation. Programme 2026 conforme à la réforme du 1er janvier 2026 — 800+ questions, audio, examen blanc.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cap Citoyen",
  },
  icons: {
    icon: "/cap-citoyen.png",
    apple: "/cap-citoyen.png",
  },
  openGraph: {
    title: "Cap Citoyen — Examen civique & naturalisation 2026",
    description: "Réussissez l'examen civique et votre parcours de naturalisation. Programme 2026 conforme à la réforme du 1er janvier 2026 — 800+ questions, audio, examen blanc.",
    url: "https://cap-citoyen.fr",
    siteName: "Cap Citoyen",
    images: [
      {
        url: "https://cap-citoyen.fr/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cap Citoyen — Examen civique & naturalisation 2026",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cap Citoyen — Examen civique & naturalisation 2026",
    description: "Réussissez l'examen civique et votre parcours de naturalisation. Programme 2026 conforme à la réforme du 1er janvier 2026 — 800+ questions, audio, examen blanc.",
    images: ["https://cap-citoyen.fr/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Initialisation du thème avant rendu — évite le flash (FOUC) */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=new URLSearchParams(window.location.search).get('mode');if(p==='dark'){document.documentElement.setAttribute('data-theme','dark');return;}if(p==='light'){document.documentElement.removeAttribute('data-theme');return;}var t=localStorage.getItem('cc-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();` }} />
      </head>
      <link rel="privacy-policy" href="https://cap-citoyen.fr/mentions-legales" />
      <body className="min-h-full antialiased">
        <UserProvider>
        <CapacitorProvider>
        <Suspense fallback={null}>
        <PostHogProvider>
          <ConditionalShell>
            {children}
          </ConditionalShell>
          <BottomNav />
          <FloatingChat />
          <PushNotificationManager />
          <PwaInstallBanner />
        </PostHogProvider>
        </Suspense>
        </CapacitorProvider>
        </UserProvider>
      </body>
    </html>
  );
}
