import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Personalidad from './Personalidad'
import { cargarCuestionario } from '../data/personalidad/index'

function renderEn() {
  return render(
    <MemoryRouter initialEntries={['/oposicion/cgpc/personalidad']}>
      <Routes><Route path="/oposicion/:slug/personalidad" element={<Personalidad />} /></Routes>
    </MemoryRouter>
  )
}

beforeEach(() => { localStorage.clear() })

describe('Personalidad', () => {
  it('renderiza todos los ítems del cuestionario', () => {
    renderEn()
    const items = cargarCuestionario()
    expect(screen.getByText(items[0].texto)).toBeInTheDocument()
    expect(screen.getByText(items[items.length - 1].texto)).toBeInTheDocument()
  })

  it('al completar todos los ítems y ver resultado muestra el perfil', () => {
    renderEn()
    const items = cargarCuestionario()
    items.forEach(it => {
      fireEvent.click(screen.getByLabelText(`${it.id}-3`))
    })
    fireEvent.click(screen.getByRole('button', { name: /ver resultado/i }))
    expect(screen.getByText(/tu perfil/i)).toBeInTheDocument()
    expect(screen.getByText(/orientativo/i)).toBeInTheDocument()
  })
})
