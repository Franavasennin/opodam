import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Tema } from '../../types'

interface Props { tema: Tema }

export function MapaMentalTab({ tema }: Props) {
  if (!tema.mapaMental.nodos.length) {
    return <p className="text-gray-400 text-sm text-center py-8">Mapa mental no disponible.</p>
  }

  const nodos: Node[] = tema.mapaMental.nodos.map(n => ({
    ...n,
    style: {
      background: n.id === '0' ? '#4361ee' : '#f0f4ff',
      color: n.id === '0' ? '#fff' : '#1a2980',
      border: '1px solid #dbe4ff',
      borderRadius: '12px',
      padding: '8px 12px',
      fontSize: '13px',
      fontWeight: n.id === '0' ? 700 : 500,
    },
  }))

  const aristas: Edge[] = tema.mapaMental.aristas.map(a => ({ ...a }))

  return (
    <div style={{ height: 480 }} className="rounded-xl overflow-hidden border border-gray-100">
      <ReactFlow nodes={nodos} edges={aristas} fitView attributionPosition="bottom-left">
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
