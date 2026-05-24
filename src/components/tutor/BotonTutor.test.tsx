import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BotonTutor } from './BotonTutor'

describe('BotonTutor', () => {
  it('llama a onClick al pulsar', () => {
    const onClick = vi.fn()
    render(<BotonTutor onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: /tutor/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
