import type { Tema } from '../../types'
import { getMermaidCode } from '../../types'

interface Props { tema: Tema }

// Extrae las etiquetas de los nodos de un código mermaid `graph TD A["..."] --> N1["..."]`.
// Devuelve { raiz, ramas[] }. Soporta comillas o corchetes simples.
function parsearNodos(codigo: string): { raiz: string; ramas: string[] } {
  const labels: string[] = []
  const re = /\[\s*"?([^"\]]+?)"?\s*\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(codigo)) !== null) {
    const txt = m[1].trim()
    if (txt) labels.push(txt)
  }
  const vistos = new Set<string>()
  const unicos = labels.filter(l => (vistos.has(l) ? false : (vistos.add(l), true)))
  return { raiz: unicos[0] ?? '', ramas: unicos.slice(1) }
}

export function EsquemasTab({ tema }: Props) {
  if (!tema.esquemas.length) {
    return <p style={{ color: 'var(--mute)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Sin esquemas para este tema.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {tema.esquemas.map((e, i) => {
        const { raiz, ramas } = parsearNodos(getMermaidCode(e))
        return (
          <div key={i}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{e.titulo}</div>
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              {raiz && (
                <div style={{
                  display: 'inline-block', background: 'var(--ink)', color: 'var(--bg)',
                  borderRadius: 10, padding: '8px 14px', fontFamily: "'Instrument Serif', serif",
                  fontSize: 18, lineHeight: 1.15, marginBottom: ramas.length ? 14 : 0,
                }}>{raiz}</div>
              )}
              {ramas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', paddingLeft: 16, borderLeft: '2px solid var(--border)', marginLeft: 6 }}>
                  {ramas.map((r, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 12, height: 2, background: 'var(--border)', flexShrink: 0, marginLeft: -16 }} />
                      <span style={{
                        background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 8,
                        padding: '6px 12px', fontSize: 13, fontWeight: 500,
                      }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              {!raiz && <p style={{ color: 'var(--mute)', fontSize: 13, margin: 0 }}>Sin contenido</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
