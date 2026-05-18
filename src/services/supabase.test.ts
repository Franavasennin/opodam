import { describe, it, expect } from 'vitest'
import { iniciarSesionAnonima } from './supabase'

describe('iniciarSesionAnonima', () => {
  it('es una función exportada', () => {
    expect(typeof iniciarSesionAnonima).toBe('function')
  })

  it('devuelve un objeto con campo error sin lanzar excepción', async () => {
    const res = await iniciarSesionAnonima()
    expect(res).toHaveProperty('error')
  })
})
