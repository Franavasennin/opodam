import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { obtenerTopics } from '../data/topics'
import { Pomodoro } from '../components/ui/Pomodoro'
import { TeoriaTab } from '../components/tema/TeoriaTab'
import { EsquemasTab } from '../components/tema/EsquemasTab'
import { MapaMentalTab } from '../components/tema/MapaMentalTab'
import { emparejarSeccion } from '../components/tema/emparejarSeccion'
import { FlashcardsTab } from '../components/tema/FlashcardsTab'
import { VideosTab } from '../components/tema/VideosTab'
import { BotonTutor } from '../components/tutor/BotonTutor'
import { TutorPanel } from '../components/tutor/TutorPanel'
import type { Tema } from '../types'

const TABS_BASE = ["Teoria", "Esquemas", "Mapa Mental", "Flashcards"] as const
type Tab = typeof TABS_BASE[number] | "Vídeos"

export function TemaDetalle() {
  const { id, slug } = useParams<{ id: string; slug: string }>()
  const temaId = Number(id)
  const navigate = useNavigate()
  const [tema, setTema] = useState<Tema | null>(null)
  const [tab, setTab] = useState<Tab>("Teoria")
  const [tutorAbierto, setTutorAbierto] = useState(false)
  // Sección de teoría a la que saltar tras pulsar un nodo del mapa mental.
  // Es un objeto (no un número) para re-disparar el scroll aunque se repita índice.
  const [seccionObjetivo, setSeccionObjetivo] = useState<{ i: number } | null>(null)
  const [pomodoroAbierto, setPomodoroAbierto] = useState(false)
  const { progreso, marcarTeoriaLeida, marcarVueltaCompleta, registrarTiempo } = useProgress()
  const { cargarTema } = obtenerTopics(slug ?? 'cgpc')

  useEffect(() => {
    cargarTema(temaId).then(setTema).catch(() => navigate(`/oposicion/${slug}/temario`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temaId, navigate])

  // P2.4: cronómetro de fondo. Suma segundos solo con la pestaña visible y
  // descarta el tiempo (vuelca en localStorage) cada 30s y al desmontar.
  const segsRef = useRef(0)
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') segsRef.current += 1
      if (segsRef.current >= 30) { registrarTiempo(temaId, segsRef.current); segsRef.current = 0 }
    }, 1000)
    return () => {
      clearInterval(tick)
      if (segsRef.current > 0) { registrarTiempo(temaId, segsRef.current); segsRef.current = 0 }
    }
  }, [temaId, registrarTiempo])

  const handleTeoriaLeida = useCallback(() => marcarTeoriaLeida(temaId), [temaId, marcarTeoriaLeida])

  if (!tema) return <div className="flex items-center justify-center h-64" style={{ color: 'var(--mute)' }}>Cargando…</div>

  const vueltas = progreso.temas[String(temaId)]?.vueltas ?? 0

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 px-4 pt-3 pb-2" style={{ background: 'color-mix(in srgb, var(--bg) 90%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(`/oposicion/${slug}/temario`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              ← <span style={{ fontWeight: 500 }}>Temario</span>
            </button>
            <div className="flex items-center gap-2">
              {vueltas > 0 && <span className="pill">🔄 ×{vueltas}</span>}
              <button
                onClick={() => setPomodoroAbierto(v => !v)}
                aria-label="Temporizador Pomodoro"
                title="Pomodoro 25/5"
                style={{
                  background: pomodoroAbierto ? 'var(--accent)' : 'none', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '4px 9px', cursor: 'pointer', fontSize: 14,
                  color: pomodoroAbierto ? 'var(--surface)' : 'var(--ink)',
                }}
              >🍅</button>
            </div>
          </div>
          <div className="eyebrow" style={{ marginTop: 8 }}>Tema {temaId}</div>
          <h1 className="display" style={{ margin: '2px 0 0', fontSize: 21, lineHeight: 1.12, letterSpacing: '-0.01em' }}>{tema.titulo}</h1>
        </div>
      </header>

      <div className="px-4 shrink-0" style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto flex overflow-x-auto" style={{ gap: 4 }}>
          {(tema.videos?.length ? [...TABS_BASE, "Vídeos" as const] : TABS_BASE).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '11px 10px', fontSize: 13, fontWeight: 600, flexShrink: 0, background: 'none', border: 0,
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                color: tab === t ? 'var(--accent)' : 'var(--mute)', cursor: 'pointer', letterSpacing: '-0.005em',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {tab === "Teoria"      && <TeoriaTab tema={tema} onTeoriaLeida={handleTeoriaLeida} irASeccion={seccionObjetivo} />}
        {tab === "Esquemas"    && <EsquemasTab tema={tema} />}
        {tab === "Mapa Mental" && (
          <MapaMentalTab
            tema={tema}
            onSeleccion={(label) => {
              setSeccionObjetivo({ i: emparejarSeccion(label, tema.secciones) })
              setTab("Teoria")
            }}
          />
        )}
        {tab === "Flashcards"  && <FlashcardsTab tema={tema} onVueltaCompleta={() => marcarVueltaCompleta(temaId)} />}
        {tab === "Vídeos"      && <VideosTab tema={tema} />}
      </div>

      {pomodoroAbierto && <Pomodoro onCerrar={() => setPomodoroAbierto(false)} />}

      <BotonTutor onClick={() => setTutorAbierto(true)} />
      <TutorPanel
        oposicion={slug ?? 'cgpc'}
        tema={tema}
        abierto={tutorAbierto}
        onCerrar={() => setTutorAbierto(false)}
      />
    </div>
  )
}
