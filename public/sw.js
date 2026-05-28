// Service worker de OpoDAM: app shell + caché para estudiar sin conexión.
const CACHE = 'opodam-v2'
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL).catch(() => {})))
})

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return            // BOE/Supabase/Groq: no cachear
  if (url.pathname.startsWith('/.netlify/')) return      // funciones: siempre red

  // Navegaciones SPA: red primero, con index.html como respaldo offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')))
    return
  }

  // Resto (JS, CSS, JSON de temas, índice de búsqueda…): stale-while-revalidate
  e.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(req)
    const red = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone())
      return res
    }).catch(() => cached)
    return cached || red
  })())
})
