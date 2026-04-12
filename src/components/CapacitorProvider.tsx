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

    // Configurer le plugin Keyboard — empêche le resize du webview
    // Le clavier ne poussera plus le contenu, on gère manuellement via CSS/JS
    async function setupKeyboard() {
      try {
        const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard')

        // Ne pas resize le body quand le clavier s'ouvre
        await Keyboard.setResizeMode({ mode: KeyboardResize.None })

        // Écouter les événements clavier pour exposer la hauteur via CSS custom property
        Keyboard.addListener('keyboardWillShow', (info) => {
          document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
          document.body.classList.add('keyboard-open')
        })

        Keyboard.addListener('keyboardWillHide', () => {
          document.documentElement.style.setProperty('--keyboard-height', '0px')
          document.body.classList.remove('keyboard-open')
        })
      } catch (e) {
        // Plugin pas disponible (web ou erreur d'import) — ignore
        console.log('[Capacitor] Keyboard plugin not available:', e)
      }
    }

    setupKeyboard()
  }, [])

  return <>{children}</>
}
