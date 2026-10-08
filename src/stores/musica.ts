import { create } from 'zustand'

const CLAVE = 'opodam.musica'

function leer(): boolean {
  try { return localStorage.getItem(CLAVE) === 'on' } catch { return false }
}

interface MusicaState {
  activa: boolean
  alternar: () => void
}

/**
 * Estado de la música de concentración. Vive en un store (y no en el hook del
 * audio) para que el interruptor pueda estar en la hoja "Más" del móvil
 * mientras el audio lo sigue gestionando un único `useMusica()` montado en App.
 */
export const useMusicaStore = create<MusicaState>(set => ({
  activa: leer(),
  alternar: () => set(s => {
    const activa = !s.activa
    try { localStorage.setItem(CLAVE, activa ? 'on' : 'off') } catch { /* ignora */ }
    return { activa }
  }),
}))
