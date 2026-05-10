// SW de limpieza: se desregistra y avisa a los clientes para recargar
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', async () => {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  await self.registration.unregister()
  clients.forEach(c => c.postMessage('sw-unregistered'))
})
