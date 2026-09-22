import { test, expect, ALUMNA } from './fixtures'
import type { Page } from '@playwright/test'

/**
 * Recorrido completo de una oposición con suscripción:
 *   dashboard → tema (teoría) → test del tema → flashcards del tema → dashboard.
 *
 * Se navega con la barra lateral (navegación SPA, sin recargar) y se
 * comprueba que el progreso del test y de las flashcards se guarda y aparece
 * en el temario y en el dashboard. (Que dos componentes montados a la vez
 * compartan el mismo estado lo cubre tests/stores/progreso.test.ts.)
 */

const lateral = (page: Page) => page.getByRole('navigation', { name: 'Navegación de la oposición' })

const progresoGuardado = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('opodam:cgpc:progreso') ?? 'null'))

test('dashboard → tema → test → flashcards, y el progreso se refleja en toda la app', async ({ page, supa }) => {
  supa.alta(ALUMNA, { suscripciones: ['cgpc'] })
  await supa.conSesion(ALUMNA)

  // ── Dashboard: alumna nueva ──
  await page.goto('/oposicion/cgpc')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText(/Temas estudiados\s*0 \/ 45/)).toBeVisible()

  // ── Temario → tema 1 (teoría) ──
  await lateral(page).getByRole('link', { name: 'Temario' }).click()
  await expect(page).toHaveURL(/\/oposicion\/cgpc\/temario$/)
  const tema1 = page.getByRole('button', { name: /^1 La Constitución Española/ })
  await expect(tema1).toContainText('Sin estudiar')
  await tema1.click()
  await expect(page).toHaveURL(/\/oposicion\/cgpc\/temario\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: /La Constitución Española de 1978/ })).toBeVisible()
  await expect(page.getByText('Artículo 1.')).toBeVisible()

  // ── Test del tema 1 ──
  await lateral(page).getByRole('link', { name: 'Tests y simulacros' }).click()
  await page.getByRole('button', { name: /^1 / }).first().click()
  await page.getByRole('button', { name: /^Normal/ }).click()

  const preguntas = page.locator('main .card').filter({ has: page.locator('button.opt') })
  await expect(preguntas).toHaveCount(30)
  const enviar = page.getByRole('button', { name: 'Enviar respuestas' })
  await expect(enviar).toBeDisabled()
  for (const pregunta of await preguntas.all()) {
    await pregunta.locator('button.opt').first().click()
  }
  await enviar.click()
  await expect(page.getByText('Nota equivalente')).toBeVisible()

  const trasTest = await progresoGuardado(page)
  expect(trasTest.temas['1'].vueltas).toBe(1)

  // ── Flashcards del tema 1 ──
  await lateral(page).getByRole('link', { name: 'Temario' }).click()
  // El temario ya no lo da por "Sin estudiar".
  await expect(tema1).not.toContainText('Sin estudiar')
  await tema1.click()
  await page.getByRole('button', { name: 'Flashcards', exact: true }).click()

  const contador = page.getByText(/^\d+\/\d+$/)
  const total = Number((await contador.textContent())!.split('/')[1])
  expect(total).toBeGreaterThan(0)
  for (let i = 1; i <= total; i++) {
    await expect(contador).toHaveText(`${i}/${total}`)
    await page.getByText('Toca para ver la respuesta').click()
    await page.getByRole('button', { name: /Fácil/ }).click()
  }
  await expect(page.getByText('¡Flashcards completadas!')).toBeVisible()

  const trasFlashcards = await progresoGuardado(page)
  expect(Object.keys(trasFlashcards.flashcards)).toHaveLength(total)
  expect(trasFlashcards.temas['1'].vueltas).toBe(2) // test + vuelta de flashcards

  // ── De vuelta al dashboard: métricas actualizadas ──
  await lateral(page).getByRole('link', { name: 'Resumen' }).click()
  await expect(page).toHaveURL(/\/oposicion\/cgpc$/)
  await expect(page.getByText(/Temas estudiados\s*1 \/ 45/)).toBeVisible()

  // ── Repaso global: las recién marcadas "Fácil" no vencen hoy ──
  await lateral(page).getByRole('link', { name: 'Flashcards' }).click()
  await expect(page).toHaveURL(/\/oposicion\/cgpc\/flashcards$/)
  await expect(page.getByText('Sin flashcards pendientes hoy.')).toBeVisible()
})

test('entrar por enlace directo a otra oposición usa el progreso de esa oposición', async ({ page, supa }) => {
  supa.alta(ALUMNA, { suscripciones: ['cgpc', 'policia-local'] })
  await supa.conSesion(ALUMNA)
  // Progreso previo en CGPC (la oposición activa); Policía Local sin estrenar.
  await page.addInitScript(() => {
    if (localStorage.getItem('opodam:active-slug')) return
    localStorage.setItem('opodam:active-slug', 'cgpc')
    localStorage.setItem('opodam:cgpc:progreso', JSON.stringify({
      temas: { '1': { vueltas: 3, ultimaRevision: '2026-01-01', porcentajeAciertos: 90, teoriaLeida: true } },
    }))
  })

  await page.goto('/oposicion/policia-local/temario')
  await expect(page.getByRole('button', { name: /^1 / }).first()).toContainText('Sin estudiar')
  expect(await page.evaluate(() => localStorage.getItem('opodam:active-slug'))).toBe('policia-local')
})
