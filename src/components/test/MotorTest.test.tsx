import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MotorTest } from './MotorTest'

const preguntas = [
  { id: 'q1', enunciado: '¿2+2?', opciones: ['3', '4', '5'], respuestaCorrecta: 1, explicacion: 'Dos más dos son cuatro.' },
  { id: 'q2', enunciado: '¿Capital de España?', opciones: ['Madrid', 'París'], respuestaCorrecta: 0, explicacion: 'Madrid.' },
]

describe('MotorTest', () => {
  it('muestra la primera pregunta y su título', () => {
    render(<MotorTest preguntas={preguntas} titulo="Prueba" />)
    expect(screen.getByText('Prueba')).toBeInTheDocument()
    expect(screen.getByText('¿2+2?')).toBeInTheDocument()
  })

  it('corrige y puntúa, llamando onTerminar con aciertos', () => {
    const onTerminar = vi.fn()
    render(<MotorTest preguntas={preguntas} titulo="Prueba" onTerminar={onTerminar} />)
    fireEvent.click(screen.getByText('4'))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByText('Madrid'))
    fireEvent.click(screen.getByRole('button', { name: /finalizar/i }))
    expect(onTerminar).toHaveBeenCalledWith({ aciertos: 2, errores: 0, total: 2 })
    expect(screen.getByText(/2 aciertos/i)).toBeInTheDocument()
  })

  it('en revisión muestra la explicación', () => {
    render(<MotorTest preguntas={preguntas} titulo="Prueba" />)
    fireEvent.click(screen.getByText('3'))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByText('París'))
    fireEvent.click(screen.getByRole('button', { name: /finalizar/i }))
    expect(screen.getByText('Dos más dos son cuatro.')).toBeInTheDocument()
  })
})
