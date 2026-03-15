import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "./components/AppHeader";

export const metadata: Metadata = {
  title: "QCM Assimilation FR",
  description: "Plateforme d'entraînement QCM - Assimilation nationalité française",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full text-slate-100 antialiased">
        <div className="min-h-screen flex flex-col">
          <AppHeader />

          <main className="flex-1 w-full">
            {children}
          </main>

          <footer className="mt-10 border-t border-white/10 bg-slate-950/30 px-4 py-6 text-center text-xs text-slate-400 backdrop-blur-sm sm:px-6">
            © {new Date().getFullYear()} Par Carlos Hounsinou — QCM Assimilation FR
          </footer>
        </div>
      </body>
    </html>
  );
}