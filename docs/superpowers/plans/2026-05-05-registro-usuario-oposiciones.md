# Registro de Usuario y Selección de Oposiciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mandatory user registration (Supabase magic link) and multi-oposición selection so OpoDAM can scale to multiple exams while keeping each user's progress isolated by oposición.

**Architecture:** New Supabase `profiles` table stores user email + chosen oposición slugs. A `RutaProtegida` guard component checks session + profile on every protected route, redirecting to the appropriate onboarding step when either is missing. Active oposición slug stored in `localStorage['opodam:active-slug']`; all progress keys are namespaced `opodam:<slug>:progreso` so each oposición has independent progress.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS, Supabase JS v2, React Router v7, Vitest + @testing-library/react

---

### Task 1: Supabase — crear tabla `profiles` y políticas RLS

**Files:**
- Create: `supabase/migrations/20260505_profiles.sql`

- [ ] **Step 1: Crear el archivo de migración SQL**

```sql
-- supabase/migrations/20260505_profiles.sql
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  oposiciones text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Usuario puede ver su perfil"
  on profiles for select using (auth.uid() = id);

create policy "Usuario puede crear su perfil"
  on profiles for insert with check (auth.uid() = id);

create policy "Usuario puede actualizar su perfil"
  on profiles for update using (auth.uid() = id);
```

- [ ] **Step 2: Aplicar la migración en Supabase**

Ejecuta en el Dashboard SQL de Supabase (o con `supabase db push` si tienes CLI):
```
Abre https://supabase.com/dashboard → SQL Editor → pega el contenido del archivo → Run
```
Verifica que la tabla `profiles` aparece en Table Editor con las 4 columnas.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260505_profiles.sql
git commit -m "feat: add profiles table with RLS policies"
```

---

### Task 2: Mover JSONs de CGPC a subcarpeta y actualizar el barrel

**Files:**
- Move: `src/data/topics/*.json` → `src/data/topics/cgpc/*.json`
- Create: `src/data/topics/cgpc/index.ts`
- Modify: `src/data/topics/index.ts` (convertir en re-export barrel)

- [ ] **Step 1: Verificar qué archivos JSON existen actualmente**

```bash
ls src/data/topics/*.json
```
Esperado: `tema-01.json` … `tema-45.json`

- [ ] **Step 2: Crear la carpeta `cgpc` y mover los JSONs**

```bash
mkdir -p src/data/topics/cgpc
mv src/data/topics/tema-*.json src/data/topics/cgpc/
```

- [ ] **Step 3: Crear `src/data/topics/cgpc/index.ts`**

Contenido idéntico al `index.ts` actual pero con imports ajustados:

```ts
// src/data/topics/cgpc/index.ts
export interface TemaMeta {
  id: string
  titulo: string
  descripcion: string
}

export const TEMAS_META: TemaMeta[] = [
  { id: 'tema-01', titulo: 'Tema 1. La Constitución Española de 1978', descripcion: 'Características, estructura y principios fundamentales' },
  { id: 'tema-02', titulo: 'Tema 2. Derechos y libertades fundamentales', descripcion: 'Derechos, deberes y garantías constitucionales' },
  { id: 'tema-03', titulo: 'Tema 3. La Corona y las Cortes Generales', descripcion: 'Institución monárquica y poder legislativo' },
  { id: 'tema-04', titulo: 'Tema 4. El Gobierno y la Administración del Estado', descripcion: 'Poder ejecutivo y estructura administrativa' },
  { id: 'tema-05', titulo: 'Tema 5. El Poder Judicial', descripcion: 'Organización judicial y Tribunal Constitucional' },
  { id: 'tema-06', titulo: 'Tema 6. La organización territorial del Estado', descripcion: 'Comunidades Autónomas y administración local' },
  { id: 'tema-07', titulo: 'Tema 7. El Estatuto de Autonomía de Canarias', descripcion: 'Instituciones y competencias autonómicas canarias' },
  { id: 'tema-08', titulo: 'Tema 8. La Administración Pública', descripcion: 'Principios y organización de la Administración' },
  { id: 'tema-09', titulo: 'Tema 9. El acto administrativo', descripcion: 'Concepto, elementos, eficacia e invalidez' },
  { id: 'tema-10', titulo: 'Tema 10. El procedimiento administrativo', descripcion: 'Fases, plazos y recursos' },
  { id: 'tema-11', titulo: 'Tema 11. La responsabilidad patrimonial', descripcion: 'Responsabilidad de la Administración Pública' },
  { id: 'tema-12', titulo: 'Tema 12. Los contratos del sector público', descripcion: 'Tipos, licitación y ejecución' },
  { id: 'tema-13', titulo: 'Tema 13. Los bienes de las Administraciones Públicas', descripcion: 'Dominio público y patrimonio privado' },
  { id: 'tema-14', titulo: 'Tema 14. La función pública', descripcion: 'Régimen jurídico de los empleados públicos' },
  { id: 'tema-15', titulo: 'Tema 15. La Ley Orgánica de Fuerzas y Cuerpos de Seguridad', descripcion: 'LOFCS: principios, estructura y funciones' },
  { id: 'tema-16', titulo: 'Tema 16. La Policía Canaria. Ley 9/2007', descripcion: 'Régimen jurídico del Cuerpo General de la Policía Canaria' },
  { id: 'tema-17', titulo: 'Tema 17. Régimen disciplinario de la Policía Canaria', descripcion: 'Infracciones, sanciones y procedimiento disciplinario' },
  { id: 'tema-18', titulo: 'Tema 18. Deontología policial', descripcion: 'Código de conducta y ética policial' },
  { id: 'tema-19', titulo: 'Tema 19. Seguridad vial y legislación de tráfico', descripcion: 'Normas de circulación y sanciones' },
  { id: 'tema-20', titulo: 'Tema 20. Ley de Seguridad Ciudadana', descripcion: 'Ley Orgánica 4/2015 de protección de la seguridad ciudadana' },
  { id: 'tema-21', titulo: 'Tema 21. El Código Penal I', descripcion: 'Delitos contra las personas' },
  { id: 'tema-22', titulo: 'Tema 22. El Código Penal II', descripcion: 'Delitos contra la propiedad y el orden público' },
  { id: 'tema-23', titulo: 'Tema 23. La Ley de Enjuiciamiento Criminal', descripcion: 'Proceso penal, detención y medidas cautelares' },
  { id: 'tema-24', titulo: 'Tema 24. Violencia de género', descripcion: 'LO 1/2004 y protocolos de actuación policial' },
  { id: 'tema-25', titulo: 'Tema 25. Protección de menores', descripcion: 'Legislación de protección del menor y actuación policial' },
  { id: 'tema-26', titulo: 'Tema 26. Extranjería e inmigración', descripcion: 'Régimen de extranjería y control de fronteras' },
  { id: 'tema-27', titulo: 'Tema 27. Protección de datos personales', descripcion: 'RGPD y LOPDGDD aplicados a la actividad policial' },
  { id: 'tema-28', titulo: 'Tema 28. Prevención de riesgos laborales', descripcion: 'Seguridad y salud en el trabajo policial' },
  { id: 'tema-29', titulo: 'Tema 29. Igualdad y no discriminación', descripcion: 'LO 3/2007 y perspectiva de género en la policía' },
  { id: 'tema-30', titulo: 'Tema 30. Mediación y resolución de conflictos', descripcion: 'Técnicas de mediación y gestión de conflictos' },
  { id: 'tema-31', titulo: 'Tema 31. Psicología aplicada a la función policial', descripcion: 'Comunicación, estrés y toma de decisiones' },
  { id: 'tema-32', titulo: 'Tema 32. Primeros auxilios', descripcion: 'Actuaciones básicas de socorro y RCP' },
  { id: 'tema-33', titulo: 'Tema 33. Topografía y cartografía policial', descripcion: 'Orientación, mapas y sistemas de coordenadas' },
  { id: 'tema-34', titulo: 'Tema 34. Armamento y uso de la fuerza', descripcion: 'Legislación y protocolo de uso de armas' },
  { id: 'tema-35', titulo: 'Tema 35. Defensa personal policial', descripcion: 'Técnicas de inmovilización y reducción' },
  { id: 'tema-36', titulo: 'Tema 36. Protección civil y emergencias', descripcion: 'Sistema de protección civil en Canarias' },
  { id: 'tema-37', titulo: 'Tema 37. Medio ambiente y legislación ambiental', descripcion: 'Delitos ambientales y actuación policial' },
  { id: 'tema-38', titulo: 'Tema 38. Turismo y seguridad', descripcion: 'Especificidades de la seguridad en zonas turísticas' },
  { id: 'tema-39', titulo: 'Tema 39. Drogas y sustancias psicoactivas', descripcion: 'Legislación antidrogas y actuación policial' },
  { id: 'tema-40', titulo: 'Tema 40. Ciberdelincuencia', descripcion: 'Delitos informáticos y evidencias digitales' },
  { id: 'tema-41', titulo: 'Tema 41. Crimen organizado y terrorismo', descripcion: 'Marcos legislativos y coordinación de fuerzas' },
  { id: 'tema-42', titulo: 'Tema 42. Atestados y documentación policial', descripcion: 'Elaboración de atestados e informes policiales' },
  { id: 'tema-43', titulo: 'Tema 43. Inglés aplicado a la función policial', descripcion: 'Vocabulario y frases para situaciones policiales' },
  { id: 'tema-44', titulo: 'Tema 44. Geografía e historia de Canarias', descripcion: 'Territorio, población y evolución histórica' },
  { id: 'tema-45', titulo: 'Tema 45. Instituciones y servicios públicos de Canarias', descripcion: 'Gobierno, Cabildos, Ayuntamientos y servicios esenciales' },
]

export const TOTAL_TEMAS = TEMAS_META.length

export async function cargarTema(id: string) {
  const fileName = id
  const data = await import(`./${fileName}.json`)
  return data.default
}
```

- [ ] **Step 4: Reemplazar `src/data/topics/index.ts` por barrel de re-export**

```ts
// src/data/topics/index.ts
export { TEMAS_META, TOTAL_TEMAS, cargarTema } from './cgpc/index'
export type { TemaMeta } from './cgpc/index'
```

- [ ] **Step 5: Verificar que el build sigue funcionando**

```bash
npm run build
```
Esperado: sin errores. Si aparece "Cannot find module", revisar que todos los JSONs están en `src/data/topics/cgpc/`.

- [ ] **Step 6: Commit**

```bash
git add src/data/topics/
git commit -m "refactor: move CGPC topics to src/data/topics/cgpc/ subfolder"
```

---

### Task 3: Catálogo de oposiciones

**Files:**
- Create: `src/data/oposiciones.ts`

- [ ] **Step 1: Escribir el archivo**

```ts
// src/data/oposiciones.ts
export interface Oposicion {
  slug: string
  nombre: string
  descripcion: string
  disponible: boolean
  color: string
  numTemas?: number
}

export const OPOSICIONES: Oposicion[] = [
  {
    slug: 'cgpc',
    nombre: 'Policía Canaria (CGPC)',
    descripcion: 'Cuerpo General de la Policía Canaria',
    disponible: true,
    color: '#2563eb',
    numTemas: 45,
  },
  {
    slug: 'aux-enfermeria',
    nombre: 'Auxiliar de Enfermería',
    descripcion: 'Servicio Canario de Salud',
    disponible: false,
    color: '#0891b2',
  },
  {
    slug: 'aux-judicial',
    nombre: 'Auxiliar Judicial',
    descripcion: 'Administración de Justicia',
    disponible: false,
    color: '#7c3aed',
  },
  {
    slug: 'tramitacion-judicial',
    nombre: 'Tramitación Judicial',
    descripcion: 'Administración de Justicia',
    disponible: false,
    color: '#b45309',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/oposiciones.ts
git commit -m "feat: add oposiciones catalog"
```

---

### Task 4: Tipo `Perfil` y funciones Supabase de perfil

**Files:**
- Modify: `src/types/index.ts` — añadir interfaz `Perfil`
- Modify: `src/services/supabase.ts` — añadir `obtenerPerfil` y `crearPerfil`

- [ ] **Step 1: Leer `src/types/index.ts`**

Abre el archivo y confirma las interfaces existentes (no sobreescribir nada).

- [ ] **Step 2: Añadir interfaz `Perfil` al final de `src/types/index.ts`**

```ts
export interface Perfil {
  id: string
  email: string
  oposiciones: string[]
  created_at: string
}
```

- [ ] **Step 3: Leer `src/services/supabase.ts`**

Confirma las importaciones y el cliente `supabase` existente.

- [ ] **Step 4: Añadir `obtenerPerfil` y `crearPerfil` al final de `src/services/supabase.ts`**

```ts
import type { Perfil } from '../types'

// --- Perfil de usuario ---

export async function obtenerPerfil(): Promise<Perfil | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null
  return data as Perfil
}

export async function crearPerfil(oposiciones: string[]): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No hay sesión activa' }

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? '',
    oposiciones,
  })

  return { error: error ? error.message : null }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/supabase.ts
git commit -m "feat: add Perfil type and obtenerPerfil/crearPerfil to supabase service"
```

---

### Task 5: Storage con slug activo y migración de progreso

**Files:**
- Modify: `src/services/storage.ts`
- Create: `src/services/storage.test.ts`

- [ ] **Step 1: Escribir el test PRIMERO (`src/services/storage.test.ts`)**

```ts
// src/services/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getActiveSlug,
  setActiveSlug,
  getProgresoKey,
  migrarProgresoLegado,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('getActiveSlug', () => {
  it('returns "cgpc" by default when nothing is stored', () => {
    expect(getActiveSlug()).toBe('cgpc')
  })

  it('returns the stored slug after setActiveSlug', () => {
    setActiveSlug('aux-enfermeria')
    expect(getActiveSlug()).toBe('aux-enfermeria')
  })
})

describe('getProgresoKey', () => {
  it('returns namespaced key for active slug', () => {
    setActiveSlug('cgpc')
    expect(getProgresoKey()).toBe('opodam:cgpc:progreso')
  })

  it('uses passed slug when provided', () => {
    expect(getProgresoKey('aux-judicial')).toBe('opodam:aux-judicial:progreso')
  })
})

describe('migrarProgresoLegado', () => {
  it('does nothing when legacy key does not exist', () => {
    migrarProgresoLegado()
    expect(localStorage.getItem('opodam:cgpc:progreso')).toBeNull()
  })

  it('copies legacy opodam:progreso to opodam:cgpc:progreso and removes old key', () => {
    const legacyData = JSON.stringify({ 'tema-01': { completado: true } })
    localStorage.setItem('opodam:progreso', legacyData)
    migrarProgresoLegado()
    expect(localStorage.getItem('opodam:cgpc:progreso')).toBe(legacyData)
    expect(localStorage.getItem('opodam:progreso')).toBeNull()
  })

  it('does not overwrite existing cgpc progress if both keys exist', () => {
    const existing = JSON.stringify({ 'tema-02': { completado: true } })
    localStorage.setItem('opodam:cgpc:progreso', existing)
    localStorage.setItem('opodam:progreso', JSON.stringify({ 'tema-01': { completado: true } }))
    migrarProgresoLegado()
    expect(localStorage.getItem('opodam:cgpc:progreso')).toBe(existing)
    expect(localStorage.getItem('opodam:progreso')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar el test para confirmar que falla**

```bash
npx vitest run src/services/storage.test.ts
```
Esperado: FAIL — funciones no definidas.

- [ ] **Step 3: Leer `src/services/storage.ts` actual**

Abre el archivo para ver `PROGRESO_KEY`, `getProgreso`, `saveProgreso`, etc.

- [ ] **Step 4: Actualizar `src/services/storage.ts` con las nuevas funciones**

Mantén todas las funciones existentes pero cambia `PROGRESO_KEY` para que sea dinámico:

```ts
// src/services/storage.ts
const ACTIVE_SLUG_KEY = 'opodam:active-slug'
const DEFAULT_SLUG = 'cgpc'
const LEGACY_PROGRESO_KEY = 'opodam:progreso'

export function getActiveSlug(): string {
  return localStorage.getItem(ACTIVE_SLUG_KEY) ?? DEFAULT_SLUG
}

export function setActiveSlug(slug: string): void {
  localStorage.setItem(ACTIVE_SLUG_KEY, slug)
}

export function getProgresoKey(slug?: string): string {
  return `opodam:${slug ?? getActiveSlug()}:progreso`
}

export function migrarProgresoLegado(): void {
  const legacy = localStorage.getItem(LEGACY_PROGRESO_KEY)
  if (!legacy) return
  const newKey = getProgresoKey('cgpc')
  if (!localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacy)
  }
  localStorage.removeItem(LEGACY_PROGRESO_KEY)
}

// --- Funciones existentes actualizadas para usar clave dinámica ---

export function getProgreso() {
  const raw = localStorage.getItem(getProgresoKey())
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export function saveProgreso(progreso: Record<string, unknown>): void {
  localStorage.setItem(getProgresoKey(), JSON.stringify(progreso))
}
```

> **Nota:** Si `storage.ts` tiene funciones adicionales (flashcards, tests, etc.), mantenlas pero asegúrate de que las que llaman a `PROGRESO_KEY` ahora llamen a `getProgresoKey()`.

- [ ] **Step 5: Ejecutar el test para confirmar que pasa**

```bash
npx vitest run src/services/storage.test.ts
```
Esperado: PASS — 7 tests.

- [ ] **Step 6: Verificar que el build global no se rompe**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/services/storage.ts src/services/storage.test.ts
git commit -m "feat: add active slug storage and legacy progress migration with tests"
```

---

### Task 6: Componente `RutaProtegida`

**Files:**
- Create: `src/components/layout/RutaProtegida.tsx`

- [ ] **Step 1: Escribir el componente**

```tsx
// src/components/layout/RutaProtegida.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { obtenerUsuario } from '../../services/supabase'
import { obtenerPerfil } from '../../services/supabase'
import { migrarProgresoLegado } from '../../services/storage'

type Estado = 'cargando' | 'sin-sesion' | 'sin-perfil' | 'ok'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    async function verificar() {
      const usuario = await obtenerUsuario()
      if (!usuario) { setEstado('sin-sesion'); return }

      const perfil = await obtenerPerfil()
      if (!perfil || perfil.oposiciones.length === 0) { setEstado('sin-perfil'); return }

      migrarProgresoLegado()
      setEstado('ok')
    }
    verificar()
  }, [])

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Cargando...</div>
      </div>
    )
  }

  if (estado === 'sin-sesion') return <Navigate to="/onboarding/email" replace />
  if (estado === 'sin-perfil') return <Navigate to="/onboarding/oposicion" replace />

  return <>{children}</>
}
```

- [ ] **Step 2: Verificar que el archivo compila (sin errores de TypeScript)**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/RutaProtegida.tsx
git commit -m "feat: add RutaProtegida route guard component"
```

---

### Task 7: Página `OnboardingEmail`

**Files:**
- Create: `src/pages/onboarding/OnboardingEmail.tsx`

- [ ] **Step 1: Escribir la página**

```tsx
// src/pages/onboarding/OnboardingEmail.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enviarMagicLink } from '../../services/supabase'

export default function OnboardingEmail() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setCargando(true)
    setError(null)
    const { error: err } = await enviarMagicLink(email.trim())
    setCargando(false)
    if (err) {
      setError('No se pudo enviar el enlace. Comprueba el email e inténtalo de nuevo.')
      return
    }
    navigate('/onboarding/confirmar', { state: { email } })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-6 text-center text-white">
          <div className="text-4xl mb-1">📘</div>
          <div className="font-bold text-lg">OpoDAM</div>
          <div className="text-sm opacity-80">Prepara tu oposición</div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="flex gap-1 justify-center mb-4">
            <div className="h-1.5 w-6 bg-blue-600 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
          </div>

          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Paso 1 — Acceso</p>
          <p className="text-sm text-slate-700 font-medium mb-4">Introduce tu email para entrar</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={cargando || !email.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-3">Sin contraseña. Te enviamos un enlace mágico gratuito.</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/onboarding/OnboardingEmail.tsx
git commit -m "feat: add OnboardingEmail page"
```

---

### Task 8: Página `OnboardingConfirmar`

**Files:**
- Create: `src/pages/onboarding/OnboardingConfirmar.tsx`

- [ ] **Step 1: Escribir la página**

```tsx
// src/pages/onboarding/OnboardingConfirmar.tsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { enviarMagicLink } from '../../services/supabase'

export default function OnboardingConfirmar() {
  const location = useLocation()
  const email: string = (location.state as { email?: string })?.email ?? ''
  const [reenviado, setReeenviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleReenviar() {
    if (!email) return
    setCargando(true)
    await enviarMagicLink(email)
    setCargando(false)
    setReeenviado(true)
    setTimeout(() => setReeenviado(false), 5000)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-6 text-center text-white">
          <div className="text-4xl mb-1">📘</div>
          <div className="font-bold text-lg">OpoDAM</div>
          <div className="text-sm opacity-80">Prepara tu oposición</div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6 text-center">
          <div className="flex gap-1 justify-center mb-4">
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-6 bg-blue-600 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
          </div>

          <div className="text-5xl mb-3">✉️</div>
          <p className="text-sm text-slate-700">Enlace enviado a</p>
          <p className="font-bold text-blue-600 text-sm mb-1">{email || 'tu email'}</p>
          <p className="text-xs text-slate-400 mt-2 mb-5">Abre el email y pulsa el enlace para continuar.</p>

          {reenviado && (
            <p className="text-xs text-green-600 mb-2">Enlace reenviado ✓</p>
          )}

          <button
            onClick={handleReenviar}
            disabled={cargando}
            className="w-full bg-slate-100 text-slate-700 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Reenviar enlace'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/onboarding/OnboardingConfirmar.tsx
git commit -m "feat: add OnboardingConfirmar page"
```

---

### Task 9: Página `OnboardingOposicion`

**Files:**
- Create: `src/pages/onboarding/OnboardingOposicion.tsx`

- [ ] **Step 1: Escribir la página**

```tsx
// src/pages/onboarding/OnboardingOposicion.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../../data/oposiciones'
import { crearPerfil } from '../../services/supabase'
import { setActiveSlug } from '../../services/storage'

export default function OnboardingOposicion() {
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function toggleOposicion(slug: string) {
    setSeleccionadas(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  async function handleEmpezar() {
    if (seleccionadas.length === 0) return
    setCargando(true)
    setError(null)
    const { error: err } = await crearPerfil(seleccionadas)
    if (err) {
      setError('No se pudo guardar tu selección. Inténtalo de nuevo.')
      setCargando(false)
      return
    }
    setActiveSlug(seleccionadas[0])
    navigate('/mis-oposiciones')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-6 text-center text-white">
          <div className="text-4xl mb-1">📘</div>
          <div className="font-bold text-lg">OpoDAM</div>
          <div className="text-sm opacity-80">Prepara tu oposición</div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="flex gap-1 justify-center mb-4">
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-6 bg-blue-600 rounded-full" />
          </div>

          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Paso 3 — Tu oposición</p>
          <p className="text-sm text-slate-700 font-medium mb-4">Selecciona a qué te presentas (puedes elegir varias)</p>

          <div className="space-y-2 mb-4">
            {OPOSICIONES.map(op => (
              <button
                key={op.slug}
                type="button"
                disabled={!op.disponible}
                onClick={() => op.disponible && toggleOposicion(op.slug)}
                className={[
                  'w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left transition-colors',
                  op.disponible
                    ? seleccionadas.includes(op.slug)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed',
                ].join(' ')}
              >
                <span
                  className={[
                    'w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center text-xs',
                    seleccionadas.includes(op.slug)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300',
                  ].join(' ')}
                >
                  {seleccionadas.includes(op.slug) && '✓'}
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{op.nombre}</div>
                  <div className="text-xs text-slate-400">
                    {op.disponible
                      ? op.numTemas ? `${op.numTemas} temas disponibles` : 'Disponible'
                      : 'Próximamente'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          <button
            onClick={handleEmpezar}
            disabled={seleccionadas.length === 0 || cargando}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Empezar a estudiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/onboarding/OnboardingOposicion.tsx
git commit -m "feat: add OnboardingOposicion page"
```

---

### Task 10: Página `MisOposiciones`

**Files:**
- Create: `src/pages/MisOposiciones.tsx`

- [ ] **Step 1: Escribir la página**

```tsx
// src/pages/MisOposiciones.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerPerfil, obtenerUsuario } from '../services/supabase'
import { OPOSICIONES } from '../data/oposiciones'
import { setActiveSlug } from '../services/storage'
import type { Perfil } from '../types'

export default function MisOposiciones() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function cargar() {
      const [usuario, p] = await Promise.all([obtenerUsuario(), obtenerPerfil()])
      if (usuario?.email) {
        const partes = usuario.email.split('@')
        setNombreUsuario(partes[0] ?? '')
      }
      setPerfil(p)
    }
    cargar()
  }, [])

  function handleEntrar(slug: string) {
    setActiveSlug(slug)
    navigate(`/oposicion/${slug}`)
  }

  const misOposiciones = perfil
    ? OPOSICIONES.filter(op => perfil.oposiciones.includes(op.slug))
    : []

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <span className="font-extrabold text-slate-800">OpoDAM</span>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center uppercase">
          {nombreUsuario.charAt(0)}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <h1 className="text-lg font-bold text-slate-800">
          Hola, {nombreUsuario || 'opositor'}
        </h1>
        <p className="text-sm text-slate-500 mb-5">Selecciona con qué oposición trabajar hoy</p>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Mis oposiciones</p>

        <div className="space-y-3">
          {misOposiciones.map(op => (
            <div
              key={op.slug}
              className="rounded-2xl p-4 text-white"
              style={{ background: `linear-gradient(135deg, ${op.color}dd, ${op.color})` }}
            >
              <div className="font-bold text-sm">{op.nombre}</div>
              <div className="text-xs opacity-80 mt-0.5">
                {op.numTemas ? `${op.numTemas} temas disponibles` : 'Contenido en preparación'}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs opacity-90">Toca para entrar</span>
                <button
                  onClick={() => handleEntrar(op.slug)}
                  className="bg-white/25 hover:bg-white/40 transition-colors rounded-lg px-3 py-1 text-xs font-semibold"
                >
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/MisOposiciones.tsx
git commit -m "feat: add MisOposiciones home page"
```

---

### Task 11: Página `OposicionDashboard`

**Files:**
- Create: `src/pages/OposicionDashboard.tsx`

- [ ] **Step 1: Escribir la página**

```tsx
// src/pages/OposicionDashboard.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'

const MENU = [
  { icon: '📚', label: 'Temario', sub: 'Estudia los temas', path: 'temario' },
  { icon: '🃏', label: 'Flashcards', sub: 'Repaso rápido', path: 'flashcards' },
  { icon: '📝', label: 'Tests y simulacros', sub: 'Practica preguntas', path: 'tests' },
  { icon: '📊', label: 'Estadísticas', sub: 'Ver mi progreso', path: 'estadisticas' },
]

export default function OposicionDashboard() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const oposicion = OPOSICIONES.find(op => op.slug === slug)

  if (!oposicion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Oposición no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-3">
        <button
          onClick={() => navigate('/mis-oposiciones')}
          className="text-blue-600 text-sm"
        >
          ← Inicio
        </button>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{ color: oposicion.color, borderColor: oposicion.color, background: `${oposicion.color}15` }}
        >
          {oposicion.slug.toUpperCase()}
        </span>
      </header>

      <main className="max-w-md mx-auto p-4">
        <h1 className="font-bold text-slate-800 text-base mb-1">{oposicion.nombre}</h1>
        <p className="text-sm text-slate-500 mb-5">{oposicion.descripcion}</p>

        <div className="space-y-2">
          {MENU.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`/oposicion/${slug}/${item.path}`)}
              className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 text-left hover:border-slate-200 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                <div className="text-xs text-slate-400">{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/OposicionDashboard.tsx
git commit -m "feat: add OposicionDashboard page"
```

---

### Task 12: Reescribir `App.tsx` con nueva estructura de rutas

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Leer `src/App.tsx` actual**

Abre el archivo para ver las rutas y providers existentes. Anota qué páginas están actualmente importadas y enrutadas.

- [ ] **Step 2: Reescribir `src/App.tsx`**

Mantén cualquier `Suspense`, `ErrorBoundary` o context provider existente. Añade las rutas de onboarding y envuelve las rutas protegidas con `RutaProtegida`:

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { RutaProtegida } from './components/layout/RutaProtegida'

// Onboarding (no protegidas)
import OnboardingEmail from './pages/onboarding/OnboardingEmail'
import OnboardingConfirmar from './pages/onboarding/OnboardingConfirmar'
import OnboardingOposicion from './pages/onboarding/OnboardingOposicion'

// Páginas de la app (protegidas)
import MisOposiciones from './pages/MisOposiciones'
import OposicionDashboard from './pages/OposicionDashboard'

// Páginas existentes (lazy para mantener rendimiento)
const Temario = lazy(() => import('./pages/Temario'))
const TemaDetalle = lazy(() => import('./pages/TemaDetalle'))
const FlashcardsGlobal = lazy(() => import('./pages/FlashcardsGlobal'))
const Tests = lazy(() => import('./pages/Tests'))
const Simulacro = lazy(() => import('./pages/Simulacro'))
const Estadisticas = lazy(() => import('./pages/Estadisticas'))

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <span className="text-slate-400 text-sm">Cargando...</span>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Onboarding — sin protección */}
          <Route path="/onboarding/email" element={<OnboardingEmail />} />
          <Route path="/onboarding/confirmar" element={<OnboardingConfirmar />} />
          <Route path="/onboarding/oposicion" element={<OnboardingOposicion />} />

          {/* App protegida */}
          <Route
            path="/mis-oposiciones"
            element={<RutaProtegida><MisOposiciones /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug"
            element={<RutaProtegida><OposicionDashboard /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug/temario"
            element={<RutaProtegida><Temario /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug/temario/:id"
            element={<RutaProtegida><TemaDetalle /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug/flashcards"
            element={<RutaProtegida><FlashcardsGlobal /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug/tests"
            element={<RutaProtegida><Tests /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug/tests/simulacro"
            element={<RutaProtegida><Simulacro /></RutaProtegida>}
          />
          <Route
            path="/oposicion/:slug/estadisticas"
            element={<RutaProtegida><Estadisticas /></RutaProtegida>}
          />

          {/* Redireccciones */}
          <Route path="/" element={<Navigate to="/mis-oposiciones" replace />} />
          <Route path="*" element={<Navigate to="/mis-oposiciones" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

> **Nota:** Si el `App.tsx` actual ya tiene un `BrowserRouter`, elimina el existente y usa sólo el nuevo. Si tiene páginas extra como `Examen` o `SesionDiaria`, añádelas siguiendo el mismo patrón con `RutaProtegida` y la ruta `/oposicion/:slug/examen`, etc.

- [ ] **Step 3: Verificar compilación completa**

```bash
npm run build
```
Esperado: build exitoso sin errores. Si hay páginas que importaban de rutas antiguas (sin el prefijo `/oposicion/:slug`), actualízalas o añade aliases temporales.

- [ ] **Step 4: Prueba manual en el navegador**

```bash
npm run dev
```
Flujo a verificar:
1. Navegar a `http://localhost:5173` → redirige a `/onboarding/email`
2. Introducir email → llega a `/onboarding/confirmar`
3. Pulsar el magic link del email → app detecta sesión
4. Primera vez: redirige a `/onboarding/oposicion` → seleccionar CGPC → `Empezar`
5. Llega a `/mis-oposiciones` con tarjeta de CGPC
6. Pulsar "Entrar" → llega a `/oposicion/cgpc` con el dashboard
7. Pulsar "Temario" → llega al temario de CGPC
8. Cerrar sesión y volver → redirige a `/onboarding/email`

- [ ] **Step 5: Commit final**

```bash
git add src/App.tsx
git commit -m "feat: rewrite App.tsx with onboarding routes and RutaProtegida guard"
```

---

## Post-implementación

- [ ] Ejecutar todos los tests: `npx vitest run`
- [ ] Ejecutar build de producción: `npm run build`
- [ ] Revisar consola del navegador en flujo completo (sin errores)
- [ ] Commit de cierre si hay ajustes menores

---

## Notas de implementación

- **Páginas existentes** (`Temario`, `TemaDetalle`, etc.) no necesitan cambios de importación si `src/data/topics/index.ts` se convierte en barrel — seguirán funcionando igual.
- **Progress.ts** y otros servicios seguirán funcionando porque `getProgreso()`/`saveProgreso()` en `storage.ts` ahora leen `getActiveSlug()` internamente.
- **El slug activo** se establece en `OnboardingOposicion` (al registrarse) y en `MisOposiciones` (al pulsar "Entrar"). Los `<Estadisticas>`, `<Tests>`, etc. leen el progreso de la clave del slug activo.
- **Nueva oposición en el futuro**: añadir carpeta `src/data/topics/{slug}/`, crear su `index.ts` y JSONs, y añadir entrada en `OPOSICIONES` con `disponible: true`. Nada más.
