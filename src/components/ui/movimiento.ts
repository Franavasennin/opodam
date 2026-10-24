/** true si el usuario pide menos movimiento (prefers-reduced-motion). */
export const movimientoReducido = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
