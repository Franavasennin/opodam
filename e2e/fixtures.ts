import { test as base, expect, type Page, type Request, type Route } from '@playwright/test'
import { BASE_URL_E2E, CLAVE_SESION, SUPABASE_E2E_URL } from './entorno'

/**
 * Supabase falso para los E2E.
 *
 * El servidor E2E apunta VITE_SUPABASE_URL a un host inexistente; aquí se
 * responden sus rutas con page.route:
 *  - /auth/v1/*  → usuario, OTP (magic link), authorize (Google OAuth),
 *                  verify (el enlace del email), token y logout.
 *  - /rest/v1/*  → un PostgREST mínimo en memoria (filtros eq/in, single,
 *                  maybeSingle, upsert, update) sobre `bd`.
 * Cualquier otra petición fuera de localhost se aborta (fuentes, Sentry…),
 * así un spec nunca sale a internet ni toca datos reales.
 */

type Fila = Record<string, unknown>
export type BD = Record<string, Fila[]>

export interface UsuarioE2E {
  id: string
  email: string
}

export const ALUMNA: UsuarioE2E = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'alumna@opodam.test',
}

function base64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

/** Usuario con la forma que devuelve GoTrue (/auth/v1/user). */
function usuarioGoTrue(u: UsuarioE2E, proveedor = 'email') {
  const ahora = new Date().toISOString()
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: ahora,
    phone: '',
    app_metadata: { provider: proveedor, providers: [proveedor] },
    user_metadata: {},
    identities: [],
    created_at: ahora,
    updated_at: ahora,
    is_anonymous: false,
  }
}

/** Sesión válida una hora. El JWT no va firmado: nadie lo verifica aquí. */
export function sesionPara(u: UsuarioE2E, proveedor = 'email') {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const accessToken = [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp }),
    'firma-e2e',
  ].join('.')
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: `refresh-${u.id}`,
    user: usuarioGoTrue(u, proveedor),
  }
}

/** Fragmento con el que GoTrue redirige a la app en el flujo implícito. */
function hashDeSesion(u: UsuarioE2E, proveedor: string, tipo?: string): string {
  const s = sesionPara(u, proveedor)
  const p = new URLSearchParams({
    access_token: s.access_token,
    expires_at: String(s.expires_at),
    expires_in: String(s.expires_in),
    refresh_token: s.refresh_token,
    token_type: s.token_type,
  })
  if (tipo) p.set('type', tipo)
  return `#${p.toString()}`
}

// ── PostgREST mínimo ────────────────────────────────────────────────────────

const PARAMS_NO_FILTRO = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

function valorFiltro(crudo: string): unknown {
  return crudo.replace(/^"(.*)"$/, '$1')
}

/** Traduce `col=eq.x` / `col=in.(a,b)` a un predicado sobre la fila. */
function predicado(params: URLSearchParams): (f: Fila) => boolean {
  const condiciones: ((f: Fila) => boolean)[] = []
  for (const [col, expr] of params) {
    if (PARAMS_NO_FILTRO.has(col)) continue
    const [op, ...resto] = expr.split('.')
    const arg = resto.join('.')
    if (op === 'eq') condiciones.push(f => String(f[col]) === String(valorFiltro(arg)))
    else if (op === 'in') {
      const valores = arg.replace(/^\(|\)$/g, '').split(',').map(v => String(valorFiltro(v)))
      condiciones.push(f => valores.includes(String(f[col])))
    } else throw new Error(`[supabase e2e] filtro no soportado: ${col}=${expr}`)
  }
  return f => condiciones.every(c => c(f))
}

function json(route: Route, status: number, cuerpo?: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: cuerpo === undefined ? '' : JSON.stringify(cuerpo),
  })
}

export class SupabaseFalso {
  /** Tablas en memoria. Los specs las siembran antes de navegar. */
  readonly bd: BD = { profiles: [], oposicion_subscriptions: [], progreso: [] }
  /** Peticiones recibidas (método + ruta), para aserciones. */
  readonly peticiones: { metodo: string; ruta: string; cuerpo: unknown }[] = []
  /** Usuario al que corresponde el token que presente el navegador. */
  private usuarios = new Map<string, UsuarioE2E>()
  /** Usuario al que Google "autentica" al pasar por /authorize. */
  cuentaGoogle: UsuarioE2E | null = null

  constructor(private readonly page: Page) {}

  async instalar() {
    // Registradas en este orden: Playwright evalúa primero la última.
    await this.page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.hostname === 'localhost') return route.fallback()
      return route.abort('blockedbyclient')
    })
    await this.page.route('**/.netlify/functions/**', route =>
      json(route, 503, { error: 'sin funciones en e2e' }))
    await this.page.route(`${SUPABASE_E2E_URL}/**`, route => this.responder(route))
  }

  /** Da de alta una alumna con perfil (y, si se indica, suscripciones/rol). */
  alta(u: UsuarioE2E, opts: { oposiciones?: string[]; suscripciones?: string[]; rol?: string } = {}) {
    this.usuarios.set(u.id, u)
    this.bd.profiles.push({
      id: u.id,
      email: u.email,
      oposiciones: opts.oposiciones ?? ['cgpc'],
      rol: opts.rol ?? 'trial',
      trial_start: null,
    })
    for (const slug of opts.suscripciones ?? []) {
      this.bd.oposicion_subscriptions.push({ user_id: u.id, oposicion_slug: slug, status: 'active' })
    }
    return this
  }

  /** Arranca la página ya con sesión iniciada (solo en la primera carga). */
  async conSesion(u: UsuarioE2E) {
    this.usuarios.set(u.id, u)
    await this.page.addInitScript(([clave, sesion]) => {
      if (sessionStorage.getItem('e2e:sesion-sembrada')) return
      sessionStorage.setItem('e2e:sesion-sembrada', '1')
      localStorage.setItem(clave, sesion)
    }, [CLAVE_SESION, JSON.stringify(sesionPara(u))] as const)
  }

  /** Lo que haría pulsar el enlace del email de acceso. */
  urlEnlaceMagico(u: UsuarioE2E): string {
    this.usuarios.set(u.id, u)
    const p = new URLSearchParams({ token: 'e2e', type: 'magiclink', redirect_to: `${BASE_URL_E2E}/`, email: u.email })
    return `${SUPABASE_E2E_URL}/auth/v1/verify?${p}`
  }

  private usuarioDelToken(req: Request): UsuarioE2E | null {
    const token = (req.headers()['authorization'] ?? '').replace(/^Bearer\s+/i, '')
    const partes = token.split('.')
    if (partes.length !== 3) return null
    try {
      const { sub } = JSON.parse(Buffer.from(partes[1], 'base64url').toString()) as { sub: string }
      return this.usuarios.get(sub) ?? null
    } catch { return null }
  }

  private async responder(route: Route) {
    const req = route.request()
    const url = new URL(req.url())
    const ruta = url.pathname
    const metodo = req.method()
    let cuerpo: unknown = null
    try { cuerpo = req.postDataJSON() } catch { cuerpo = req.postData() }
    this.peticiones.push({ metodo, ruta, cuerpo })

    if (metodo === 'OPTIONS') return route.fulfill({ status: 204 })
    if (ruta.startsWith('/auth/v1/')) return this.auth(route, ruta, url, cuerpo)
    if (ruta.startsWith('/rest/v1/rpc/')) return json(route, 200, 'activo')
    if (ruta.startsWith('/rest/v1/')) return this.rest(route, ruta.slice('/rest/v1/'.length), url, cuerpo)
    throw new Error(`[supabase e2e] ruta no soportada: ${metodo} ${ruta}`)
  }

  private auth(route: Route, ruta: string, url: URL, cuerpo: unknown) {
    switch (ruta) {
      case '/auth/v1/user': {
        const u = this.usuarioDelToken(route.request())
        return u ? json(route, 200, usuarioGoTrue(u)) : json(route, 401, { message: 'invalid JWT' })
      }
      case '/auth/v1/otp':
        return json(route, 200, {})
      case '/auth/v1/logout':
        return route.fulfill({ status: 204 })
      case '/auth/v1/token': {
        const refresh = (cuerpo as { refresh_token?: string } | null)?.refresh_token
        const u = [...this.usuarios.values()].find(x => refresh === `refresh-${x.id}`)
        return u ? json(route, 200, sesionPara(u)) : json(route, 400, { error: 'invalid_grant' })
      }
      case '/auth/v1/authorize': {
        // Google OAuth: GoTrue redirige a Google y Google vuelve a la app.
        // Aquí se salta Google y se vuelve directamente con la sesión.
        if (!this.cuentaGoogle) return json(route, 400, { error: 'sin cuenta de Google en el spec' })
        this.usuarios.set(this.cuentaGoogle.id, this.cuentaGoogle)
        const destino = url.searchParams.get('redirect_to') ?? `${BASE_URL_E2E}/`
        return route.fulfill({ status: 302, headers: { location: destino + hashDeSesion(this.cuentaGoogle, 'google') } })
      }
      case '/auth/v1/verify': {
        const email = url.searchParams.get('email')
        const u = [...this.usuarios.values()].find(x => x.email === email)
        if (!u) return json(route, 400, { error: 'enlace no válido' })
        const destino = url.searchParams.get('redirect_to') ?? `${BASE_URL_E2E}/`
        return route.fulfill({ status: 302, headers: { location: destino + hashDeSesion(u, 'email', 'magiclink') } })
      }
      default:
        throw new Error(`[supabase e2e] auth no soportada: ${ruta}`)
    }
  }

  private rest(route: Route, tabla: string, url: URL, cuerpo: unknown) {
    const req = route.request()
    const filas = (this.bd[tabla] ??= [])
    const coincide = predicado(url.searchParams)

    if (req.method() === 'GET' || req.method() === 'HEAD') {
      const resultado = filas.filter(coincide)
      // .single() pide un objeto: 406 si no hay exactamente una fila.
      if ((req.headers()['accept'] ?? '').includes('vnd.pgrst.object')) {
        return resultado.length === 1
          ? json(route, 200, resultado[0])
          : json(route, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })
      }
      return json(route, 200, resultado)
    }

    if (req.method() === 'POST') {
      const nuevas = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]) as Fila[]
      const claves = url.searchParams.get('on_conflict')?.split(',')
      for (const fila of nuevas) {
        const existente = claves && filas.find(f => claves.every(k => f[k] === fila[k]))
        if (existente) Object.assign(existente, fila)
        else filas.push({ ...fila })
      }
      return json(route, 201, (req.headers()['prefer'] ?? '').includes('return=representation') ? nuevas : undefined)
    }

    if (req.method() === 'PATCH') {
      filas.filter(coincide).forEach(f => Object.assign(f, cuerpo as Fila))
      return route.fulfill({ status: 204 })
    }

    throw new Error(`[supabase e2e] método no soportado: ${req.method()} ${tabla}`)
  }
}

// auto: todo spec que use este `test` corre con la red aislada, lo pida o no.
export const test = base.extend<{ supa: SupabaseFalso }>({
  supa: [async ({ page }, use) => {
    const supa = new SupabaseFalso(page)
    await supa.instalar()
    await use(supa)
  }, { auto: true }],
})

export { expect }
