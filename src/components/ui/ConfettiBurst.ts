import confetti from 'canvas-confetti'

/**
 * Disparo de confeti refinado con la paleta de OpoDAM (terracota, oro, papel cálido).
 * Inspirado en la micro-celebración háptica de Linear y Duolingo.
 */
export function dispararConfetiOposicion() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  // Comprobar soporte de Canvas 2D (evita errores en jsdom / entornos de test)
  try {
    const testCanvas = document.createElement('canvas')
    const ctx = testCanvas.getContext && testCanvas.getContext('2d')
    if (!ctx) return
  } catch {
    return
  }

  const count = 70
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#b8492f', '#c4a25a', '#f3e2d9', '#8a3922', '#2c6a43'],
    disableForReducedMotion: true,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    try {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    } catch {
      // Ignorar si el motor de renderizado no está disponible
    }
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}
