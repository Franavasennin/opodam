import { useEffect } from 'react'
import type { Tema } from '../../types'

interface Props { tema: Tema; onTeoriaLeida: () => void }

export function TeoriaTab({ tema, onTeoriaLeida }: Props) {
  useEffect(() => {
    const t = setTimeout(onTeoriaLeida, 5000)
    return () => clearTimeout(t)
  }, [onTeoriaLeida])

  return (
    <div className="space-y-6">
      {tema.secciones.map((s, i) => (
        <section key={i}>
          <h3 className="text-base font-bold text-gray-800 mb-2 border-l-4 border-brand-500 pl-3">{s.titulo}</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{s.contenido}</p>
        </section>
      ))}
      <button onClick={onTeoriaLeida}
        className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
        ✅ Marcar teoría como leída
      </button>
    </div>
  )
}
