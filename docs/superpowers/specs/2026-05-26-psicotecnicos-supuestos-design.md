# Psicotécnicos y Supuestos Prácticos — Diseño

**Fecha:** 2026-05-26
**Proyecto:** OpoDAM
**Objetivo:** Añadir dos modos de práctica tipo examen: **psicotécnicos** (compartidos entre oposiciones) y **supuestos prácticos** (anclados al temario de cada oposición), con banco fijo pregenerado y opción de "generar más" bajo demanda.

---

## Resumen de decisiones

1. **Motor de test reutilizable** (`MotorTest`): un único componente para responder, navegar, corregir, puntuar y revisar con explicaciones. Lo usan Psicotécnicos y Supuestos (y queda disponible para refactor futuro de `Tests`).
2. **Contenido:** banco fijo en JSON + botón **"generar más"** efímero (Groq en tiempo real, no se persiste).
3. **Psicotécnicos:** compartidos entre oposiciones. 5 categorías: series numéricas, razonamiento verbal, razonamiento lógico/abstracto, ortografía y cálculo, razonamiento mecánico (texto).
4. **Supuestos prácticos:** por oposición, anclados al temario. Cada supuesto = un **caso** + ~25 preguntas tipo test con corrección y explicación.
5. **Reutiliza** la infraestructura Groq/Netlify ya endurecida (validación de entrada, CORS por `ALLOWED_ORIGINS`, timeout, `GROQ_API_KEY`).
6. **Fuera de alcance (spec futuro):** simulador de entrevista personal y test de personalidad con feedback IA (otra arquitectura: chat, sin nota).

---

## Arquitectura

### Componentes y archivos nuevos
- `src/components/test/MotorTest.tsx` — motor de test reutilizable.
- `src/pages/Psicotecnicos.tsx` — selección de categoría + test.
- `src/pages/Supuestos.tsx` — lista de supuestos de la oposición.
- `src/pages/SupuestoDetalle.tsx` — caso + test del supuesto.
- `src/services/practica.ts` — cliente de "generar más" (`/.netlify/functions/practica-generate`).
- `src/data/psicotecnicos/<categoria>.json` — banco compartido por categoría.
- `src/data/psicotecnicos/index.ts` — catálogo de categorías + loader.
- `src/data/supuestos/<slug>/supuesto-NN.json` — banco por oposición.
- `src/data/supuestos/<slug>/index.ts` — índice (metadatos) + loader.
- `netlify/functions/practica-generate.cjs` — generación efímera (Groq).
- `scripts/generate-psicotecnicos.cjs` — generación del banco (Groq).
- `scripts/generate-supuestos.cjs` — generación del banco desde el temario (Groq).

### MotorTest — interfaz
```ts
interface PreguntaTest {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number   // índice 0-based
  explicacion: string
}
interface MotorTestProps {
  preguntas: PreguntaTest[]
  titulo: string
  onTerminar?: (resultado: { aciertos: number; errores: number; total: number }) => void
}
```
Responsabilidades: navegación pregunta a pregunta, selección de opción, corrección, puntuación (reutiliza `calcularPuntuacionTest` de `services/progress`), pantalla de revisión con la opción correcta y la explicación. Sin estado global; recibe las preguntas ya cargadas.

---

## Estructura de datos

### Psicotécnicos (compartidos)
`src/data/psicotecnicos/series-numericas.json` (y una por categoría):
```json
[
  {
    "id": "psico-series-001",
    "categoria": "series-numericas",
    "enunciado": "¿Qué número continúa la serie: 2, 4, 8, 16, ...?",
    "opciones": ["24", "32", "30", "20"],
    "respuestaCorrecta": 1,
    "explicacion": "Cada término se multiplica por 2."
  }
]
```
Categorías (ids): `series-numericas`, `razonamiento-verbal`, `razonamiento-logico`, `ortografia-calculo`, `razonamiento-mecanico`.

`src/data/psicotecnicos/index.ts`:
```ts
export const CATEGORIAS = [
  { id: 'series-numericas', titulo: 'Series numéricas' },
  { id: 'razonamiento-verbal', titulo: 'Razonamiento verbal' },
  { id: 'razonamiento-logico', titulo: 'Razonamiento lógico' },
  { id: 'ortografia-calculo', titulo: 'Ortografía y cálculo' },
  { id: 'razonamiento-mecanico', titulo: 'Razonamiento mecánico' },
] as const
export async function cargarCategoria(id: string): Promise<PreguntaTest[]>
```

### Supuestos prácticos (por oposición)
`src/data/supuestos/cgpc/supuesto-01.json`:
```json
{
  "id": "sup-cgpc-01",
  "titulo": "Actuación ante un altercado en la vía pública",
  "caso": "Texto del escenario...",
  "preguntas": [
    { "id": "sup-cgpc-01-p01", "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }
  ]
}
```
`src/data/supuestos/<slug>/index.ts`:
```ts
export const SUPUESTOS_META = [{ id: 'sup-cgpc-01', titulo: '...' }] as const
export async function cargarSupuesto(id: string): Promise<Supuesto>
```

---

## Páginas y navegación

### Rutas nuevas (protegidas)
- `/oposicion/:slug/psicotecnicos` → `Psicotecnicos`
- `/oposicion/:slug/supuestos` → `Supuestos`
- `/oposicion/:slug/supuestos/:id` → `SupuestoDetalle`

### `Psicotecnicos.tsx`
- Tarjetas con las 5 categorías + nº de preguntas del banco.
- Al elegir → `MotorTest` con las preguntas de esa categoría.
- Botón "Generar más" → añade preguntas efímeras a la sesión (vía `practica.ts`).
- Al terminar: puntuación + revisión.

### `Supuestos.tsx`
- Lista de supuestos del banco de la oposición (título + nº preguntas).
- Botón "Generar nuevo supuesto" (efímero).
- Al abrir uno → ruta detalle.

### `SupuestoDetalle.tsx`
- Caso arriba (colapsable). Debajo, `MotorTest` con las ~25 preguntas. Puntuación + revisión.

### `OposicionDashboard`
- Dos tarjetas nuevas — "Psicotécnicos" y "Supuestos prácticos" — con el estilo de las existentes.

---

## Backend — `practica-generate.cjs`
- Entrada: `{ tipo: 'psicotecnico' | 'supuesto', categoria?, slug?, contexto? }`.
- Reutiliza: validación de entrada, CORS por `ALLOWED_ORIGINS`, `AbortController` 25s, guard de `fetch`, `GROQ_API_KEY`.
- `psicotecnico`: prompt por categoría → N preguntas validadas.
- `supuesto`: usa algo de temario del `slug` → genera caso + preguntas.
- Salida validada (mismo esquema que el banco). JSON inválido tras reintento → error claro; la app no rompe.

## Scripts de banco
- Patrón de `generate-quizzes.cjs`: `llama-3.1-8b-instant`, `response_format: json_object`, throttling + backoff 429, validación estricta, escritura idempotente.
- `generate-supuestos.cjs`: para las ~25 preguntas, sube `max_tokens`; si hay truncado, genera el caso y las preguntas en 2 llamadas.

---

## Manejo de errores
- Categoría sin preguntas → "aún no hay preguntas aquí".
- "Generar más" falla → aviso "no se pudo generar, inténtalo de nuevo"; el test sigue con el banco.
- Supuesto inexistente (`:id`) → redirige a la lista.

---

## Testing
- `MotorTest`: corrección, puntuación, navegación, revisión (test de componente con Vitest + Testing Library).
- `services/practica.ts`: `fetch` mockeado (ok/error).
- `practica-generate.cjs`: 400 sin datos válidos, 200 con generación válida, 500 sin key (invocando el handler).
- Loaders (`psicotecnicos/index.ts`, `supuestos/<slug>/index.ts`): cargan e indexan correctamente.
- Verificación final: `npm run build` verde + prueba manual con `netlify dev`.

---

## Fuera de alcance (Fase futura)
- Simulador de entrevista personal y test de personalidad con feedback cualitativo de IA (chat, sin nota).
- Psicotécnicos con imágenes (figuras, series gráficas, mecánico con dibujos).
- Persistencia de progreso específico de psicotécnicos/supuestos en Supabase (se puede añadir luego reutilizando el sistema de progreso).
