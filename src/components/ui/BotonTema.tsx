import { useEffect, useState } from 'react'

const CLAVE = 'opodam.tema'

function aplicar(noche: boolean) {
  document.documentElement.classList.toggle('dark', noche)
}

export function BotonTema() {
  const [noche, setNoche] = useState<boolean>(() => {
    try { return localStorage.getItem(CLAVE) === 'noche' } catch { return false }
  })

  useEffect(() => {
    aplicar(noche)
    try { localStorage.setItem(CLAVE, noche ? 'noche' : 'dia') } catch { /* ignora */ }
  }, [noche])

  return (
    <button
      onClick={() => setNoche(v => !v)}
      aria-label={noche ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      title={noche ? 'Modo día' : 'Modo noche'}
      className="fixed bottom-40 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
      style={{
        background: 'var(--surface)',
        color: 'var(--ink)',
        border: '1px solid var(--border)',
      }}
    >
      {noche ? '☀️' : '🌙'}
    </button>
  )
}
