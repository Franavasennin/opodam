import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// React Router v7 library mode (BrowserRouter + Routes) — intentional choice for this SPA
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/opodam/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
