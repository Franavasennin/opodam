import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import type { Tema } from '../../types'

mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor: '#4361ee' } })

interface Props { tema: Tema }

export function EsquemasTab({ tema }: Props) {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    refs.current.forEach(async (el, i) => {
      if (!el) return
      try {
        const { svg } = await mermaid.render(`mermaid-${tema.id}-${i}`, tema.esquemas[i].codigo)
        el.innerHTML = svg
      } catch {
        el.innerHTML = '<p class="text-red-500 text-sm">Error al renderizar esquema</p>'
      }
    })
  }, [tema])

  if (!tema.esquemas.length) {
    return <p className="text-gray-400 text-sm text-center py-8">Sin esquemas para este tema.</p>
  }

  return (
    <div className="space-y-6">
      {tema.esquemas.map((e, i) => (
        <div key={i}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{e.titulo}</h3>
          <div ref={el => { refs.current[i] = el }}
            className="bg-white border border-gray-100 rounded-xl p-3 overflow-x-auto" />
        </div>
      ))}
    </div>
  )
}
