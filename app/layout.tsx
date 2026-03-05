import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "./components/AppHeader";

export const metadata: Metadata = {
  title: "QCM Assimilation FR",
  description: "Plateforme d'entraînement QCM - Assimilation nationalité française",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
        </div>

        <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 py-6">
          © {new Date().getFullYear()} Par Carlos Hounsinou — QCM Assimilation FR
        </footer>
      </body>
    </html>
  );
}
