import { useMusica } from '../../hooks/useMusica'
import { Icon } from '../ui/Icon'

export function BotonMusica() {
  const { activa, alternar } = useMusica()
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={activa}
      aria-label={activa ? 'Desactivar música de concentración' : 'Activar música de concentración'}
      title={activa ? 'Desactivar música' : 'Activar música de concentración'}
      className={`fab fab--1${activa ? ' fab--activo' : ''}`}
    >
      <Icon nombre="nota" size={20} />
    </button>
  )
}
