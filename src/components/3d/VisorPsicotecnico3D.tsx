import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface VisorPsicotecnico3DProps {
  className?: string
}

const CARAS_INFO = [
  { nombre: 'Frontal', simbolo: '▲', color: '#b8492f' },
  { nombre: 'Trasera', simbolo: '■', color: '#8a3922' },
  { nombre: 'Superior', simbolo: '●', color: '#c4a25a' },
  { nombre: 'Inferior', simbolo: '◆', color: '#544f48' },
  { nombre: 'Derecha', simbolo: '★', color: '#2c6a43' },
  { nombre: 'Izquierda', simbolo: '✕', color: '#3a3631' },
]

export function VisorPsicotecnico3D({ className = '' }: VisorPsicotecnico3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const cubeGroupRef = useRef<THREE.Group | null>(null)
  const redibujarRef = useRef<(() => void) | null>(null)
  const targetRotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0.3, y: 0.5, z: 0 })
  const [ejeActivo, setEjeActivo] = useState<'libre' | 'X' | 'Y' | 'Z'>('libre')
  const [pasoRotacion, setPasoRotacion] = useState(0)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 5.5)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }

    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffeedd, 35, 10)
    pointLight.position.set(3, 4, 4)
    scene.add(pointLight)

    const fillLight = new THREE.PointLight(0xccddff, 15, 10)
    fillLight.position.set(-3, -2, 2)
    scene.add(fillLight)

    // Grupo del Cubo
    const cubeGroup = new THREE.Group()
    cubeGroupRef.current = cubeGroup
    scene.add(cubeGroup)

    // Materiales de caras con texturas generadas por Canvas (símbolos de psicotécnicos)
    const materials: THREE.MeshStandardMaterial[] = CARAS_INFO.map(cara => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#fbfaf5'
        ctx.fillRect(0, 0, 256, 256)

        // Borde biselado
        ctx.lineWidth = 14
        ctx.strokeStyle = cara.color
        ctx.strokeRect(7, 7, 242, 242)

        // Símbolo central
        ctx.fillStyle = cara.color
        ctx.font = 'bold 110px "Geist", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cara.simbolo, 128, 128)
      }
      const texture = new THREE.CanvasTexture(canvas)
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.15,
      })
    })

    const boxGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8)
    const cubeMesh = new THREE.Mesh(boxGeo, materials)
    cubeGroup.add(cubeMesh)

    // Borde exterior resaltado
    const edgesGeo = new THREE.EdgesGeometry(boxGeo)
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x1a1815, linewidth: 2 })
    const wireframe = new THREE.LineSegments(edgesGeo, edgesMat)
    cubeGroup.add(wireframe)

    // Guías de ejes (Axis Helpers sutiles)
    const axesGroup = new THREE.Group()
    const axisMatX = new THREE.LineBasicMaterial({ color: 0xb8492f, transparent: true, opacity: 0.4 })
    const axisMatY = new THREE.LineBasicMaterial({ color: 0x2c6a43, transparent: true, opacity: 0.4 })
    const axisMatZ = new THREE.LineBasicMaterial({ color: 0xc4a25a, transparent: true, opacity: 0.4 })

    const lineX = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.5, 0, 0), new THREE.Vector3(2.5, 0, 0)]), axisMatX)
    const lineY = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2.5, 0), new THREE.Vector3(0, 2.5, 0)]), axisMatY)
    const lineZ = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -2.5), new THREE.Vector3(0, 0, 2.5)]), axisMatZ)
    axesGroup.add(lineX, lineY, lineZ)
    scene.add(axesGroup)

    // Drag con inercia
    let isDragging = false
    let prevX = 0
    let prevY = 0

    function onPointerDown(e: PointerEvent) {
      isDragging = true
      prevX = e.clientX
      prevY = e.clientY
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return
      const deltaX = e.clientX - prevX
      const deltaY = e.clientY - prevY
      targetRotationRef.current.y += deltaX * 0.012
      targetRotationRef.current.x += deltaY * 0.012
      redibujarRef.current?.()
      prevX = e.clientX
      prevY = e.clientY
    }

    function onPointerUp() {
      isDragging = false
    }

    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // Resize
    function onResize() {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
      redibujarRef.current?.()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    let animId: number
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Con movimiento reducido no hay amortiguación ni bucle: se dibuja bajo demanda
    function dibujar() {
      const g = cubeGroupRef.current
      if (g) {
        const k = reducido ? 1 : 0.08
        const t = targetRotationRef.current
        g.rotation.x += (t.x - g.rotation.x) * k
        g.rotation.y += (t.y - g.rotation.y) * k
        g.rotation.z += (t.z - g.rotation.z) * k
      }
      renderer.render(scene, camera)
    }
    function loop() {
      if (!reducido) animId = requestAnimationFrame(loop)
      dibujar()
    }
    redibujarRef.current = reducido ? dibujar : null
    loop()

    return () => {
      cancelAnimationFrame(animId)
      redibujarRef.current = null
      ro.disconnect()
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      if (container.contains(dom)) container.removeChild(dom)
      renderer.dispose()
      renderer.forceContextLoss()
      boxGeo.dispose()
      edgesGeo.dispose()
      edgesMat.dispose()
      materials.forEach(m => { m.map?.dispose(); m.dispose() })
      ;[axisMatX, axisMatY, axisMatZ].forEach(m => m.dispose())
      ;[lineX, lineY, lineZ].forEach(l => l.geometry.dispose())
    }
  }, [])

  function rotarEje(eje: 'X' | 'Y' | 'Z', direccion: 1 | -1) {
    setEjeActivo(eje)
    setPasoRotacion(p => p + 1)
    const angle = (Math.PI / 2) * direccion
    if (eje === 'X') targetRotationRef.current.x += angle
    if (eje === 'Y') targetRotationRef.current.y += angle
    if (eje === 'Z') targetRotationRef.current.z += angle
    redibujarRef.current?.()
  }

  function reiniciar() {
    targetRotationRef.current = { x: 0.3, y: 0.5, z: 0 }
    redibujarRef.current?.()
    setEjeActivo('libre')
    setPasoRotacion(0)
  }

  return (
    <div className={`relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[13px] font-semibold tracking-tight text-[var(--ink)]">
            Laboratorio 3D: Rotación Espacial
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--mute)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border-soft)]">
          {ejeActivo === 'libre' ? 'Vista Libre' : `Giro 90° en ${ejeActivo} (#${pasoRotacion})`}
        </span>
      </div>

      <p className="text-[12.5px] text-[var(--ink-soft)] mb-3 leading-relaxed">
        Entrena tu mente para los ejercicios de <strong>figuras en rotación y cubos de examen</strong>. Arrastra libremente o prueba rotaciones de 90° en cada eje.
      </p>

      {/* Canvas 3D */}
      <div
        ref={mountRef}
        className="w-full h-[240px] sm:h-[280px] cursor-grab active:cursor-grabbing rounded-xl bg-[var(--bg)] border border-[var(--border-soft)] relative overflow-hidden"
      >
        <div className="pointer-events-none absolute bottom-2 right-2 text-[10px] font-mono text-[var(--mute)] opacity-60">
          ARRASTRA O USA LOS BOTONES
        </div>
      </div>

      {/* Controles táctiles estilo Emil Kowalski */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-soft)]">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-mono text-[var(--mute)] mr-1">EJE:</span>
          <button
            type="button"
            onClick={() => rotarEje('X', 1)}
            className="tactile-press px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] hover:border-[var(--accent)]"
            title="Girar 90 grados en eje horizontal (X)"
          >
            +90° X
          </button>
          <button
            type="button"
            onClick={() => rotarEje('Y', 1)}
            className="tactile-press px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ok)] hover:border-[var(--ok)]"
            title="Girar 90 grados en eje vertical (Y)"
          >
            +90° Y
          </button>
          <button
            type="button"
            onClick={() => rotarEje('Z', 1)}
            className="tactile-press px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--gold)] hover:border-[var(--gold)]"
            title="Girar 90 grados en eje de profundidad (Z)"
          >
            +90° Z
          </button>
        </div>

        <button
          type="button"
          onClick={reiniciar}
          className="tactile-press text-[12px] font-medium text-[var(--mute)] hover:text-[var(--ink)] px-2.5 py-1 rounded-lg border border-transparent hover:border-[var(--border)]"
        >
          ↺ Resetear
        </button>
      </div>

      {/* Guía de Caras para comprobación */}
      <div className="mt-3 grid grid-cols-6 gap-1 text-center">
        {CARAS_INFO.map(c => (
          <div key={c.nombre} className="p-1 rounded bg-[var(--surface-2)] border border-[var(--border-soft)]">
            <span className="block text-[14px]" style={{ color: c.color }}>{c.simbolo}</span>
            <span className="text-[10px] text-[var(--mute)] leading-none">{c.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
