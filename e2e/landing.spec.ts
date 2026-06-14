import { test, expect } from '@playwright/test'

/**
 * Journey público: landing → onboarding (acceso).
 * No requiere sesión de Supabase. El envío de magic link se intercepta
 * para no tocar el backend real y poder verificar la navegación a "confirmar".
 */

test.describe('Landing pública', () => {
  test('muestra el hero y el CTA de acceso', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Prepara tu oposición/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar gratis/i })).toBeVisible()
  })

  test('el CTA lleva al onboarding de acceso', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Entrar gratis/i }).click()
    await expect(page).toHaveURL(/\/onboarding\/email$/)
    await expect(page.getByRole('button', { name: /Entrar con Google/i })).toBeVisible()
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible()
  })
})

test.describe('Onboarding — magic link', () => {
  test('enviar enlace navega a la pantalla de confirmación', async ({ page }) => {
    // Interceptamos el endpoint OTP de Supabase para no enviar email real.
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )

    await page.goto('/onboarding/email')
    await page.getByPlaceholder('tu@email.com').fill('e2e@opodam.test')
    await page.getByRole('button', { name: /Enviar enlace de acceso/i }).click()

    await expect(page).toHaveURL(/\/onboarding\/confirmar$/)
  })
})
