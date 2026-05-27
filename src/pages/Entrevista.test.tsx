import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/entrevista', () => ({
  enviarTurnoEntrevista: vi.fn().mockResolvedValue({ content: 'Bienvenido. Primera pregunta: ¿por qué esta oposición?', error: null }),
}))

import Entrevista from './Entrevista'
import { enviarTurnoEntrevista } from '../services/entrevista'

function renderEn(ruta = '/oposicion/cgpc/entrevista') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes><Route path="/oposicion/:slug/entrevista" element={<Entrevista />} /></Routes>
    </MemoryRouter>
  )
}

beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

describe('Entrevista', () => {
  it('muestra el selector de modo al inicio', () => {
    renderEn()
    expect(screen.getByText(/práctica/i)).toBeInTheDocument()
    expect(screen.getByText(/examen real/i)).toBeInTheDocument()
  })

  it('al elegir modo arranca y pide el primer turno', async () => {
    renderEn()
    fireEvent.click(screen.getByRole('button', { name: /práctica/i }))
    await waitFor(() => expect(enviarTurnoEntrevista).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/primera pregunta/i)).toBeInTheDocument())
  })
})
