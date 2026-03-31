'use client'
import { useEffect } from 'react'

export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Neutralise le pb-16 du body global sur cette page
    document.body.style.paddingBottom = '0'
    return () => {
      document.body.style.paddingBottom = ''
    }
  }, [])

  return <>{children}</>
}
