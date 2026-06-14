import { defineConfig, devices } from '@playwright/test'

/**
 * E2E con Playwright para OpoDAM.
 * Arranca el dev server de Vite (puerto 3000) y corre los journeys de `e2e/`.
 * Los unit tests viven en `tests/` (Vitest) y se excluyen aquí con testDir.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // El predev regenera el índice de búsqueda (~70s en frío); damos margen.
    timeout: 240_000,
  },
})
