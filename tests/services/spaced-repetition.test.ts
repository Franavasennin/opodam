import { describe, it, expect, beforeEach } from 'vitest'
import { calcularProximoRepaso, flashcardsPendientesHoy, ordenarPorFragilidad } from '../../src/services/spaced-repetition'
import type { EstadoFlashcard } from '../../src/types'

beforeEach(() => localStorage.clear())

describe('calcularProximoRepaso (FSRS-4.5)', () => {
  const HOY = '2026-06-14'
  it('primera vez ⇒ deja estado FSRS y orden fácil > dudoso > difícil', () => {
    const nueva = (): EstadoFlashcard => ({ proximoRepaso: HOY, nivel: 0, intervalo: 1 })
    const facil = calcularProximoRepaso(nueva(), 'facil', HOY)
    const dudoso = calcularProximoRepaso(nueva(), 'dudoso', HOY)
    const dificil = calcularProximoRepaso(nueva(), 'dificil', HOY)
    expect(facil.stability).toBeGreaterThan(0)
    expect(facil.difficulty).toBeGreaterThanOrEqual(1)
    expect(facil.ultimaRevision).toBe(HOY)
    expect(facil.intervalo).toBeGreaterThan(dudoso.intervalo)
    expect(facil.stability!).toBeGreaterThan(dudoso.stability!)
    expect(dudoso.stability!).toBeGreaterThan(dificil.stability!)
  })
  it('Difícil reduce la estabilidad de una card madura', () => {
    const e: EstadoFlashcard = { proximoRepaso: HOY, nivel: 4, intervalo: 30, stability: 30, difficulty: 5, ultimaRevision: '2026-05-15' }
    const nuevo = calcularProximoRepaso(e, 'dificil', HOY)
    expect(nuevo.stability!).toBeLessThan(30)
  })
  it('migra un estado legado SM-2 sin parámetros FSRS', () => {
    const e: EstadoFlashcard = { proximoRepaso: '2026-01-01', nivel: 3, intervalo: 10 }
    const nuevo = calcularProximoRepaso(e, 'facil', HOY)
    expect(nuevo.stability).toBeGreaterThan(0)
    expect(nuevo.difficulty).toBeGreaterThanOrEqual(1)
  })
})

describe('flashcardsPendientesHoy', () => {
  it('devuelve solo las cards con proximoRepaso <= hoy', () => {
    const hoy = new Date().toISOString().slice(0, 10)
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
    const manana = new Date(); manana.setDate(manana.getDate() + 1)
    const estados: Record<string, EstadoFlashcard> = {
      'a': { proximoRepaso: ayer.toISOString().slice(0, 10), nivel: 1, intervalo: 1 },
      'b': { proximoRepaso: hoy, nivel: 2, intervalo: 3 },
      'c': { proximoRepaso: manana.toISOString().slice(0, 10), nivel: 3, intervalo: 7 },
    }
    const ids = flashcardsPendientesHoy(estados)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).not.toContain('c')
  })
})

describe('ordenarPorFragilidad', () => {
  const estados: Record<string, EstadoFlashcard> = {
    'baja-vencida': { proximoRepaso: '2026-06-01', nivel: 0, intervalo: 1 },
    'baja-reciente': { proximoRepaso: '2026-06-10', nivel: 0, intervalo: 1 },
    'alta': { proximoRepaso: '2026-06-01', nivel: 4, intervalo: 20 },
  }
  it('prioriza el nivel más bajo', () => {
    const orden = ordenarPorFragilidad(['alta', 'baja-reciente'], estados)
    expect(orden[0]).toBe('baja-reciente')
  })
  it('a igual nivel, lo más vencido primero', () => {
    const orden = ordenarPorFragilidad(['baja-reciente', 'baja-vencida'], estados)
    expect(orden).toEqual(['baja-vencida', 'baja-reciente'])
  })
  it('los ids sin estado van al final', () => {
    const orden = ordenarPorFragilidad(['huérfana', 'alta'], estados)
    expect(orden[orden.length - 1]).toBe('huérfana')
  })
  it('no muta el array de entrada', () => {
    const entrada = ['alta', 'baja-vencida']
    ordenarPorFragilidad(entrada, estados)
    expect(entrada).toEqual(['alta', 'baja-vencida'])
  })
})
