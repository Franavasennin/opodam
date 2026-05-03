import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Tema } from '../../types'

interface Props { tema: Tema }

// ── Normalización de ambos formatos de nodo ──────────────────────────────────
// Formato A (correcto): { id, data: { label }, position: { x, y } }
// Formato B (legado):   { id, label, nivel }  +  aristas { origen, destino }

function buildLayout(rawNodos: any[], rawAristas: any[]): { nodes: Node[]; edges: Edge[] } {
  const isFormatA = rawNodos.length > 0 && rawNodos[0].data && rawNodos[0].position

  if (isFormatA) {
    const nodes: Node[] = rawNodos.map(n => ({
      ...n,
      style: nodeStyle(n.id === '0' || n.id === 'root'),
    }))
    const edges: Edge[] = rawAristas.map((a: any, i: number) => ({
      id: a.id ?? `e${i}`,
      source: a.source,
      target: a.target,
      style: { stroke: '#4361ee', strokeWidth: 1.5 },
    }))
    return { nodes, edges }
  }

  // Formato B: construir árbol y calcular posiciones radiales
  const children: Record<string, string[]> = {}
  const parents: Record<string, string> = {}
  rawNodos.forEach((n: any) => { children[n.id] = [] })
  rawAristas.forEach((a: any) => {
    const src: string = a.origen ?? a.source
    const tgt: string = a.destino ?? a.target
    if (src && tgt && children[src] !== undefined) {
      children[src].push(tgt)
      parents[tgt] = src
    }
  })

  // Nodo raíz = el que no tiene padre
  const rootId: string = rawNodos.find((n: any) => !parents[n.id])?.id ?? rawNodos[0]?.id

  // BFS para asignar nivel a cada nodo
  const levels: Record<string, number> = {}
  const queue: string[] = [rootId]
  levels[rootId] = 0
  while (queue.length) {
    const cur = queue.shift()!
    ;(children[cur] || []).forEach((child: string) => {
      if (levels[child] === undefined) {
        levels[child] = levels[cur] + 1
        queue.push(child)
      }
    })
  }

  // Agrupar nodos por nivel
  const byLevel: Record<number, string[]> = {}
  rawNodos.forEach((n: any) => {
    const lv = levels[n.id] ?? 1
    if (!byLevel[lv]) byLevel[lv] = []
    byLevel[lv].push(n.id)
  })

  // Posiciones radiales por nivel
  const positions: Record<string, { x: number; y: number }> = {}
  positions[rootId] = { x: 0, y: 0 }
  const radii = [0, 280, 540, 800]

  Object.entries(byLevel).forEach(([lvStr, ids]) => {
    const lv = parseInt(lvStr)
    if (lv === 0) return
    const r = radii[lv] ?? lv * 280
    ids.forEach((id: string, i: number) => {
      const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2
      positions[id] = {
        x: Math.round(Math.cos(angle) * r),
        y: Math.round(Math.sin(angle) * r),
      }
    })
  })

  const nodes: Node[] = rawNodos.map((n: any) => ({
    id: n.id,
    data: { label: n.label ?? n.id },
    position: positions[n.id] ?? { x: 0, y: 0 },
    style: nodeStyle(n.id === rootId),
  }))

  const edges: Edge[] = rawAristas
    .map((a: any, i: number) => ({
      id: `e${i}`,
      source: a.origen ?? a.source,
      target: a.destino ?? a.target,
      style: { stroke: '#4361ee', strokeWidth: 1.5 },
    }))
    .filter((e: Edge) => e.source && e.target)

  return { nodes, edges }
}

function nodeStyle(isRoot: boolean): React.CSSProperties {
  return {
    background: isRoot ? '#4361ee' : '#f0f4ff',
    color: isRoot ? '#fff' : '#1a2980',
    border: '1px solid #dbe4ff',
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: isRoot ? 700 : 500,
    maxWidth: 200,
  }
}

export function MapaMentalTab({ tema }: Props) {
  const rawNodos = tema.mapaMental?.nodos ?? []
  const rawAristas = tema.mapaMental?.aristas ?? []

  if (!rawNodos.length) {
    return <p className="text-gray-400 text-sm text-center py-8">Mapa mental no disponible.</p>
  }

  const { nodes, edges } = buildLayout(rawNodos, rawAristas)

  return (
    <div style={{ height: 500 }} className="rounded-xl overflow-hidden border border-gray-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  )
}
