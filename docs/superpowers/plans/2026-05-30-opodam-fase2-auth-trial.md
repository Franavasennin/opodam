# OpoDAM Fase 2 — Auth + Trial de 7 días Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reactivar el registro por magic link y bloquear el acceso a la app con un trial de 7 días que arranca al activar la primera oposición; al expirar, redirigir a una URL externa. Sin Stripe.

**Architecture:** El estado de acceso (`activo`/`sin-oposicion`/`expirado`) se calcula en el servidor con una función RPC de Postgres que usa `now()`, para que el reloj del cliente no pueda manipular el trial. El cliente solo lee ese estado vía Supabase y decide: renderizar, mandar a onboarding, o redirigir fuera. Los helpers puros (días restantes, decisión de ruta) se testean con Vitest; la UI se verifica manualmente.

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (auth magic link + Postgres RPC + RLS), Vitest, react-router-dom 7.

**Spec:** `docs/superpowers/specs/2026-05-30-opodam-fase2-auth-trial-design.md`

---

## Modelo de datos y contratos (referencia para todas las tareas)

**Tabla `profiles` (ya existe, se amplía):**
```
id          uuid    (PK, = auth.users.id)
email       text
oposiciones text[]
created_at  timestamptz
rol         text    default 'trial'   -- 'owner' | 'beta' | 'trial'   (NUEVA)
trial_start timestamptz               -- null hasta activar 1ª oposición (NUEVA)
```

**Tipo `EstadoAcceso`** (string union usado en todo el código):
```ts
type EstadoAcceso = 'activo' | 'sin-oposicion' | 'expirado'
```

**Reglas del helper de ruta** (función `rutaDesdeEstado`):
- `'activo'`      → `null` (renderiza hijos)
- `'sin-oposicion'` → `'/mis-oposiciones'`
- `'expirado'`    → `'EXTERNO'` (señal de redirección a `VITE_URL_EXPIRACION`)

---

## Task 1: Migración SQL en Supabase (manual del usuario)

**Files:**
- Create: `docs/sql/2026-05-30-trial.sql` (script de referencia; el usuario lo ejecuta en Supabase SQL Editor)

- [ ] **Step 1: Crear el script SQL**

Crear `docs/sql/2026-05-30-trial.sql` con este contenido exacto:

```sql
-- OpoDAM Fase 2 — columnas de trial + RPC de gating
-- Ejecutar en Supabase → SQL Editor

alter table profiles add column if not exists rol text default 'trial';
alter table profiles add column if not exists trial_start timestamptz;

-- Función de estado de acceso (verdad en el servidor)
create or replace function estado_acceso()
returns text language sql security definer as $$
  select case
    when p.rol in ('owner','beta')                  then 'activo'
    when p.trial_start is null                       then 'sin-oposicion'
    when now() < p.trial_start + interval '7 days'   then 'activo'
    else 'expirado'
  end
  from profiles p where p.id = auth.uid();
$$;

-- Permitir que el rol authenticated ejecute la función
grant execute on function estado_acceso() to authenticated;

-- Evitar que el usuario se autoascienda: la policy de UPDATE existente permite
-- actualizar la fila propia; añadimos un trigger que conserva el rol salvo service_role.
create or replace function proteger_rol()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.rol := old.rol;  -- ignora cualquier cambio de rol desde el cliente
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_rol on profiles;
create trigger trg_proteger_rol
  before update on profiles
  for each row execute function proteger_rol();
```

- [ ] **Step 2: Commit**

```bash
git add docs/sql/2026-05-30-trial.sql
git commit -m "docs: SQL migration for trial columns + estado_acceso RPC"
```

- [ ] **Step 3: ACCIÓN MANUAL DEL USUARIO**

Pedir al usuario que ejecute `docs/sql/2026-05-30-trial.sql` en Supabase → SQL Editor antes de probar las tareas siguientes en producción. No bloquea el desarrollo local (las funciones del cliente hacen fail-open).

---

## Task 2: Extender el tipo Perfil y la capa Supabase

**Files:**
- Modify: `src/types/index.ts:138-143`
- Modify: `src/services/supabase.ts`

- [ ] **Step 1: Ampliar el tipo `Perfil`**

En `src/types/index.ts`, reemplazar la interfaz `Perfil` (líneas 138-143):

```ts
export interface Perfil {
  id: string
  email: string
  oposiciones: string[]
  created_at: string
  rol?: 'owner' | 'beta' | 'trial'
  trial_start?: string | null
}
```

- [ ] **Step 2: Definir `EstadoAcceso` en types**

En `src/types/index.ts`, justo encima de `export interface Perfil`, añadir:

```ts
export type EstadoAcceso = 'activo' | 'sin-oposicion' | 'expirado'
```

- [ ] **Step 3: Añadir `estadoAcceso()` y `activarTrial()` a `supabase.ts`**

Al principio de `src/services/supabase.ts`, ampliar el import de tipos existente (línea 2 `import type { Progreso, Perfil } from '../types'`) para incluir `EstadoAcceso`:

```ts
import type { Progreso, Perfil, EstadoAcceso } from '../types'
```

Al final de `src/services/supabase.ts`, añadir:

```ts
/** Estado de acceso calculado en el servidor (RPC). Fail-open: ante error → 'activo'. */
export async function estadoAcceso(): Promise<EstadoAcceso> {
  if (!supabase) return 'activo'
  try {
    const { data, error } = await supabase.rpc('estado_acceso')
    if (error || data == null) return 'activo'
    return data as EstadoAcceso
  } catch {
    return 'activo'
  }
}

/** Marca el inicio del trial (now() del servidor) si aún no estaba marcado. */
export async function activarTrial(): Promise<void> {
  if (!supabase) return
  const user = await obtenerUsuario()
  if (!user) return
  // Solo escribe si trial_start es null, para no reiniciar la cuenta atrás
  const { data } = await supabase
    .from('profiles')
    .select('trial_start')
    .eq('id', user.id)
    .single()
  if (data && data.trial_start == null) {
    await supabase
      .from('profiles')
      .update({ trial_start: new Date().toISOString() })
      .eq('id', user.id)
  }
}
```

- [ ] **Step 4: Verificar que compila**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/supabase.ts
git commit -m "feat: estadoAcceso RPC + activarTrial + Perfil con rol/trial_start"
```

---

## Task 3: Helpers puros de suscripción (con tests)

**Files:**
- Create: `src/services/suscripcion.ts`
- Test: `src/services/suscripcion.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/services/suscripcion.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { diasRestantes, rutaDesdeEstado } from './suscripcion'

describe('diasRestantes', () => {
  it('devuelve 7 el mismo día de inicio', () => {
    const ahora = new Date('2026-05-30T12:00:00Z')
    expect(diasRestantes('2026-05-30T12:00:00Z', ahora)).toBe(7)
  })
  it('redondea hacia arriba los días parciales', () => {
    const ahora = new Date('2026-06-02T18:00:00Z') // 3.25 días pasados
    expect(diasRestantes('2026-05-30T12:00:00Z', ahora)).toBe(4) // 7 - 3.25 = 3.75 → ceil 4
  })
  it('devuelve 0 cuando ya expiró', () => {
    const ahora = new Date('2026-06-10T12:00:00Z')
    expect(diasRestantes('2026-05-30T12:00:00Z', ahora)).toBe(0)
  })
  it('devuelve null si no hay trial_start', () => {
    expect(diasRestantes(null, new Date())).toBeNull()
  })
})

describe('rutaDesdeEstado', () => {
  it('activo → null (renderiza)', () => {
    expect(rutaDesdeEstado('activo')).toBeNull()
  })
  it('sin-oposicion → /mis-oposiciones', () => {
    expect(rutaDesdeEstado('sin-oposicion')).toBe('/mis-oposiciones')
  })
  it('expirado → EXTERNO', () => {
    expect(rutaDesdeEstado('expirado')).toBe('EXTERNO')
  })
})
```

- [ ] **Step 2: Ejecutar el test para verlo fallar**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx vitest run src/services/suscripcion.test.ts`
Expected: FAIL — "Failed to resolve import './suscripcion'".

- [ ] **Step 3: Implementar `suscripcion.ts`**

Crear `src/services/suscripcion.ts`:

```ts
import type { EstadoAcceso } from '../types'

const DIAS_TRIAL = 7
const MS_DIA = 24 * 60 * 60 * 1000

/**
 * Días enteros restantes de trial (redondeo hacia arriba). Solo para el banner.
 * El gating real lo decide el servidor vía estadoAcceso().
 * @returns número de días (>=0) o null si no hay trial_start.
 */
export function diasRestantes(trialStart: string | null, ahora: Date = new Date()): number | null {
  if (!trialStart) return null
  const fin = new Date(trialStart).getTime() + DIAS_TRIAL * MS_DIA
  const restanteMs = fin - ahora.getTime()
  if (restanteMs <= 0) return 0
  return Math.ceil(restanteMs / MS_DIA)
}

/**
 * Decide a dónde ir según el estado de acceso.
 * @returns null = renderiza hijos; '/mis-oposiciones' = redirige interno;
 *          'EXTERNO' = redirige a VITE_URL_EXPIRACION.
 */
export function rutaDesdeEstado(estado: EstadoAcceso): string | null {
  switch (estado) {
    case 'activo':         return null
    case 'sin-oposicion':  return '/mis-oposiciones'
    case 'expirado':       return 'EXTERNO'
  }
}
```

- [ ] **Step 4: Ejecutar el test para verlo pasar**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx vitest run src/services/suscripcion.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/suscripcion.ts src/services/suscripcion.test.ts
git commit -m "feat: helpers puros de trial (diasRestantes, rutaDesdeEstado) + tests"
```

---

## Task 4: Componente BannerTrial

**Files:**
- Create: `src/components/ui/BannerTrial.tsx`

- [ ] **Step 1: Implementar el banner**

Crear `src/components/ui/BannerTrial.tsx`:

```tsx
import { diasRestantes } from '../../services/suscripcion'

/**
 * Banner informativo de cuenta atrás del trial.
 * Solo se muestra si hay trial_start (rol trial). El gating real es del servidor.
 */
export function BannerTrial({ trialStart, rol }: { trialStart: string | null; rol?: string }) {
  if (rol === 'owner' || rol === 'beta') return null
  const dias = diasRestantes(trialStart)
  if (dias == null) return null

  return (
    <div
      style={{
        margin: '0 16px 12px', padding: '10px 14px', borderRadius: 12,
        background: 'var(--accent-soft)', color: 'var(--accent)',
        fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span>⏳</span>
      <span>
        {dias > 0
          ? `Te quedan ${dias} ${dias === 1 ? 'día' : 'días'} de prueba`
          : 'Tu prueba ha terminado'}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/BannerTrial.tsx
git commit -m "feat: componente BannerTrial (cuenta atrás informativa)"
```

---

## Task 5: Gating real en RutaProtegida

**Files:**
- Modify: `src/components/layout/RutaProtegida.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Añadir la variable de entorno de ejemplo**

En `.env.example`, añadir la línea:

```
VITE_URL_EXPIRACION=https://opodam.vercel.app/precios
```

- [ ] **Step 2: Reemplazar `RutaProtegida.tsx` con el gating real**

Reemplazar todo el contenido de `src/components/layout/RutaProtegida.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { obtenerUsuario, estadoAcceso } from '../../services/supabase'
import { rutaDesdeEstado } from '../../services/suscripcion'

type Fase = 'cargando' | 'render' | 'onboarding' | 'interno' | 'externo'

const URL_EXPIRACION =
  (import.meta.env.VITE_URL_EXPIRACION as string | undefined) ??
  'https://opodam.vercel.app/precios'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [fase, setFase] = useState<Fase>('cargando')

  useEffect(() => {
    let activo = true
    ;(async () => {
      const user = await obtenerUsuario()
      // Sin sesión, o sesión anónima (sin email) → registro obligatorio
      if (!user || user.is_anonymous || !user.email) {
        if (activo) setFase('onboarding')
        return
      }
      const estado = await estadoAcceso()
      const ruta = rutaDesdeEstado(estado)
      if (!activo) return
      if (ruta == null) setFase('render')
      else if (ruta === 'EXTERNO') setFase('externo')
      else setFase('interno')
    })()
    return () => { activo = false }
  }, [])

  if (fase === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span style={{ color: 'var(--mute)', fontSize: 14 }}>Cargando…</span>
      </div>
    )
  }
  if (fase === 'onboarding') return <Navigate to="/onboarding/email" replace />
  if (fase === 'interno')    return <Navigate to="/mis-oposiciones" replace />
  if (fase === 'externo')    { window.location.href = URL_EXPIRACION; return null }
  return <>{children}</>
}
```

Nota: si en `/mis-oposiciones` el estado es `'sin-oposicion'`, `rutaDesdeEstado` devuelve `/mis-oposiciones` (la propia ruta) → React Router no hace bucle porque `Navigate` a la ruta actual es idempotente, pero para evitar parpadeo, `MisOposiciones` se considera accesible con `'sin-oposicion'`: ver Task 6, Step 3 (no se envuelve `/mis-oposiciones` con el gating de trial, solo con el de sesión).

- [ ] **Step 3: Verificar que compila**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/RutaProtegida.tsx .env.example
git commit -m "feat: gating real en RutaProtegida (sesión + estado de trial)"
```

---

## Task 6: Reactivar onboarding, separar gating de sesión vs trial, quitar sesión anónima

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/RutaProtegida.tsx`

- [ ] **Step 1: Crear una guardia de solo-sesión para /mis-oposiciones**

En `src/components/layout/RutaProtegida.tsx`, añadir al final un componente que solo exige sesión con email (sin comprobar trial), para usar en `/mis-oposiciones` y evitar el bucle de redirección:

```tsx
export function RutaConSesion({ children }: { children: React.ReactNode }) {
  const [fase, setFase] = useState<'cargando' | 'onboarding' | 'render'>('cargando')
  useEffect(() => {
    let activo = true
    ;(async () => {
      const user = await obtenerUsuario()
      if (!activo) return
      setFase(!user || user.is_anonymous || !user.email ? 'onboarding' : 'render')
    })()
    return () => { activo = false }
  }, [])
  if (fase === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span style={{ color: 'var(--mute)', fontSize: 14 }}>Cargando…</span>
      </div>
    )
  }
  if (fase === 'onboarding') return <Navigate to="/onboarding/email" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: Reactivar imports y rutas de onboarding en App.tsx**

En `src/App.tsx`, sustituir el bloque comentado `// AUTH DESACTIVADO` (líneas 25-28) por imports reales:

```tsx
import OnboardingEmail from './pages/onboarding/OnboardingEmail'
import OnboardingConfirmar from './pages/onboarding/OnboardingConfirmar'
import OnboardingOposicion from './pages/onboarding/OnboardingOposicion'
```

- [ ] **Step 3: Importar `RutaConSesion` y usarla en /mis-oposiciones**

En `src/App.tsx`, línea 3, ampliar el import:

```tsx
import { RutaProtegida, RutaConSesion } from './components/layout/RutaProtegida'
```

Y reemplazar la ruta `/mis-oposiciones` (línea 93) para que use `RutaConSesion` (solo sesión, sin gating de trial):

```tsx
<Route path="/mis-oposiciones" element={<RutaConSesion><MisOposiciones /></RutaConSesion>} />
```

- [ ] **Step 4: Montar las rutas de onboarding**

En `src/App.tsx`, dentro de `<Routes>`, justo después de la ruta `/auth/callback` (línea 87), añadir:

```tsx
<Route path="/onboarding/email" element={<OnboardingEmail />} />
<Route path="/onboarding/confirmar" element={<OnboardingConfirmar />} />
<Route path="/onboarding/oposicion" element={<OnboardingOposicion />} />
```

- [ ] **Step 5: Quitar el arranque de sesión anónima**

En `src/App.tsx`, en el `useEffect` (líneas 67-79), reemplazar todo el cuerpo:

```tsx
  useEffect(() => {
    sincronizar().catch(() => { /* sin conexión, ignorar */ })
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      sincronizar().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
```

- [ ] **Step 6: Quitar el import sin usar**

En `src/App.tsx`, eliminar la línea 6: `import { iniciarSesionAnonima } from './services/supabase'`.

- [ ] **Step 7: Verificar que compila**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/components/layout/RutaProtegida.tsx
git commit -m "feat: reactivar onboarding, RutaConSesion para /mis-oposiciones, sin sesión anónima"
```

---

## Task 7: Activar el trial al entrar en una oposición

**Files:**
- Modify: `src/pages/MisOposiciones.tsx:20-23`

- [ ] **Step 1: Llamar a `activarTrial` al entrar**

En `src/pages/MisOposiciones.tsx`, añadir el import al principio (junto a los demás):

```tsx
import { activarTrial } from '../services/supabase'
```

Y reemplazar `handleEntrar` (líneas 20-23):

```tsx
  async function handleEntrar(slug: string) {
    setActiveSlug(slug)
    activarTrial().catch(() => { /* fail-open: no bloquea la navegación */ })
    navigate(`/oposicion/${slug}`)
  }
```

- [ ] **Step 2: Verificar que compila**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MisOposiciones.tsx
git commit -m "feat: activar trial (trial_start) al entrar en una oposición"
```

---

## Task 8: Mostrar el banner de trial en el dashboard de oposición

**Files:**
- Modify: `src/pages/OposicionDashboard.tsx`

- [ ] **Step 1: Leer el perfil y renderizar el banner**

Leer primero el archivo para ubicar el contenedor principal y los imports existentes de React.

En `src/pages/OposicionDashboard.tsx`, añadir imports (sin duplicar `useEffect`/`useState` si ya existen):

```tsx
import { useEffect, useState } from 'react'
import { obtenerPerfil } from '../services/supabase'
import { BannerTrial } from '../components/ui/BannerTrial'
import type { Perfil } from '../types'
```

Dentro del componente, añadir el estado y la carga:

```tsx
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  useEffect(() => { obtenerPerfil().then(setPerfil) }, [])
```

Y en el JSX, como primer elemento dentro del contenedor principal de la página, añadir:

```tsx
  {perfil && <BannerTrial trialStart={perfil.trial_start ?? null} rol={perfil.rol} />}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/OposicionDashboard.tsx
git commit -m "feat: banner de cuenta atrás del trial en el dashboard de oposición"
```

---

## Task 9: Verificación final

**Files:** Ninguno — solo verificación.

- [ ] **Step 1: Suite de tests completa**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npm run test:run`
Expected: todos los tests previos PASAN + los 7 nuevos de `suscripcion.test.ts`. Ningún test roto.

- [ ] **Step 2: Build de producción**

Run: `cd "C:\Users\Apari\Proyecto claude\opodam" && npm run build`
Expected: `✓ built` sin errores TypeScript.

- [ ] **Step 3: Verificación manual (requiere SQL de Task 1 ejecutado + env vars en Supabase/Vercel)**

Checklist a verificar a mano en `npm run dev`:
1. Sin sesión → ruta protegida (p.ej. `/oposicion/cgpc`) redirige a `/onboarding/email`.
2. Tras magic link (usuario con email) y sin oposición → `/mis-oposiciones` accesible.
3. Al entrar en una oposición → se graba `trial_start` (comprobar en Supabase Table Editor).
4. Dashboard de oposición muestra "Te quedan 7 días de prueba".
5. Usuario con `rol='beta'` (puesto a mano en Supabase) → sin banner, acceso total.
6. Simular expiración: poner `trial_start` a hace 8 días en Supabase → al recargar una ruta de oposición, redirige a `VITE_URL_EXPIRACION`.

- [ ] **Step 4: Commit final**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
git add -A
git commit -m "feat: Fase 2 completa — auth obligatorio + trial de 7 días 🔐"
```
