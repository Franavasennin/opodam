/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guardia de contraste: lee los tokens de index.css y falla si un par
 * texto/fondo baja de WCAG AA (4.5:1). Evita que vuelvan hex sueltos o que
 * un retoque de paleta rompa la legibilidad sin que nadie lo note.
 */
const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8')

function bloque(selector: string): Record<string, string> {
  const ini = css.indexOf(`${selector} {`)
  const fin = css.indexOf('\n}', ini)
  const tokens: Record<string, string> = {}
  for (const m of css.slice(ini, fin).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) tokens[m[1]] = m[2]
  return tokens
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// [texto, fondo]
const PARES: [string, string][] = [
  ['ink', 'bg'], ['ink', 'surface'], ['ink-soft', 'surface-2'],
  ['mute', 'bg'], ['mute', 'surface'], ['mute', 'surface-2'],
  ['accent-strong', 'surface'], ['accent-strong', 'accent-soft'],
  ['accent-ink', 'accent'],
  ['warn', 'warn-soft'], ['warn', 'surface'],
  ['gold', 'gold-soft'], ['gold', 'bg'],
  ['ok', 'ok-soft'], ['ok', 'surface'],
  ['err', 'err-soft'], ['err', 'surface'],
]

describe.each([[':root', 'día'], ['html.dark', 'noche']])('contraste AA — %s (%s)', (selector) => {
  // El tema noche hereda de :root lo que no redefine.
  const t = { ...bloque(':root'), ...(selector === ':root' ? {} : bloque(selector)) }
  it.each(PARES)('%s sobre %s ≥ 4.5:1', (fg, bg) => {
    expect(t[fg], `falta --${fg}`).toBeDefined()
    expect(t[bg], `falta --${bg}`).toBeDefined()
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
  })
})
