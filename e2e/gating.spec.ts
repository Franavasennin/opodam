import { test, expect, ALUMNA } from './fixtures'

// BannerPaywall se monta dos veces (maquetación móvil y escritorio): se mira
// solo el que está visible en la ventana del test.
const paywall = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /Suscribirme ahora/i }).filter({ visible: true })

/**
 * Gating por suscripción (RutaConSesion / RutaOposicion en App.tsx).
 * El dashboard y el perfil solo piden sesión; el contenido de la oposición
 * pide además suscripción activa (o rol owner/beta).
 */

test.describe('Sin sesión', () => {
  for (const ruta of ['/mis-oposiciones', '/oposicion/cgpc', '/oposicion/cgpc/tests']) {
    test(`${ruta} manda al login`, async ({ page }) => {
      await page.goto(ruta)
      await expect(page).toHaveURL(/\/onboarding\/email$/)
    })
  }
})

test.describe('Con sesión y sin suscripción', () => {
  test.beforeEach(async ({ supa }) => {
    supa.alta(ALUMNA)
    await supa.conSesion(ALUMNA)
  })

  test('el contenido redirige al dashboard con el paywall', async ({ page }) => {
    await page.goto('/oposicion/cgpc/tests')
    await expect(page).toHaveURL(/\/oposicion\/cgpc\?paywall=1$/)
    await expect(paywall(page)).toBeVisible()
  })

  test('el dashboard es accesible sin pagar y muestra el paywall', async ({ page }) => {
    await page.goto('/oposicion/cgpc')
    await expect(page).toHaveURL(/\/oposicion\/cgpc$/)
    await expect(paywall(page)).toBeVisible()
    await expect(page.getByText('19,90 €').filter({ visible: true })).toBeVisible()
  })
})

test.describe('Con suscripción', () => {
  test('a su oposición: entra al contenido y no ve el paywall', async ({ page, supa }) => {
    supa.alta(ALUMNA, { suscripciones: ['cgpc'] })
    await supa.conSesion(ALUMNA)

    await page.goto('/oposicion/cgpc/tests')
    await expect(page).toHaveURL(/\/oposicion\/cgpc\/tests$/)
    await expect(page.getByText(/Elige un tema o haz un/)).toBeVisible()

    // Tras recargar, esperar a que el dashboard sepa el acceso: si no, "0
    // banners" pasaría también mientras aún está consultando.
    const consulta = page.waitForResponse(r => r.url().includes('/rest/v1/oposicion_subscriptions'))
    await page.goto('/oposicion/cgpc')
    await consulta
    await expect(page.getByRole('button', { name: /Suscribirme ahora/i })).toHaveCount(0)
  })

  test('a otra oposición: su contenido sigue cerrado', async ({ page, supa }) => {
    supa.alta(ALUMNA, { suscripciones: ['cgpc'] })
    await supa.conSesion(ALUMNA)

    await page.goto('/oposicion/policia-local/temario')
    await expect(page).toHaveURL(/\/oposicion\/policia-local\?paywall=1$/)
  })
})

test.describe('Roles con acceso ilimitado', () => {
  for (const rol of ['owner', 'beta']) {
    test(`${rol} entra al contenido sin suscripción`, async ({ page, supa }) => {
      supa.alta(ALUMNA, { rol })
      await supa.conSesion(ALUMNA)

      await page.goto('/oposicion/guardia-civil/tests')
      await expect(page).toHaveURL(/\/oposicion\/guardia-civil\/tests$/)
      await expect(page.getByText(/Elige un tema o haz un/)).toBeVisible()
    })
  }
})
