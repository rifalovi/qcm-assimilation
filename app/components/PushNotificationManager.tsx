"use client";

import { useEffect, useRef } from "react";
import { useUser } from "./UserContext";

export default function PushNotificationManager() {
  const { isAuthenticated, role } = useUser();
  const registered = useRef(false);

  useEffect(() => {
    // Seulement pour les utilisateurs premium+ authentifiés
    if (!isAuthenticated || registered.current) return;
    if (!['premium', 'elite', 'moderator', 'admin', 'super_admin'].includes(role)) return;

    // Vérifier le support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!('Notification' in window)) return;

    // Ne pas demander la permission immédiatement — attendre que l'utilisateur
    // ait visité la messagerie au moins une fois
    const hasVisitedMessages = localStorage.getItem('push_asked') === '1';
    if (!hasVisitedMessages) return;

    async function register() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          // Convertir la clé VAPID
          const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
          const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: outputArray,
          });
        }

        // Envoyer au serveur
        const keys = subscription.toJSON().keys;
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: keys?.p256dh ?? '',
              auth: keys?.auth ?? '',
            },
          }),
        });

        registered.current = true;
      } catch (e) {
        console.error('[Push] Registration error:', e);
      }
    }

    register();
  }, [isAuthenticated, role]);

  return null;
}
