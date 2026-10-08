import { defineConfig, devices } from '@playwright/test'
import { PUERTO_E2E, SUPABASE_E2E_URL } from './e2e/entorno'

/**
 * E2E con Playwright para OpoDAM.
 *
 * Servidor propio y hermético: Vite en un puerto dedicado (no reutiliza el
 * `npm run dev` de trabajo, que apunta al Supabase real de .env.local) y con
 * las variables VITE_* fijadas aquí, que tienen prioridad sobre los .env:
 *  - Supabase apunta a un host falso que los specs sirven con page.route
 *    (ver e2e/fixtures.ts): nunca se toca el backend real.
 *  - Sentry desactivado.
 * Se salta el `predev` (índice del tutor): ningún journey lo necesita.
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
    baseURL: `http://localhost:${PUERTO_E2E}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx vite --port ${PUERTO_E2E} --strictPort`,
    url: `http://localhost:${PUERTO_E2E}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: SUPABASE_E2E_URL,
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
      VITE_SENTRY_DSN: '',
    },
  },
})
