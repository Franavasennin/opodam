// src/services/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getActiveSlug,
  setActiveSlug,
  getProgresoKey,
  migrarProgresoLegado,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('getActiveSlug', () => {
  it('returns "cgpc" by default when nothing is stored', () => {
    expect(getActiveSlug()).toBe('cgpc')
  })

  it('returns the stored slug after setActiveSlug', () => {
    setActiveSlug('aux-enfermeria')
    expect(getActiveSlug()).toBe('aux-enfermeria')
  })
})

describe('getProgresoKey', () => {
  it('returns namespaced key for active slug', () => {
    setActiveSlug('cgpc')
    expect(getProgresoKey()).toBe('opodam:cgpc:progreso')
  })

  it('uses passed slug when provided', () => {
    expect(getProgresoKey('aux-judicial')).toBe('opodam:aux-judicial:progreso')
  })
})

describe('migrarProgresoLegado', () => {
  it('does nothing when legacy key does not exist', () => {
    migrarProgresoLegado()
    expect(localStorage.getItem('opodam:cgpc:progreso')).toBeNull()
  })

  it('copies legacy opodam:progreso to opodam:cgpc:progreso and removes old key', () => {
    const legacyData = JSON.stringify({ 'tema-01': { completado: true } })
    localStorage.setItem('opodam:progreso', legacyData)
    migrarProgresoLegado()
    expect(localStorage.getItem('opodam:cgpc:progreso')).toBe(legacyData)
    expect(localStorage.getItem('opodam:progreso')).toBeNull()
  })

  it('does not overwrite existing cgpc progress if both keys exist', () => {
    const existing = JSON.stringify({ 'tema-02': { completado: true } })
    localStorage.setItem('opodam:cgpc:progreso', existing)
    localStorage.setItem('opodam:progreso', JSON.stringify({ 'tema-01': { completado: true } }))
    migrarProgresoLegado()
    expect(localStorage.getItem('opodam:cgpc:progreso')).toBe(existing)
    expect(localStorage.getItem('opodam:progreso')).toBeNull()
  })
})
