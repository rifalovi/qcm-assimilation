'use client'

import { useEffect } from 'react'

export default function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const win = window as Window & { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }
    const isCapacitor = !!win.Capacitor?.isNativePlatform?.()

    if (!isCapacitor) return

    document.body.classList.add('capacitor-native')

    const platform = win.Capacitor?.getPlatform?.()
    if (platform === 'ios') document.body.classList.add('capacitor-ios')
    if (platform === 'android') document.body.classList.add('capacitor-android')

    // Exposer la hauteur du clavier via CSS custom property
    // Le resize mode reste NATIF (par défaut) — les pages normales (login, register)
    // scrollent normalement. Les pages chat/messagerie gèrent le clavier elles-mêmes.
    async function setupKeyboard() {
      try {
        const { Keyboard } = await import('@capacitor/keyboard')

        Keyboard.addListener('keyboardWillShow', (info) => {
          document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
          document.body.classList.add('keyboard-open')
        })

        Keyboard.addListener('keyboardWillHide', () => {
          document.documentElement.style.setProperty('--keyboard-height', '0px')
          document.body.classList.remove('keyboard-open')
        })
      } catch (e) {
        console.log('[Capacitor] Keyboard plugin not available:', e)
      }
    }

    setupKeyboard()
  }, [])

  return <>{children}</>
}
