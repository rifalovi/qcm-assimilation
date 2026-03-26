import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "./components/AppHeader";
import PostHogProvider from "./components/PostHogProvider";
import { Suspense } from "react";
import { UserProvider } from "./components/UserContext";
import BottomNav from "@/components/BottomNav";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full text-slate-100 antialiased pb-16">
        <UserProvider>
        <Suspense fallback={null}>
        <PostHogProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1 w-full overflow-x-hidden">{children}</main>
            <footer className="mt-10 border-t border-white/10 bg-slate-950/30 px-4 py-6 text-center text-xs text-slate-400 backdrop-blur-sm sm:px-6">
              © {new Date().getFullYear()} Cap Citoyen
              <span className="mx-2">·</span>
              <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition">👑 Tarifs</a>
            </footer>
          </div>
          <BottomNav />
        </PostHogProvider>
        </Suspense>
        </UserProvider>
      </body>
    </html>
  );
}