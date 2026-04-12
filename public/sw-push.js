// Service Worker pour les notifications push
// Ce fichier est servi statiquement depuis /public

self.addEventListener('push', function (event) {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Cap Citoyen', body: event.data.text() }
  }

  const title = data.title || 'Cap Citoyen'
  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/cap-citoyen.png',
    badge: '/cap-citoyen.png',
    tag: data.tag || 'default',
    data: {
      url: data.url || '/communaute/messages',
    },
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/communaute/messages'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Si un onglet est déjà ouvert, le focus
      for (const client of clientList) {
        if (client.url.includes('cap-citoyen.fr') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Sinon, ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
