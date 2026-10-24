import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface HeroScene3DProps {
  className?: string
}

export function HeroScene3D({ className = '' }: HeroScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isInteracting, setIsInteracting] = useState(false)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Chequeo de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 7.5)

    // 2. Renderer con alpha para integrarse en el fondo warm paper / dark mode
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      // Fallback si WebGL no está disponible
      return
    }

    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    // 3. Luces
    const ambientLight = new THREE.AmbientLight(0xfff6ec, 1.2)
    scene.add(ambientLight)

    // Luz principal reactiva al ratón
    const mouseLight = new THREE.PointLight(0xf3e2d9, 35, 15)
    mouseLight.position.set(2, 3, 4)
    scene.add(mouseLight)

    // Luz de borde dorada (Rim light)
    const rimLight = new THREE.DirectionalLight(0xc4a25a, 2.5)
    rimLight.position.set(-4, -2, -2)
    scene.add(rimLight)

    // Luz cálida terracota de contraste inferior
    const bottomLight = new THREE.PointLight(0xb8492f, 25, 10)
    bottomLight.position.set(0, -4, 2)
    scene.add(bottomLight)

    // 4. Grupo 3D Principal
    const mainGroup = new THREE.Group()
    scene.add(mainGroup)

    // A. Núcleo: Icosaedro facetado (símbolo de conocimiento y estructura jurídica/policial)
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 0)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xb8492f), // Terracota OpoDAM
      roughness: 0.25,
      metalness: 0.45,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      reflectivity: 0.9,
      flatShading: true,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    mainGroup.add(coreMesh)

    // B. Jaula exterior geométrica dorada (Wireframe cage)
    const wireGeo = new THREE.IcosahedronGeometry(2.1, 1)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xc4a25a, // Oro OpoDAM
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    mainGroup.add(wireMesh)

    // C. Anillo orbital biselado (Giroscopio)
    const ringGeo = new THREE.TorusGeometry(2.6, 0.04, 16, 100)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x8a3922,
      metalness: 0.8,
      roughness: 0.3,
    })
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat)
    ringMesh1.rotation.x = Math.PI / 3
    mainGroup.add(ringMesh1)

    const ringMesh2 = new THREE.Mesh(ringGeo, ringMat)
    ringMesh2.rotation.y = Math.PI / 4
    ringMesh2.rotation.x = -Math.PI / 5
    mainGroup.add(ringMesh2)

    // D. Nube de partículas orbitales (Átomos / Temas flotantes)
    const particlesCount = 75
    const positions = new Float32Array(particlesCount * 3)
    const colors = new Float32Array(particlesCount * 3)
    const goldColor = new THREE.Color(0xc4a25a)
    const clayColor = new THREE.Color(0xb8492f)

    for (let i = 0; i < particlesCount; i++) {
      const r = 2.4 + Math.random() * 1.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const mixed = Math.random() > 0.5 ? goldColor : clayColor
      colors[i * 3] = mixed.r
      colors[i * 3 + 1] = mixed.g
      colors[i * 3 + 2] = mixed.b
    }

    const particlesGeo = new THREE.BufferGeometry()
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particlesMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    })
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat)
    mainGroup.add(particlesMesh)

    // 5. Interacción con ratón y toque (Física de inercia Kowalski)
    let targetRotationX = 0
    let targetRotationY = 0
    let isDragging = false
    let prevPointerX = 0
    let prevPointerY = 0

    function onPointerMove(e: PointerEvent) {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

      // Mover la luz especular siguiendo al cursor
      mouseLight.position.x = x * 4
      mouseLight.position.y = y * 4 + 1

      if (isDragging) {
        const deltaX = e.clientX - prevPointerX
        const deltaY = e.clientY - prevPointerY
        targetRotationY += deltaX * 0.008
        targetRotationX += deltaY * 0.008
        prevPointerX = e.clientX
        prevPointerY = e.clientY
      } else {
        targetRotationY = x * 0.65
        targetRotationX = -y * 0.45
      }
    }

    function onPointerDown(e: PointerEvent) {
      isDragging = true
      setIsInteracting(true)
      prevPointerX = e.clientX
      prevPointerY = e.clientY
    }

    function onPointerUp() {
      isDragging = false
      setIsInteracting(false)
    }

    const dom = renderer.domElement
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)

    // 6. Resize Observer
    function handleResize() {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      if (prefersReducedMotion) renderer.render(scene, camera)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // 7. Loop de Animación
    let animationFrameId: number
    let clock = new THREE.Clock()

    function animate() {
      if (!prefersReducedMotion) animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      if (!prefersReducedMotion) {
        // Amortiguación elástica de rotación (Spring damping feel)
        mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.06
        mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.06

        // Rotaciones constantes sutiles
        if (!isDragging) {
          mainGroup.rotation.y += delta * 0.18
        }
        wireMesh.rotation.y -= delta * 0.08
        wireMesh.rotation.z += delta * 0.05
        ringMesh1.rotation.z += delta * 0.15
        ringMesh2.rotation.z -= delta * 0.12
        particlesMesh.rotation.y += delta * 0.04

        // Levitación senoidal suave
        mainGroup.position.y = Math.sin(time * 1.5) * 0.12
      }

      renderer.render(scene, camera)
    }

    animate()

    // Limpieza
    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      if (container.contains(dom)) {
        container.removeChild(dom)
      }
      renderer.dispose()
      renderer.forceContextLoss()
      coreGeo.dispose()
      coreMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      particlesGeo.dispose()
      particlesMat.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[340px] sm:h-[420px] select-none ${isInteracting ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      aria-label="Emblema 3D interactivo de OpoDAM. Arrastra para girar."
      role="img"
    >
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-[var(--mute)] bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border-soft)] opacity-70">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        ARRASTRA EN 3D
      </div>
    </div>
  )
}
