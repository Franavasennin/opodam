# Registro de Usuario y Selección de Oposición — Diseño

## Resumen

Añadir un flujo de registro obligatorio a OpoDAM para que los usuarios se identifiquen con su email y elijan las oposiciones que quieren estudiar. Esto permite escalar la plataforma a múltiples oposiciones (CGPC, Aux. Enfermería, Aux. Judicial, Tramitación Judicial y futuras) manteniendo el progreso de cada usuario separado por oposición.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| ¿Registro obligatorio? | Sí — sin cuenta no se accede a la app |
| ¿Cuántas oposiciones por usuario? | Una o varias, elegidas al registrarse |
| ¿Se puede cambiar después? | No — fijadas en el registro |
| ¿Cómo se navega entre oposiciones? | Pantalla de inicio con tarjetas |
| ¿Dónde se almacena el perfil? | Supabase — tabla `profiles` |

---

## Arquitectura

### Supabase

**Tabla `profiles`** (nueva):
```sql
create table profiles (
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

**Auth:** se reutiliza el sistema de magic link ya existente en `src/services/supabase.ts`.

### Estructura de temas por oposición

Los temas actuales (CGPC) se reorganizan en subcarpetas:

```
src/data/topics/
├── cgpc/
│   ├── index.ts          (exporta todos los temas de CGPC)
│   └── tema-01.json ... tema-45.json
└── aux-enfermeria/       (a crear cuando haya contenido)
    ├── index.ts
    └── tema-01.json ...
```

### Catálogo de oposiciones

Definido en `src/data/oposiciones.ts`:

```ts
export interface Oposicion {
  slug: string        // identificador unico, ej. "cgpc"
  nombre: string      // nombre completo
  descripcion: string // breve descripcion
  disponible: boolean // false = "en preparacion"
  color: string       // color de la tarjeta en la UI
  numTemas?: number   // calculado del index.ts correspondiente
}

export const OPOSICIONES: Oposicion[] = [
  {
    slug: 'cgpc',
    nombre: 'Policia Canaria (CGPC)',
    descripcion: 'Cuerpo General de la Policia Canaria',
    disponible: true,
    color: '#2563eb',
    numTemas: 45,
  },
  {
    slug: 'aux-enfermeria',
    nombre: 'Auxiliar de Enfermeria',
    descripcion: 'Servicio Canario de Salud',
    disponible: false,
    color: '#0891b2',
  },
  {
    slug: 'aux-judicial',
    nombre: 'Auxiliar Judicial',
    descripcion: 'Administracion de Justicia',
    disponible: false,
    color: '#7c3aed',
  },
  {
    slug: 'tramitacion-judicial',
    nombre: 'Tramitacion Judicial',
    descripcion: 'Administracion de Justicia',
    disponible: false,
    color: '#b45309',
  },
]
```

---

## Flujo de usuario

### Primera vez (sin sesión)

```
Abrir app
  → sin sesion activa
  → redirigir a /onboarding/email

/onboarding/email
  → usuario introduce email
  → se llama a enviarMagicLink(email)
  → redirigir a /onboarding/confirmar

/onboarding/confirmar
  → pantalla "revisa tu correo"
  → boton "Reenviar enlace"
  → al hacer clic en el enlace del email, Supabase crea sesion
  → App detecta sesion activa

Con sesion activa, sin perfil
  → redirigir a /onboarding/oposicion

/onboarding/oposicion
  → mostrar lista de oposiciones (checkboxes)
  → oposiciones disponibles: seleccionables
  → oposiciones en preparacion: visibles pero desactivadas ("Proximamente")
  → usuario elige 1 o mas oposiciones disponibles
  → guardar en Supabase: INSERT INTO profiles (id, email, oposiciones)
  → redirigir a /mis-oposiciones
```

### Visitas siguientes (sesion activa + perfil completo)

```
Abrir app
  → sesion activa + perfil con oposiciones
  → directo a /mis-oposiciones
```

### Dentro de la app

```
/mis-oposiciones
  → tarjeta por cada oposicion elegida
  → muestra nombre, progreso y boton "Entrar"
  → al pulsar "Entrar" → /oposicion/:slug

/oposicion/:slug
  → header con badge del nombre de la oposicion
  → dashboard con estadisticas de esa oposicion
  → accesos a: Temario, Flashcards, Tests, Estadisticas
  → boton "Inicio" vuelve a /mis-oposiciones
```

---

## Rutas de React Router

```
/onboarding
  /email          → <OnboardingEmail />
  /confirmar      → <OnboardingConfirmar />
  /oposicion      → <OnboardingOposicion />

/                 → requiere auth + perfil completo
  mis-oposiciones → <MisOposiciones />
  oposicion/:slug
    index         → <OposicionDashboard />
    temario       → <Temario />
    temario/:id   → <TemaDetalle />
    flashcards    → <FlashcardsGlobal />
    tests         → <Tests />
    tests/simulacro → <Simulacro />
    estadisticas  → <Estadisticas />
    examen        → <Examen />
    sesion-diaria → <SesionDiaria />
  perfil          → <Perfil />
```

**Guardia de rutas:** Componente `<RutaProtegida />` que comprueba en orden:
1. ¿Hay sesion activa? Si no → `/onboarding/email`
2. ¿Existe perfil con oposiciones? Si no → `/onboarding/oposicion`
3. Si todo OK → renderiza los hijos

---

## Archivos nuevos y modificados

| Accion | Archivo |
|---|---|
| Crear | `src/data/oposiciones.ts` |
| Crear | `src/services/oposiciones.ts` |
| Crear | `src/pages/onboarding/OnboardingEmail.tsx` |
| Crear | `src/pages/onboarding/OnboardingConfirmar.tsx` |
| Crear | `src/pages/onboarding/OnboardingOposicion.tsx` |
| Crear | `src/pages/MisOposiciones.tsx` |
| Crear | `src/pages/OposicionDashboard.tsx` |
| Crear | `src/components/layout/RutaProtegida.tsx` |
| Modificar | `src/services/supabase.ts` — añadir funciones de perfil |
| Modificar | `src/App.tsx` — nueva estructura de rutas |
| Mover | `src/data/topics/*.json` → `src/data/topics/cgpc/*.json` |
| Modificar | `src/data/topics/index.ts` → `src/data/topics/cgpc/index.ts` |
| Modificar | `src/services/progress.ts` — clave de progreso incluye slug |

---

## Progreso por oposición

Las claves de localStorage cambian de:
```
opodam:progress:tema-01
```
a:
```
opodam:cgpc:progress:tema-01
opodam:aux-enfermeria:progress:tema-01
```

El progreso existente (clave antigua) se migra automáticamente al formato `opodam:cgpc:progress:*` la primera vez que arranque la nueva versión.

---

## Funciones nuevas en `supabase.ts`

```ts
// Obtener perfil del usuario actual
obtenerPerfil(): Promise<{ id: string; email: string; oposiciones: string[] } | null>

// Crear perfil tras elegir oposiciones
crearPerfil(oposiciones: string[]): Promise<{ error: string | null }>
```

---

## Consideraciones

- Las oposiciones **en preparación** son visibles en el paso 3 pero no seleccionables. Mensaje: "Proximamente".
- El progreso existente de usuarios que ya usaban la app se migra automáticamente al formato nuevo la primera vez que arranque la app.
- Añadir una nueva oposición en el futuro requiere solo: (1) crear carpeta `src/data/topics/{slug}/` con su `index.ts` y JSONs, (2) añadir entrada en `OPOSICIONES` con `disponible: true`.
