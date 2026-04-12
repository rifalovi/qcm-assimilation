// Utilitaire client pour gérer l'inscription aux notifications push

export async function registerPushSubscription(): Promise<PushSubscription | null> {
  // Vérifier le support
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Non supporté par ce navigateur')
    return null
  }

  // Demander la permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log('[Push] Permission refusée')
    return null
  }

  // Enregistrer le service worker
  const registration = await navigator.serviceWorker.register('/sw-push.js')
  await navigator.serviceWorker.ready

  // Récupérer ou créer l'abonnement push
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY manquante')
      return null
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })
  }

  return subscription
}

export async function savePushSubscription(subscription: PushSubscription): Promise<boolean> {
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      }),
    })
    return res.ok
  } catch (e) {
    console.error('[Push] Erreur sauvegarde:', e)
    return false
  }
}

export async function unregisterPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/sw-push.js')
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
    // Supprimer côté serveur
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
