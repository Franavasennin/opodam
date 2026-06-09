import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPreguntasBiodata } from '../data/psicologico/preguntas-biodata-gc'
import { supabase } from '../services/supabase'
import { obtenerPerfil, guardarPerfil } from '../services/psicologico'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

const NOMBRE_CUERPO: Record<string, string> = {
  'guardia-civil': 'Guardia Civil',
  'cgpc': 'Policía Canaria',
  'policia-local': 'Policía Local',
}

export default function Biodata() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [respuestas, setRespuestas] = useState<Record<string, string | number>>({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preguntas = getPreguntasBiodata(slug ?? 'guardia-civil')
  const SECCIONES = Array.from(new Set(preguntas.map(p => p.seccion)))
  const total = preguntas.length
  const completos = Object.keys(respuestas).length

  function responder(clave: string, valor: string | number) {
    setRespuestas(prev => ({ ...prev, [clave]: valor }))
    setGuardado(false)
  }

  async function guardar() {
    if (!supabase || !slug) return
    setGuardando(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No hay sesión activa.'); setGuardando(false); return }

    const perfilActual = await obtenerPerfil(user.id, slug) ?? {}
    const { error: err } = await guardarPerfil(user.id, slug, {
      ...perfilActual,
      biodata: {
        completado: true,
        respuestas,
        fecha: new Date().toISOString().slice(0, 10),
      },
    })
    setGuardando(false)
    if (err) setError(err)
    else setGuardado(true)
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)}
          style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Biodata — {NOMBRE_CUERPO[slug ?? ''] ?? 'Cuerpo policial'}</span>
        <span className="num-display" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mute)' }}>
          {completos}/{total}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-16" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.5, margin: 0 }}>
          El cuestionario de biodata recoge información objetiva sobre tu trayectoria y contexto personal.
          Tus respuestas alimentan el informe algorítmico de idoneidad — responde con sinceridad.
        </p>

        {SECCIONES.map(sec => (
          <section key={sec}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{sec}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {preguntas.filter(p => p.seccion === sec).map(p => (
                <div key={p.id} className="card"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>{p.pregunta}</p>

                  {p.tipo === 'numero' && (
                    <input type="number" min={p.min} max={p.max}
                      value={respuestas[p.clave] ?? ''}
                      onChange={e => responder(p.clave, Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 14 }}
                    />
                  )}

                  {p.tipo === 'select' && p.opciones && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {p.opciones.map(op => {
                        const sel = respuestas[p.clave] === op
                        return (
                          <button key={op} type="button" onClick={() => responder(p.clave, op)}
                            style={{
                              padding: '9px 14px', borderRadius: 9, fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
                              background: sel ? 'var(--accent)' : 'var(--surface-2)',
                              color: sel ? 'var(--accent-ink)' : 'var(--ink)',
                              border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                              fontWeight: sel ? 600 : 400,
                            }}>{op}</button>
                        )
                      })}
                    </div>
                  )}

                  {p.tipo === 'boolean' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['Sí', 'No'] as const).map(op => {
                        const val = op === 'Sí' ? 1 : 0
                        const sel = respuestas[p.clave] === val
                        return (
                          <button key={op} type="button" onClick={() => responder(p.clave, val)}
                            style={{
                              flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, cursor: 'pointer', fontWeight: sel ? 600 : 400,
                              background: sel ? 'var(--accent)' : 'var(--surface-2)',
                              color: sel ? 'var(--accent-ink)' : 'var(--ink)',
                              border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                            }}>{op}</button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}

        <button onClick={guardar} disabled={guardando || completos === 0}
          style={{
            padding: '14px 0', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            background: guardado ? 'var(--accent)' : 'var(--ink)', color: 'var(--bg)',
            border: 0, opacity: completos === 0 || guardando ? 0.5 : 1,
          }}>
          {guardando ? 'Guardando…' : guardado ? '✓ Guardado' : `Guardar respuestas (${completos}/${total})`}
        </button>

        {guardado && (
          <button onClick={() => navigate(`/oposicion/${slug}/informe-psicologico`)}
            style={{ padding: '12px 0', borderRadius: 14, fontSize: 14, cursor: 'pointer', background: 'none', border: '1px solid var(--border)', color: 'var(--ink-soft)' }}>
            Ver informe de idoneidad →
          </button>
        )}
      </main>
    </div>
  )
}
