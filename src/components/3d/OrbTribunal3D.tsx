import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface OrbTribunal3DProps {
  estado?: 'escuchando' | 'pensando' | 'hablando'
  modo?: 'practica' | 'examen'
  className?: string
}

export function OrbTribunal3D({
  estado = 'escuchando',
  modo = 'practica',
  className = '',
}: OrbTribunal3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const estadoRef = useRef(estado)
  const modoRef = useRef(modo)
  const redibujarRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    estadoRef.current = estado
    modoRef.current = modo
    redibujarRef.current?.()
  }, [estado, modo])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 4.2)

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

    const pointLight = new THREE.PointLight(0xffedd5, 30, 8)
    pointLight.position.set(2, 2, 3)
    scene.add(pointLight)

    const rimLight = new THREE.PointLight(0x99ddff, 20, 8)
    rimLight.position.set(-2, -2, -2)
    scene.add(rimLight)

    // Núcleo del Orbe
    const orbGroup = new THREE.Group()
    scene.add(orbGroup)

    const coreGeo = new THREE.IcosahedronGeometry(1.1, 3)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(modoRef.current === 'examen' ? 0x241e19 : 0xb8492f),
      roughness: 0.15,
      metalness: 0.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    orbGroup.add(coreMesh)

    // Aura exterior de alambre holográfico
    const auraGeo = new THREE.IcosahedronGeometry(1.35, 1)
    const auraMat = new THREE.MeshBasicMaterial({
      color: modoRef.current === 'examen' ? 0xe0a070 : 0xc4a25a,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
    const auraMesh = new THREE.Mesh(auraGeo, auraMat)
    orbGroup.add(auraMesh)

    // Partículas de voz orbitales
    const pCount = 50
    const pPositions = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 1.45 + Math.random() * 0.4
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPositions[i * 3 + 2] = r * Math.cos(phi)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    const pMat = new THREE.PointsMaterial({
      size: 0.05,
      color: modoRef.current === 'examen' ? 0xe8896b : 0xc4a25a,
      transparent: true,
      opacity: 0.75,
    })
    const pMesh = new THREE.Points(pGeo, pMat)
    orbGroup.add(pMesh)

    // Loop
    let animId: number
    const clock = new THREE.Clock()

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    function animate() {
      if (!reducido) animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      const est = estadoRef.current

      // Frecuencia y amplitud de respiración según el estado
      let speed = 1.0
      let pulseAmp = 0.05

      if (est === 'pensando') {
        speed = 2.4
        pulseAmp = 0.08
        coreMat.color.setHex(0xc4a25a)
      } else if (est === 'hablando') {
        speed = 3.5
        pulseAmp = 0.12
        coreMat.color.setHex(0xb8492f)
      } else {
        speed = 1.0
        pulseAmp = 0.04
        coreMat.color.setHex(modoRef.current === 'examen' ? 0x3a3631 : 0x8a3922)
      }

      const scale = 1 + Math.sin(t * speed) * pulseAmp
      coreMesh.scale.set(scale, scale, scale)
      auraMesh.rotation.y += 0.008
      auraMesh.rotation.x += 0.005
      orbGroup.rotation.y += 0.006
      pMesh.rotation.y -= 0.004

      renderer.render(scene, camera)
    }

    redibujarRef.current = reducido ? animate : null
    animate()

    function handleResize() {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
      redibujarRef.current?.()
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      redibujarRef.current = null
      ro.disconnect()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      renderer.forceContextLoss()
      coreGeo.dispose()
      coreMat.dispose()
      auraGeo.dispose()
      auraMat.dispose()
      pGeo.dispose()
      pMat.dispose()
    }
  }, [])

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div
        ref={mountRef}
        className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] cursor-pointer"
        role="img"
        aria-label={`Orbe 3D del Tribunal examinador. Estado: ${estado}`}
      />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-[var(--ink-soft)] bg-[var(--surface-2)] border border-[var(--border-soft)]">
        <span
          className={`w-2 h-2 rounded-full ${
            estado === 'hablando'
              ? 'bg-[var(--accent)] animate-ping'
              : estado === 'pensando'
              ? 'bg-[var(--gold)] animate-pulse'
              : 'bg-[var(--ok)]'
          }`}
        />
        {estado === 'hablando' ? 'TRIBUNAL HABLANDO' : estado === 'pensando' ? 'EVALUANDO RESPUESTA…' : 'ESCUCHANDO'}
      </div>
    </div>
  )
}
