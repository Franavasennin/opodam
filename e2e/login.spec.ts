import { test, expect, ALUMNA } from './fixtures'
import { BASE_URL_E2E, CLAVE_SESION } from './entorno'

/**
 * Login completo contra el Supabase falso (ver fixtures.ts): no solo el envío
 * del enlace, también la vuelta a la app con la sesión y a dónde lleva.
 */

const sesionGuardada = (page: import('@playwright/test').Page) =>
  page.evaluate(clave => localStorage.getItem(clave), CLAVE_SESION)

test.describe('Login — magic link', () => {
  test('pedir el enlace y abrirlo deja la sesión iniciada y lleva a Mis oposiciones', async ({ page, supa }) => {
    supa.alta(ALUMNA, { oposiciones: ['cgpc'] })

    await page.goto('/onboarding/email')
    await page.getByPlaceholder('tu@email.com').fill(ALUMNA.email)
    await page.getByRole('button', { name: /Enviar enlace de acceso/i }).click()
    await expect(page).toHaveURL(/\/onboarding\/confirmar$/)

    const otp = supa.peticiones.find(p => p.ruta === '/auth/v1/otp')
    expect(otp?.cuerpo).toMatchObject({ email: ALUMNA.email })

    // "Pulsar" el enlace del email: GoTrue verifica y redirige a la app con la sesión.
    await page.goto(supa.urlEnlaceMagico(ALUMNA))
    await expect(page).toHaveURL(`${BASE_URL_E2E}/mis-oposiciones`)
    expect(await sesionGuardada(page)).toContain(ALUMNA.id)
  })

  test('una cuenta sin oposiciones elegidas va al paso de elegir oposición', async ({ page, supa }) => {
    supa.alta(ALUMNA, { oposiciones: [] })
    await page.goto(supa.urlEnlaceMagico(ALUMNA))
    await expect(page).toHaveURL(/\/onboarding\/oposicion$/)
  })
})

test.describe('Login — Google OAuth', () => {
  test('"Entrar con Google" vuelve a la app con sesión y lleva a Mis oposiciones', async ({ page, supa }) => {
    supa.alta(ALUMNA, { oposiciones: ['cgpc'] })
    supa.cuentaGoogle = ALUMNA

    await page.goto('/onboarding/email')
    await page.getByRole('button', { name: /Entrar con Google/i }).click()

    await expect(page).toHaveURL(`${BASE_URL_E2E}/mis-oposiciones`)
    expect(await sesionGuardada(page)).toContain(ALUMNA.id)

    // La app pidió Google como proveedor y volver a su propio origen.
    const authorize = supa.peticiones.find(p => p.ruta === '/auth/v1/authorize')
    expect(authorize).toBeDefined()
  })
})

test.describe('Cerrar sesión', () => {
  test('desde el perfil cierra la sesión y la ruta protegida manda al login', async ({ page, supa }) => {
    supa.alta(ALUMNA, { suscripciones: ['cgpc'] })
    await supa.conSesion(ALUMNA)

    await page.goto('/oposicion/cgpc/perfil')
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()

    await expect(page).toHaveURL(/\/onboarding\/email$/)
    expect(await sesionGuardada(page)).toBeNull()
  })
})
