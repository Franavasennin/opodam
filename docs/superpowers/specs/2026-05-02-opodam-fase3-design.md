# OpoDAM Fase 3 — Design Spec

**Date:** 2026-05-02  
**Status:** Approved  
**App:** OpoDAM — PWA de estudio para el Cuerpo General de la Policía Canaria (CGPC)  
**Stack:** React 18 + TypeScript + Vite 5 + vite-plugin-pwa · Deployed on Vercel

---

## Objetivo

Añadir tres funcionalidades a OpoDAM:
1. **Modo Examen Oficial** — simulacro con el formato exacto de la convocatoria CGPC 2026
2. **Inteligencia Adaptativa** — panel de debilidades + sesión diaria generada automáticamente
3. **Sincronización en la nube** — local-first con Supabase opcional + exportar/importar JSON

---

## Arquitectura general

### Nuevas páginas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/examen` | `Examen.tsx` | Modo examen oficial CGPC |
| `/sesion-diaria` | `SesionDiaria.tsx` | Sesión adaptativa generada |
| `/perfil` | `Perfil.tsx` | Login, sync, exportar/importar backup |

### Nuevos servicios

| Fichero | Responsabilidad |
|---------|----------------|
| `src/services/supabase.ts` | Cliente Supabase + auth magic link |
| `src/services/sync.ts` | Merge local↔nube (gana estado más avanzado) |
| `src/services/adaptativo.ts` | Calcular debilidades + generar sesión diaria |
| `src/services/examen.ts` | Lógica de puntuación CGPC |

### Cambios en tipos existentes (`src/types/index.ts`)

```typescript
// Nuevo en ProgresoUsuario
historialExamenes: ExamenResultado[]
sesionDiaria: { fecha: string; flashcardIds: string[]; preguntaIds: string[] } | null
rendimientoPorTema: Record<string, { aciertos: number; errores: number; total: number }>

// Nuevos tipos
interface ExamenResultado {
  id: string           // timestamp ISO
  fecha: string        // YYYY-MM-DD
  modo: 'completo' | 'mini'
  aciertos: number
  errores: number
  enBlanco: number
  nota: number         // 0–10, 2 decimales
  aprobado: boolean
  tiempoSegundos: number
  preguntasIds: string[]
  respuestasUsuario: Record<string, number | null>  // preguntaId → opción elegida (null = en blanco)
  erroresPorTema: Record<number, number>            // temaId → nº errores
}
```

### Supabase (1 tabla)

```sql
CREATE TABLE progreso (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  data    jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE progreso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_row" ON progreso USING (auth.uid() = user_id);
```

Todo el progreso se serializa como un blob JSONB — sin migrations complejas en el futuro.

---

## Feature 1: Modo Examen Oficial

### Formato del examen CGPC 2026

| Campo | Valor |
|-------|-------|
| Preguntas | 50 |
| Tiempo | 60 minutos |
| Opciones | 3 por pregunta |
| Acierto | +0,20 puntos |
| Penalización | cada 3 errores = −0,20 puntos |
| En blanco | 0 puntos (sin penalización) |
| Nota máxima | 10,00 |
| Mínimo aprobado | 5,00 |

### Fórmula de puntuación

```typescript
function calcularNota(aciertos: number, errores: number): number {
  const bruta = (aciertos * 0.20) - (Math.floor(errores / 3) * 0.20)
  return Math.max(0, Math.min(10, Math.round(bruta * 100) / 100))
}
```

### Modos disponibles

- **Examen completo:** 50 preguntas · 60 min · puntuación oficial
- **Mini-examen:** 25 preguntas · 30 min · misma fórmula de puntuación

### Flujo de pantallas

1. **Inicio:** elegir modo + botón "Comenzar examen"
2. **Durante:** cronómetro en header · pregunta con 3 opciones · botón "Marcar para revisar" · navegación entre preguntas · botón "Entregar"
3. **Confirmación:** "¿Seguro que quieres entregar? Tienes X preguntas en blanco"
4. **Resultados:** nota, aciertos/errores/en blanco, tiempo, temas con más fallos, botón "Ver respuestas"
5. **Revisión:** recorre todas las preguntas con tu respuesta marcada (verde/rojo/gris)

### Selección de preguntas

Las preguntas se eligen aleatoriamente del banco completo (45 × 15 = 675 disponibles), con peso hacia los temas con peor rendimiento (`rendimientoPorTema`). Temas sin historial tienen peso neutro.

### Historial

Los últimos 10 exámenes se guardan en `historialExamenes`. Visibles en la página `/examen` con fecha, nota y badge APROBADO/SUSPENSO.

---

## Feature 2: Inteligencia Adaptativa

### Algoritmo de debilidades

```typescript
function calcularDebilidades(
  rendimiento: Record<string, { aciertos: number; errores: number; total: number }>,
  minPreguntas = 3
): number[] {
  return Object.entries(rendimiento)
    .filter(([, r]) => r.total >= minPreguntas)
    .sort(([, a], [, b]) => (a.aciertos / a.total) - (b.aciertos / b.total))
    .map(([id]) => Number(id))
}
```

Solo se muestran temas con ≥ 3 preguntas respondidas (evita datos engañosos al inicio).

### Panel de debilidades

- Muestra los **5 temas con peor % de aciertos**
- Aparece en el **Dashboard** (si hay ≥ 10 preguntas respondidas en total) y en **Estadísticas**
- Barra de progreso visual con porcentaje de aciertos
- Enlace directo a `→ Sesión diaria`

### Sesión diaria (`/sesion-diaria`)

Se genera una vez al día (se regenera a medianoche). Si ya está completada, muestra resumen hasta el día siguiente.

**Parte 1 — Flashcards (10 tarjetas)**
Las 10 flashcards con `proximoRepaso <= hoy` con mayor prioridad, ordenadas priorizando los temas débiles. Usa el sistema de spaced repetition existente.

**Parte 2 — Mini-test (10 preguntas)**
Preguntas de los 3 temas con peor rendimiento. Sin cronómetro, sin penalización — modo práctica pura. Al responder, actualiza `rendimientoPorTema`.

**Al completar:**
- Actualiza racha de días consecutivos
- Muestra resumen: X/10 en el mini-test, racha actual
- Guarda `sesionDiaria.fecha = hoy` para no regenerar hasta mañana

---

## Feature 3: Sincronización en la nube (local-first)

### Principio: local-first

El `localStorage` sigue siendo la fuente principal. La app funciona 100% sin cuenta y 100% offline. Supabase es una capa opcional encima.

### Autenticación

Magic link por email (Supabase Auth):
1. Usuario introduce su email en `/perfil`
2. Recibe un email con enlace de un solo uso
3. Al hacer clic, queda autenticado en el dispositivo
4. Sin contraseña, sin formulario de registro

### Lógica de merge

Al sincronizar, se combinan el estado local y el de la nube:

```typescript
function merge(local: ProgresoUsuario, remoto: ProgresoUsuario): ProgresoUsuario {
  // Temas: gana el que tenga más vueltas
  // Flashcards: gana el nivel más alto
  // Historial exámenes: unión deduplicada por id
  // Racha: gana el valor más alto
  // Sesión diaria: gana la fecha más reciente
  // rendimientoPorTema: suma aciertos y errores de ambos
}
```

### Cuándo se sincroniza automáticamente

- Al abrir la app (si hay sesión activa y conexión)
- Al terminar un examen
- Al completar la sesión diaria
- Al volver a primer plano (`document.visibilitychange`)

### Exportar / Importar JSON

Siempre disponible, con o sin cuenta:

- **Exportar:** descarga `opodam-backup-YYYY-MM-DD.json` con todo `ProgresoUsuario`
- **Importar:** sube un fichero `.json`, se aplica la misma lógica de merge (no sobreescribe, combina)

### Página `/perfil`

**Sin sesión:**
```
👤 Mi cuenta
Email: [___________________] [Enviar magic link]

💾 Copia de seguridad manual
[⬇ Exportar progreso]   [⬆ Importar progreso]
```

**Con sesión:**
```
✅ usuario@email.com
🔄 Último sync: hace 2 minutos
                    [Cerrar sesión]

💾 Copia de seguridad manual
[⬇ Exportar progreso]   [⬆ Importar progreso]
```

---

## Cambios en navegación existente

- `BottomNav` / `SideNav`: añadir icono de **Examen** (`/examen`) y **Perfil** (`/perfil`)
- `Dashboard`: añadir tarjeta "Sesión de hoy" con enlace a `/sesion-diaria`
- `Estadísticas`: añadir sección "Tus puntos débiles" (panel de debilidades)

---

## Variables de entorno necesarias

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Se añaden en Vercel (dashboard > Settings > Environment Variables). No se commitean al repo.

---

## Fuera de alcance (Fase 4+)

- Ranking entre usuarios
- Compartir resultados
- Notificaciones push para la sesión diaria
- Tema oscuro
