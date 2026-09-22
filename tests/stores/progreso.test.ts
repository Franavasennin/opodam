import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { getProgreso, saveProgreso, setActiveSlug, getProgresoKey } from '../../src/services/storage'
import { guardarResultadoTest } from '../../src/services/progress'
import { useProgresoStore } from '../../src/stores/progreso'
import { useOposicionStore } from '../../src/stores/oposicion'
import { useProgress } from '../../src/hooks/useProgress'

beforeEach(() => {
  localStorage.clear()
  setActiveSlug('cgpc')
  useProgresoStore.getState().recargar()
})

describe('store de progreso', () => {
  it('se actualiza con cualquier saveProgreso, venga del servicio que venga', () => {
    guardarResultadoTest(3, 8, 2, 10)
    const { progreso, slug } = useProgresoStore.getState()
    expect(slug).toBe('cgpc')
    expect(progreso.temas['3']).toMatchObject({ vueltas: 1, porcentajeAciertos: 80 })
  })

  it('guarda una copia: mutar el objeto del servicio tras guardar no altera el store', () => {
    const p = getProgreso()
    p.tiempoTotalSegundos = 60
    saveProgreso(p)
    p.tiempoTotalSegundos = 999
    expect(useProgresoStore.getState().progreso.tiempoTotalSegundos).toBe(60)
  })

  it('al cambiar de oposición carga el progreso de la nueva', () => {
    localStorage.setItem(getProgresoKey('policia-local'), JSON.stringify({ tiempoTotalSegundos: 42 }))
    useOposicionStore.getState().activar('policia-local')
    const { progreso, slug } = useProgresoStore.getState()
    expect(slug).toBe('policia-local')
    expect(progreso.tiempoTotalSegundos).toBe(42)
  })
})

describe('store de oposición activa', () => {
  it('activar persiste el slug y actualiza el store', () => {
    useOposicionStore.getState().activar('guardia-civil')
    expect(localStorage.getItem('opodam:active-slug')).toBe('guardia-civil')
    expect(useOposicionStore.getState().slug).toBe('guardia-civil')
  })

  it('ignora slugs que no existen', () => {
    useOposicionStore.getState().activar('no-existe')
    expect(useOposicionStore.getState().slug).toBe('cgpc')
    expect(localStorage.getItem('opodam:active-slug')).toBe('cgpc')
  })

  it('se entera si alguien llama a setActiveSlug directamente', () => {
    setActiveSlug('aux-judicial')
    expect(useOposicionStore.getState().slug).toBe('aux-judicial')
  })
})

describe('useProgress sobre el store', () => {
  it('dos componentes ven el mismo progreso: lo que guarda uno lo ve el otro', () => {
    const a = renderHook(() => useProgress())
    const b = renderHook(() => useProgress())
    act(() => { a.result.current.guardarTest(5, 10, 0, 10) })
    expect(b.result.current.progreso.temas['5']?.porcentajeAciertos).toBe(100)
  })

  it('actualizarNotificaciones se refleja sin llamar a refrescar', () => {
    const { result } = renderHook(() => useProgress())
    act(() => { result.current.actualizarNotificaciones('08:30', true) })
    expect(result.current.progreso.notificaciones).toEqual({ hora: '08:30', activas: true })
  })
})
