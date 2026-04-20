import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { cargarTema } from '../data/topics'
import { TeoriaTab } from '../components/tema/TeoriaTab'
import { EsquemasTab } from '../components/tema/EsquemasTab'
import { MapaMentalTab } from '../components/tema/MapaMentalTab'
import { FlashcardsTab } from '../components/tema/FlashcardsTab'
import type { Tema } from '../types'

const TABS = ["Teoria", "Esquemas", "Mapa Mental", "Flashcards"] as const
type Tab = typeof TABS[number]

export function TemaDetalle() {
  const { id } = useParams<{ id: string }>()
  const temaId = Number(id)
  const navigate = useNavigate()
  const [tema, setTema] = useState<Tema | null>(null)
  const [tab, setTab] = useState<Tab>("Teoria")
  const { progreso, marcarTeoriaLeida, marcarVueltaCompleta } = useProgress()

  useEffect(() => {
    cargarTema(temaId).then(setTema).catch(() => navigate("/temario"))
  }, [temaId, navigate])

  const handleTeoriaLeida = useCallback(() => marcarTeoriaLeida(temaId), [temaId, marcarTeoriaLeida])

  if (!tema) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>

  const vueltas = progreso.temas[String(temaId)]?.vueltas ?? 0

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <button onClick={() => navigate("/temario")} className="text-brand-600 text-sm mb-1">← Temario</button>
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900 leading-tight">{tema.titulo}</h1>
          <span className="text-sm text-gray-400 ml-2">🔄 ×{vueltas}</span>
        </div>
      </header>

      <div className="flex overflow-x-auto border-b border-gray-100 bg-white px-4 shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "Teoria"      && <TeoriaTab tema={tema} onTeoriaLeida={handleTeoriaLeida} />}
        {tab === "Esquemas"    && <EsquemasTab tema={tema} />}
        {tab === "Mapa Mental" && <MapaMentalTab tema={tema} />}
        {tab === "Flashcards"  && <FlashcardsTab tema={tema} onVueltaCompleta={() => marcarVueltaCompleta(temaId)} />}
      </div>
    </div>
  )
}
