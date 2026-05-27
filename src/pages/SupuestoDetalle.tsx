import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as cgpc from '../data/supuestos/cgpc/index'
import * as pl from '../data/supuestos/policia-local/index'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'

const MODULOS: Record<string, { cargarSupuesto: (id: string) => Promise<any> }> = {
  'cgpc': cgpc,
  'policia-local': pl,
}

export default function SupuestoDetalle() {
  const navigate = useNavigate()
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const [supuesto, setSupuesto] = useState<{ titulo: string; caso: string; preguntas: PreguntaTest[] } | null>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    const modulo = MODULOS[slug ?? 'cgpc']
    if (!modulo || !id) { setCargado(true); return }
    modulo.cargarSupuesto(id).then(s => { setSupuesto(s); setCargado(true) })
  }, [slug, id])

  useEffect(() => {
    if (cargado && !supuesto) navigate(`/oposicion/${slug}/supuestos`)
  }, [cargado, supuesto, navigate, slug])

  if (!supuesto) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--mute)' }}>Cargando…</div>

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4"
        style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(`/oposicion/${slug}/supuestos`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Supuesto práctico</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Escenario</div>
          <h1 className="display" style={{ margin: 0, fontSize: 26, lineHeight: 1.12, letterSpacing: '-0.01em' }}>{supuesto.titulo}</h1>
        </div>

        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <p style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontSize: 18, lineHeight: 1.5, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
            {supuesto.caso}
          </p>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Cuestiones · {supuesto.preguntas.length} preguntas</div>
          <MotorTest preguntas={supuesto.preguntas} titulo="Preguntas del supuesto" />
        </div>
      </main>
    </div>
  )
}
