import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMusica } from './useMusica'

describe('useMusica', () => {
  beforeEach(() => {
    localStorage.clear()
    HTMLMediaElement.prototype.play = () => Promise.resolve()
    HTMLMediaElement.prototype.pause = () => {}
  })

  it('arranca desactivada por defecto', () => {
    const { result } = renderHook(() => useMusica())
    expect(result.current.activa).toBe(false)
  })

  it('alternar cambia el estado y lo persiste', () => {
    const { result } = renderHook(() => useMusica())
    act(() => result.current.alternar())
    expect(result.current.activa).toBe(true)
    expect(localStorage.getItem('opodam.musica')).toBe('on')
  })
})
