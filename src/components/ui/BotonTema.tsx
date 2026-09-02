import { useEffect, useState } from 'react'
import { Icon } from './Icon'

const CLAVE = 'opodam.tema'

function aplicar(noche: boolean) {
  document.documentElement.classList.toggle('dark', noche)
}

/**
 * Conmutador de tema día/noche.
 *
 * El estado inicial replica la misma regla que el script anti-parpadeo de
 * index.html: preferencia guardada si existe y, si no, la del sistema. Antes
 * arrancaba siempre en "día" e ignoraba `prefers-color-scheme`, así que a quien
 * tuviera el sistema en oscuro le aparecía la app en claro en cada visita.
 */
export function BotonTema() {
  const [noche, setNoche] = useState<boolean>(() => {
    try {
      const guardado = localStorage.getItem(CLAVE)
      if (guardado) return guardado === 'noche'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  useEffect(() => {
    aplicar(noche)
    try { localStorage.setItem(CLAVE, noche ? 'noche' : 'dia') } catch { /* ignora */ }
  }, [noche])

  return (
    <button
      type="button"
      onClick={() => setNoche(v => !v)}
      aria-pressed={noche}
      aria-label={noche ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      title={noche ? 'Modo día' : 'Modo noche'}
      className="fab fab--2"
    >
      <Icon nombre={noche ? 'sol' : 'luna'} size={20} />
    </button>
  )
}
