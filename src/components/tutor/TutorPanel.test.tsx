import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Tema } from '../../types'

vi.mock('../../services/tutor', () => ({
  preguntarTutor: vi.fn().mockResolvedValue({ content: 'respuesta del tutor', error: null }),
}))
vi.mock('../../services/tutorHistorial', () => ({
  cargarHistorial: vi.fn().mockResolvedValue([]),
  guardarHistorial: vi.fn().mockResolvedValue(undefined),
}))

import { TutorPanel } from './TutorPanel'
import { preguntarTutor } from '../../services/tutor'

const tema = {
  id: 1, titulo: 'Tema de prueba', bloque: 'general',
  secciones: [{ titulo: 'S', contenido: 'c' }], esquemas: [],
  mapaMental: { nodos: [], aristas: [] }, flashcards: [], preguntas: [],
} as unknown as Tema

beforeEach(() => { vi.clearAllMocks() })

describe('TutorPanel', () => {
  it('muestra el mensaje de bienvenida cuando no hay historial', async () => {
    render(<TutorPanel oposicion="cgpc" tema={tema} abierto onCerrar={() => {}} />)
    await waitFor(() => expect(screen.getByText(/pregúntame cualquier duda/i)).toBeInTheDocument())
  })

  it('envía la pregunta y muestra la respuesta', async () => {
    render(<TutorPanel oposicion="cgpc" tema={tema} abierto onCerrar={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/escribe tu duda/i), { target: { value: '¿qué es?' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    await waitFor(() => expect(screen.getByText('respuesta del tutor')).toBeInTheDocument())
    expect(preguntarTutor).toHaveBeenCalledTimes(1)
  })

  it('no renderiza nada cuando abierto=false', () => {
    const { container } = render(<TutorPanel oposicion="cgpc" tema={tema} abierto={false} onCerrar={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
