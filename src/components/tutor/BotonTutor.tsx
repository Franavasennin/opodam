import { Icon } from '../ui/Icon'

interface Props { onClick: () => void }

export function BotonTutor({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir tutor"
      className="fixed bottom-56 right-4 z-50 h-12 px-4 rounded-full shadow-lg flex items-center gap-2 bg-marca-600 hover:bg-marca-700 text-white text-sm font-semibold transition-colors"
    >
      <Icon nombre="tutor" size={20} />
      Tutor
    </button>
  )
}
