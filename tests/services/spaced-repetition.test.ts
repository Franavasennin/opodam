import { describe, it, expect, beforeEach } from 'vitest'
import { calcularProximoRepaso, flashcardsPendientesHoy, ordenarPorFragilidad } from '../../src/services/spaced-repetition'
import type { EstadoFlashcard } from '../../src/types'

beforeEach(() => localStorage.clear())

describe('calcularProximoRepaso', () => {
  it('Fácil aumenta el intervalo', () => {
    const e: EstadoFlashcard = { proximoRepaso: '2026-01-01', nivel: 2, intervalo: 3 }
    expect(calcularProximoRepaso(e, 'facil').intervalo).toBeGreaterThan(3)
  })
  it('Difícil reinicia intervalo a 1', () => {
    const e: EstadoFlashcard = { proximoRepaso: '2026-01-01', nivel: 3, intervalo: 10 }
    expect(calcularProximoRepaso(e, 'dificil').intervalo).toBe(1)
  })
  it('Dudoso mantiene o reduce el intervalo', () => {
    const e: EstadoFlashcard = { proximoRepaso: '2026-01-01', nivel: 2, intervalo: 6 }
    const nuevo = calcularProximoRepaso(e, 'dudoso')
    expect(nuevo.intervalo).toBeLessThanOrEqual(6)
    expect(nuevo.intervalo).toBeGreaterThan(0)
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
