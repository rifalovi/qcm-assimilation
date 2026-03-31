'use client'
import { useEffect } from 'react'

export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Force le main global à ne pas contraindre cette page
    const main = document.querySelector('body > div > div > main') as HTMLElement
    if (main) {
      main.style.flex = 'none'
      main.style.height = '0'
      main.style.overflow = 'visible'
      main.style.minHeight = '0'
      main.style.padding = '0'
    }
    document.body.style.paddingBottom = '0'
    document.body.style.overflow = 'hidden'

    return () => {
      if (main) {
        main.style.flex = ''
        main.style.height = ''
        main.style.overflow = ''
        main.style.minHeight = ''
        main.style.padding = ''
      }
      document.body.style.paddingBottom = ''
      document.body.style.overflow = ''
    }
  }, [])

  return <>{children}</>
}
