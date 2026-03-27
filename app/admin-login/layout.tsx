// Ce layout override le layout parent /admin pour la page login
// Il affiche juste les enfants sans sidebar ni vérification de rôle
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
