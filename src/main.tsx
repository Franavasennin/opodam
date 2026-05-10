import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Forzar eliminación del service worker viejo para que el nuevo código cargue
// inmediatamente. Se ejecuta una sola vez (controlado por localStorage).
const SW_BUST_KEY = 'sw-bust-v3'
if (typeof window !== 'undefined' && !localStorage.getItem(SW_BUST_KEY)) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        Promise.all(registrations.map(r => r.unregister())).then(() => {
          localStorage.setItem(SW_BUST_KEY, '1')
          window.location.reload()
        })
      } else {
        localStorage.setItem(SW_BUST_KEY, '1')
      }
    })
  } else {
    localStorage.setItem(SW_BUST_KEY, '1')
  }
}

// React Router v7 library mode (BrowserRouter + Routes) — intentional choice for this SPA
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
