import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORIAS, cargarCategoria } from '../data/psicotecnicos/index'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'
import { generarPsicotecnicos } from '../services/practica'

export default function Psicotecnicos() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [catId, setCatId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [preguntas, setPreguntas] = useState<PreguntaTest[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function abrir(id: string, label: string) {
    setCatId(id); setTitulo(label); setError(null)
    setPreguntas(await cargarCategoria(id))
  }

  async function generarMas() {
    if (!catId) return
    setCargando(true); setError(null)
    const { preguntas: nuevas, error: err } = await generarPsicotecnicos(catId)
    setCargando(false)
    if (err || !nuevas.length) { setError('No se pudo generar, inténtalo de nuevo.'); return }
    setPreguntas(prev => [...prev, ...nuevas])
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4"
        style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => catId ? setCatId(null) : navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Psicotécnicos</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        {!catId && (
          <>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Aptitudes y razonamiento</div>
            <h1 className="display" style={{ margin: '0 0 18px', fontSize: 30, letterSpacing: '-0.015em' }}>
              Entrena tu <span className="display-italic" style={{ color: 'var(--accent)' }}>mente.</span>
            </h1>
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CATEGORIAS.map((c, i) => (
                <button key={c.id} onClick={() => abrir(c.id, c.titulo)} className="card"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <span className="num-display" style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--ink-soft)', fontSize: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{c.titulo}</span>
                  <span style={{ color: 'var(--mute)', fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}
        {catId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="eyebrow">{titulo}</div>
            <MotorTest preguntas={preguntas} titulo={titulo} />
            <button onClick={generarMas} disabled={cargando} className="btn-editorial btn-sec" style={{ width: '100%' }}>
              {cargando ? 'Generando…' : '+ Generar más preguntas'}
            </button>
            {error && <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>{error}</div>}
          </div>
        )}
      </main>
    </div>
  )
}
