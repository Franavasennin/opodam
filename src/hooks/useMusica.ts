import { useEffect, useRef, useState } from 'react'

const CLAVE = 'opodam.musica'

interface AudioState {
  ctx: AudioContext
  noise: AudioBufferSourceNode | null
  timer: ReturnType<typeof setInterval> | null
}

// Escala pentatónica mayor de C (suave, sin disonancias): C4 D4 E4 G4 A4 C5 D5 E5
const NOTAS = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]

// Música de concentración generativa: notas tipo campana en escala pentatónica
// (siempre consonante) + un colchón de aire muy suave. Sin drones graves de "motor".
function crearAmbient(): AudioState | null {
  try {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const AC: typeof AudioContext | undefined = w.AudioContext || w.webkitAudioContext
    if (!AC) return null
    const ctx = new AC()

    const master = ctx.createGain()
    master.gain.value = 0.0001
    master.connect(ctx.destination)
    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 3)

    // Reverb sencillo (delay con realimentación) para dar sensación de espacio
    const delay = ctx.createDelay(1.0)
    delay.delayTime.value = 0.33
    const feedback = ctx.createGain()
    feedback.gain.value = 0.35
    const wet = ctx.createGain()
    wet.gain.value = 0.45
    delay.connect(feedback).connect(delay)
    delay.connect(wet).connect(master)

    // Colchón de aire: ruido rosa muy filtrado y a volumen bajísimo
    const bufSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.04
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1200
    noise.connect(lp).connect(noiseGain).connect(master)
    noise.start()

    // Toca una nota tipo campana con envolvente suave (ataque lento, cola larga)
    function tocarNota(freq: number, dur: number) {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.6)
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      osc.connect(g)
      g.connect(master)
      g.connect(delay)
      osc.start(now)
      osc.stop(now + dur + 0.1)
    }

    // Patrón generativo: cada ~2.8 s una nota aleatoria de la pentatónica;
    // de vez en cuando una nota de apoyo grave, creando una melodía calmada.
    let idx = 0
    const timer = setInterval(() => {
      tocarNota(NOTAS[Math.floor(Math.random() * NOTAS.length)], 3.5 + Math.random() * 1.5)
      if (idx % 3 === 0) tocarNota(NOTAS[Math.floor(Math.random() * 3)] / 2, 4)
      idx++
    }, 2800)

    tocarNota(NOTAS[0], 4)

    return { ctx, noise, timer }
  } catch {
    return null
  }
}

function detener(state: AudioState | null) {
  if (!state) return
  try { if (state.timer) clearInterval(state.timer) } catch { /* noop */ }
  try { state.noise?.stop() } catch { /* noop */ }
  try { state.ctx.close() } catch { /* noop */ }
}

export function useMusica() {
  const [activa, setActiva] = useState(() => localStorage.getItem(CLAVE) === 'on')
  const stateRef = useRef<AudioState | null>(null)

  useEffect(() => {
    if (activa) {
      if (!stateRef.current) stateRef.current = crearAmbient()
      else if (stateRef.current.ctx.state === 'suspended') stateRef.current.ctx.resume().catch(() => {})
    } else {
      detener(stateRef.current)
      stateRef.current = null
    }
  }, [activa])

  useEffect(() => () => {
    detener(stateRef.current)
    stateRef.current = null
  }, [])

  function alternar() {
    setActiva(prev => {
      const siguiente = !prev
      localStorage.setItem(CLAVE, siguiente ? 'on' : 'off')
      return siguiente
    })
  }

  return { activa, alternar }
}
