'use client'

import { useEffect } from 'react'

export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Détecte si on est dans une app Capacitor
    const isCapacitor = !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
    
    if (isCapacitor) {
      document.body.classList.add('capacitor-native')
      
      // Détecte iOS vs Android
      const platform = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.()
      if (platform === 'ios') document.body.classList.add('capacitor-ios')
      if (platform === 'android') document.body.classList.add('capacitor-android')
    }
  }, [])

  return <>{children}</>
}
