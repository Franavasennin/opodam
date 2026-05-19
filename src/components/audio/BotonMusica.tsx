import { useMusica } from '../../hooks/useMusica'

export function BotonMusica() {
  const { activa, alternar } = useMusica()
  return (
    <button
      onClick={alternar}
      aria-label={activa ? 'Desactivar musica' : 'Activar musica de concentracion'}
      title={activa ? 'Desactivar musica' : 'Activar musica de concentracion'}
      className={`fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-colors ${
        activa ? 'bg-marca-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
      }`}
    >
      {activa ? '♫' : '♪'}
    </button>
  )
}
