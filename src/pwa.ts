// src/pwa.ts
// Registro del Service Worker vía vite-plugin-pwa con auto-actualización.
// Sustituye al registro manual de `/sw.js`, que se saltaba la lógica de update
// del plugin (causa de tener que hacer Ctrl+Shift+R tras cada deploy).
import { registerSW } from 'virtual:pwa-register'

function avisoActualizando(): HTMLElement {
  const el = document.createElement('div')
  el.textContent = 'Nueva versión disponible · actualizando…'
  el.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
    'background:var(--ink,#1C1410)', 'color:var(--bg,#fff)', 'padding:10px 18px',
    'border-radius:12px', 'font-size:13.5px', 'font-weight:600', 'z-index:99999',
    'box-shadow:0 8px 24px rgba(0,0,0,0.25)', 'max-width:90vw', 'text-align:center',
  ].join(';')
  document.body.appendChild(el)
  return el
}

export function initPWA(): void {
  if (!('serviceWorker' in navigator)) return

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Hay una versión nueva esperando: avisamos y recargamos con ella.
      avisoActualizando()
      setTimeout(() => updateSW(true), 1200)
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Buscar actualizaciones periódicamente y al volver a la pestaña,
      // para que las pestañas/PWA abiertas detecten nuevos deploys sin recargar a mano.
      const comprobar = () => registration.update().catch(() => { /* sin conexión, ignorar */ })
      setInterval(comprobar, 30 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') comprobar()
      })
    },
  })
}
