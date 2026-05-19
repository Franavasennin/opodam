import { useEffect, useRef, useState } from 'react'

const CLAVE = 'opodam.musica'

export function useMusica() {
  const [activa, setActiva] = useState(() => localStorage.getItem(CLAVE) === 'on')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio('/audio/concentracion.mp3')
      audio.loop = true
      audio.volume = 0.4
      audioRef.current = audio
    }
    const audio = audioRef.current
    if (activa) {
      audio.play().catch(() => { /* autoplay bloqueado hasta interaccion */ })
    } else {
      audio.pause()
    }
  }, [activa])

  function alternar() {
    setActiva(prev => {
      const siguiente = !prev
      localStorage.setItem(CLAVE, siguiente ? 'on' : 'off')
      return siguiente
    })
  }

  return { activa, alternar }
}
