'use client'
import { usePathname } from 'next/navigation'
import AppHeader from '../../app/components/AppHeader'
import ConditionalFooter from './ConditionalFooter'

const FULLSCREEN_ROUTES = [
  /^\/communaute\/messages\/.+/,
]

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullscreen = FULLSCREEN_ROUTES.some(r => r.test(pathname))

  if (isFullscreen) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <ConditionalFooter />
    </div>
  )
}
