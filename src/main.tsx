import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App'
import { initPWA } from './pwa'
import './index.css'

// ── Sentry — monitorización de errores en producción ──────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
  })
}

// Registra el service worker vía vite-plugin-pwa (auto-update + aviso de nueva versión).
initPWA()

function ErrorFallback({ error }: { error: unknown }) {
  const mensaje = error instanceof Error ? error.message : String(error)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <span style={{ fontSize: 40 }}>⚠️</span>
      <p style={{ fontWeight: 600, fontSize: 16 }}>Algo ha ido mal</p>
      <p style={{ color: '#666', fontSize: 13 }}>{mensaje}</p>
      <button onClick={() => window.location.reload()}
        style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, border: 0, background: '#1C1410', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
        Recargar
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
