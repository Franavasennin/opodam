/**
 * Constantes compartidas entre playwright.config.ts (que arranca el servidor
 * con estas VITE_*) y los fixtures (que sirven ese Supabase falso).
 */
export const PUERTO_E2E = 3100
export const BASE_URL_E2E = `http://localhost:${PUERTO_E2E}`

/** Host inexistente: toda petición a él la responde el fixture con page.route. */
export const SUPABASE_E2E_URL = 'https://e2e.supabase.co'

/** Clave donde supabase-js guarda la sesión: `sb-<ref del proyecto>-auth-token`. */
export const CLAVE_SESION = 'sb-e2e-auth-token'
