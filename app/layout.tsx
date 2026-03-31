import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "./components/AppHeader";
import PostHogProvider from "./components/PostHogProvider";
import { Suspense } from "react";
import { UserProvider } from "./components/UserContext";
import BottomNav from "@/components/BottomNav"
import CapacitorProvider from "@/components/CapacitorProvider"
import ConditionalFooter from "@/components/ConditionalFooter";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  title: "Cap Citoyen",
  description: "Préparez votre test civique français — QCM, audio, examen blanc",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cap Citoyen",
  },
  icons: {
    icon: "/cap-citoyen.png",
    apple: "/cap-citoyen.png",
  },
  openGraph: {
    title: "Cap Citoyen",
    description: "Préparez votre test civique français — QCM, audio, examen blanc",
    url: "https://cap-citoyen.fr",
    siteName: "Cap Citoyen",
    images: [
      {
        url: "https://cap-citoyen.fr/og-image.png",
        width: 512,
        height: 512,
        alt: "Cap Citoyen",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cap Citoyen",
    description: "Préparez votre test civique français — QCM, audio, examen blanc",
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
        <meta property="og:title" content="Cap Citoyen" />
        <meta property="og:description" content="Préparez votre test civique français — QCM, audio, examen blanc" />
        <meta property="og:image" content="https://cap-citoyen.fr/og-image.png" />
        <meta property="og:url" content="https://cap-citoyen.fr" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Cap Citoyen" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="https://cap-citoyen.fr/og-image.png" />
      </head>
      <link rel="privacy-policy" href="https://cap-citoyen.fr/mentions-legales" />
      <body className="min-h-full text-slate-100 antialiased">
        <UserProvider>
        <CapacitorProvider>
        <Suspense fallback={null}>
        <PostHogProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1 w-full min-w-0 min-h-0">{children}</main>
            <ConditionalFooter />
          </div>
          <BottomNav />
        </PostHogProvider>
        </Suspense>
        </CapacitorProvider>
        </UserProvider>
      </body>
    </html>
  );
}