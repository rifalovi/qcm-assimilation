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
      <body className="bg-gradient-to-br from-slate-100 via-white to-blue-50 text-slate-900">
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
        </div>

        <footer className="mt-12 text-center text-xs text-slate-500 py-6">
          © {new Date().getFullYear()} Par Carlos Hounsinou — QCM Assimilation FR
        </footer>
      </body>
    </html>
  );
}