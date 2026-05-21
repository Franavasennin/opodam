import { useEffect, useRef, useState } from 'react'

const CLAVE = 'opodam.musica'

interface AudioState {
  ctx: AudioContext
  oscillators: OscillatorNode[]
  noise: AudioBufferSourceNode | null
}

function crearAmbient(): AudioState | null {
  try {
    const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    const ctx = new AC()
    const master = ctx.createGain()
    master.gain.value = 0.12
    master.connect(ctx.destination)

    // Tríada mayor grave (C3, E3, G3) como drone
    const freqs = [130.81, 164.81, 196.00]
    const oscillators: OscillatorNode[] = freqs.map(f => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = 0.18
      osc.connect(g).connect(master)
      return osc
    })

    // Ruido rosa con filtro paso bajo
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
    noiseGain.gain.value = 0.35
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 800
    noise.connect(lp).connect(noiseGain).connect(master)

    oscillators.forEach(o => o.start())
    noise.start()
    return { ctx, oscillators, noise }
  } catch {
    return null
  }
}

function detener(state: AudioState | null) {
  if (!state) return
  try { state.oscillators.forEach(o => { try { o.stop() } catch {} }) } catch {}
  try { state.noise?.stop() } catch {}
  try { state.ctx.close() } catch {}
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
