// Service worker de limpieza — se autodestruye inmediatamente
// Reemplaza el SW viejo y fuerza recarga con codigo fresco
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.unregister().then(() =>
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.navigate(c.url))
      })
    )
  )
})
