import type { Tema } from '../../types'
interface Props { tema: Tema }
export function MapaMentalTab({ tema }: Props) {
  return <div className="p-4 text-gray-400">Mapa mental — {tema.titulo}</div>
}
