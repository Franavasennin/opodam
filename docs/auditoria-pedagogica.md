# Auditoría pedagógica de OpoDAM — informe del director académico

> Fecha: 2026-06-11 · Auditado contra el código real (`src/services/`, `src/pages/`, modelo `Progreso`).
> Regla aplicada a cada propuesta: **¿esto aumenta la probabilidad de aprobar?** Si no, descartada.

---

## 1. Diagnóstico actual

**Lo que OpoDAM ya hace bien (verificado en código):**

| Principio | Estado | Evidencia |
|---|---|---|
| Active Recall / Retrieval | ✅ Sólido | Flashcards con autoevaluación, tests por tema, examen, simulacro, sesión diaria lectura→repaso→test |
| Spaced Repetition | 🟡 Parcial | `spaced-repetition.ts`: SM-2 simplificado (nivel 0-5, intervalos ×1.5/2.0/2.5, "difícil" resetea a 1 día). **Solo flashcards**, no temas ni preguntas |
| Aprendizaje adaptativo | 🟡 Parcial | `adaptativo.ts` (temas débiles = peor ratio con ≥3 respuestas) + `seleccionarPreguntas` pondera ×3/×2 los temas flojos |
| Learning by Testing | ✅ | El flujo central es test-céntrico; explicación tras cada pregunta |
| Antiprocrastinación | 🟡 Básico | Racha de días, notificación local >20h, push PWA. Sin objetivo configurable ni plan a fecha |
| Chunking | ✅ | Temas → secciones → esquemas mermaid → mapa mental → flashcards |
| Examen real | 🟡 Parcial | Cronómetro, modos completo/mini, corrección automática, nota oficial. **Pero**: fórmula de nota CGPC aplicada a TODOS los cuerpos |
| Interleaving | 🟡 Parcial | Examen/simulacro mezclan temas; los tests de tema son mono-tema; la sesión diaria mezcla 3 temas débiles |
| Metacognición | 🟡 Solo flashcards | fácil/dudoso/difícil es un juicio metacognitivo; en tests no se pide confianza |
| Elaborative Learning | 🟡 | Tutor IA RAG anclado al temario puede elaborar, pero no conoce los errores del alumno |
| Analíticas | 🟡 Básicas | Horas totales, racha, % aciertos y vueltas por tema, historial de exámenes (cap 10) |

**Arquitectura de datos del progreso** (localStorage + sync Supabase por slug): `temas{vueltas, ultimaRevision, porcentajeAciertos, teoriaLeida}`, `flashcards{proximoRepaso, nivel, intervalo}`, `rendimientoPorTema{aciertos, errores, total}`, `sesionDiaria`, `racha`, `historialExamenes[≤10]`, `tiempoTotalSegundos`.

## 2. Problemas detectados (cuellos de botella y riesgos pedagógicos)

1. **🔴 RIESGO: la nota del examen usa la fórmula CGPC para todos los cuerpos** (`examen.ts:5-8`: aciertos×0,20 − ⌊errores/3⌋×0,20). Un opositor de aux-enfermería o Guardia Civil entrena su estrategia de "¿arriesgo o dejo en blanco?" con una penalización que NO es la de su tribunal. Esto entrena una conducta de examen equivocada.
2. **🔴 Banco de preguntas pequeño y estático** (~8-15/tema). A la 2ª-3ª vuelta el alumno reconoce las respuestas por memoria de la pregunta, no por conocimiento → el test deja de medir. Es el mayor techo de la app.
3. **🔴 Los errores no se persisten a nivel de pregunta.** `rendimientoPorTema` agrega por tema; no existe "cuaderno de errores" para re-testear exactamente lo fallado. La materia prima existe (`ExamenResultado.respuestasUsuario`), pero se descarta.
4. **🟠 La cola de repasos no escala**: `flashcardsPendientesHoy` devuelve TODAS las vencidas pero la sesión corta a 10/día. Con 200 tarjetas activas, el backlog crece en bola de nieve y el repaso espaciado degenera en repaso aleatorio.
5. **🟠 `historialExamenes` capado a 10** → sin evolución histórica real ni datos para predicción.
6. **🟠 No hay noción de "riesgo de olvido" por tema**: `ultimaRevision` existe pero nadie la usa para avisar "hace 21 días que no tocas el tema 7 y tu retención estimada cayó al 60%".
7. **🟠 El contador de convocatoria (BOC/BOE) no alimenta ningún plan**: la app sabe cuándo es el examen pero no traduce eso a "necesitas X temas/semana".
8. **🟡 El Tutor IA es ciego al alumno**: no recibe temas débiles ni preguntas falladas; responde igual a todos.
9. **🟡 Sin registro de tiempo por tema** (solo total) → no se puede detectar "mucho tiempo + poco acierto = método de estudio incorrecto en ese tema".
10. **🟡 Funciones de bajo ROI pedagógico** que no conviene ampliar: mapas mentales solo-lectura (consumo pasivo), música de estudio. No quitar, pero no invertir más ahí.

## 3. Mejoras prioritarias — matriz impacto/esfuerzo

### P1 — Impacto alto + desarrollo bajo (implementación inmediata, ~30 días)

---

#### P1.1 Cuaderno de errores (re-test de falladas) — LA mejora nº 1

**Por qué aprueba más:** el retrieval dirigido al error es la práctica con mayor ganancia por minuto (effect size de practice testing + feedback correctivo). Hoy el alumno falla y la pregunta desaparece.

- **Historia de usuario:** *Como opositor, quiero un modo "Repasar mis fallos" que me re-pregunte exactamente lo que he fallado, hasta que lo acierte 2 veces seguidas, para convertir errores en puntos.*
- **Cambios de interfaz:** en `Tests.tsx`, tarjeta nueva "Mis fallos (N)" junto a los modos actuales; en el resultado del examen (`Examen.tsx` fase resultados), botón "Repasar las falladas ahora". Badge rojo con contador en el dashboard.
- **Cambios de datos:** añadir a `Progreso`: `erroresPorPregunta: Record<string, { fallos: number; aciertosSeguidos: number; ultimoFallo: string; temaId: number }>`. Se gradúa (sale del cuaderno) con `aciertosSeguidos >= 2`. Migración trivial (campo nuevo con default `{}` en `storage.ts`).
- **Tareas técnicas:** (1) registrar fallo/acierto en `guardarExamen`, en el test de tema (`MotorTest`) y en SesiónDiaria; (2) nueva página/modo `RepasoErrores` que carga las preguntas por id vía `cargarTema`; (3) tests unitarios de graduación.
- **Métrica de éxito:** % de preguntas del cuaderno graduadas/semana; reducción de fallos repetidos en simulacros.

#### P1.2 Nota oficial por cuerpo (corregir el riesgo nº 1)

- **Historia:** *Como opositor de [cuerpo], quiero que el simulacro puntúe con la fórmula de MI tribunal para entrenar la estrategia de respuesta correcta.*
- **Interfaz:** en resultados, mostrar la fórmula aplicada ("3 errores restan 1 acierto" / "los errores no penalizan") + consejo de estrategia (cuándo conviene arriesgar).
- **Datos:** en `src/data/oposiciones.ts`, añadir por oposición `formulaNota: { penalizacion: number | null }` (CGPC: 1/3; resto: confirmar bases reales de cada convocatoria).
- **Técnicas:** parametrizar `calcularNotaExamen(aciertos, errores, formula)`; pasar la fórmula desde el slug activo; actualizar tests de `examen.ts`.

#### P1.3 Dominio y riesgo de olvido por tema

- **Historia:** *Como opositor, quiero ver en el temario qué temas domino, cuáles están "en riesgo de olvido" y cuáles no he tocado, para decidir qué estudiar hoy sin pensar.*
- **Cálculo (sin BD nueva, todo derivable):** `dominio(tema) = porcentajeAciertos × factorRetencion`, con `factorRetencion = exp(-díasDesdeUltimaRevision / (7 + 7×vueltas))` (curva de olvido simplificada: cada vuelta alarga la vida media). Estados: 🟢 Dominado (≥75), 🟡 En riesgo (40-75), 🔴 Olvidado/No iniciado (<40).
- **Interfaz:** chip de estado + "hace N días" en cada tema de `Temario.tsx`; sección "En riesgo hoy" arriba del dashboard de oposición; en `Estadisticas.tsx`, retención media global.
- **Técnicas:** nuevo `src/services/dominio.ts` puro (fácil de testear); consumirlo en Temario, Dashboard y Estadísticas.

#### P1.4 Cola de repasos honesta (backlog visible y elástico)

- **Historia:** *Como opositor, quiero saber cuántos repasos tengo pendientes de verdad y poder despacharlos, para que el repaso espaciado funcione.*
- **Interfaz:** en SesiónDiaria y FlashcardsGlobal, mostrar "N pendientes hoy"; botón "Seguir repasando" al acabar las 10 si quedan vencidas.
- **Técnicas:** en `generarSesionDiaria`, `limite = clamp(10, pendientes, 30)`; ordenar por (nivel asc, días vencida desc) para priorizar lo más frágil; no tocar el algoritmo de intervalos todavía (eso es P3 con FSRS).

#### P1.5 Metacognición en tests (calibración de confianza)

- **Historia:** *Como opositor, quiero marcar si estoy seguro o dudando antes de corregir, para descubrir mis "falsos seguros" (lo más peligroso en un examen con penalización).*
- **Interfaz:** en `MotorTest`, tras elegir opción y antes de corregir, dos botones: "Seguro" / "Dudo". En resultados: matriz calibración (seguro+fallo = alerta roja "ilusión de saber").
- **Datos:** `erroresPorPregunta` gana campo `confianza?: 'seguro' | 'dudo'` en el último intento; agregado `calibracion: { seguroFallo: number, seguroAcierto: number, ... }` en `Progreso`.
- **Técnicas:** un estado más en MotorTest; estadística en página de resultados. Los "seguro+fallo" entran al cuaderno de errores con prioridad máxima.

#### P1.6 Plan inverso a la fecha de examen

- **Historia:** *Como opositor con fecha de convocatoria detectada, quiero que la app me diga el ritmo necesario (temas nuevos/semana y tests/día) y si voy adelantado o atrasado.*
- **Interfaz:** banda bajo el contador de convocatoria del dashboard: "A este ritmo acabas el temario el DD/MM (✅ 12 días antes del examen / ⚠️ 20 días tarde)".
- **Técnicas:** `src/services/plan.ts`: ritmo actual = temas con ≥1 vuelta / semanas activas; proyección lineal contra la fecha de `convocatorias.ts`. Sin BD nueva.
- **Quick wins adjuntos (mismo sprint):** subir cap de `historialExamenes` de 10 → 50 y gráfico de evolución de nota en Estadísticas.

### P2 — Impacto alto + desarrollo medio (días 30-90)

#### P2.1 Banco inteligente de preguntas (romper el techo del contenido)

- **Historia:** *Como opositor en 3ª vuelta, quiero preguntas nuevas que no me sepa de memoria, para que el test siga midiendo conocimiento.*
- **Diseño:** generación incremental con `practica-generate` (Groq) **persistida y revisada**: las preguntas generadas pasan por el pipeline de auditoría de calidad (`scripts/auditar-preguntas.mjs` + revisión humana) antes de entrar al banco. Nunca directo del LLM al alumno (lección aprendida del incidente del beta tester).
- **Datos (Supabase):** tabla `banco_preguntas { id, oposicion_slug, tema_id, enunciado, opciones jsonb, correcta, explicacion, dificultad float, veces_respondida, veces_fallada, estado: 'borrador'|'revisada'|'activa', created_at }` con RLS de lectura para autenticados y escritura service-role. Dificultad inicial = % de fallo del propio usuario; con usuarios suficientes, colectiva.
- **Interfaz:** transparente para el alumno (más preguntas en los mismos modos); panel admin mínimo para aprobar borradores (puede ser un SQL/CSV al principio).
- **Técnicas:** (1) función Netlify `banco-generar` (auth + rate limit) que produce borradores; (2) loader que mezcla banco local JSON + banco Supabase activo; (3) telemetría de respuesta (acierto/fallo por pregunta) → `pregunta_stats`.

#### P2.2 Tutor IA que conoce al alumno

- **Historia:** *Como opositor, quiero que el tutor sepa qué fallo y me explique POR QUÉ fallé, con ejemplos nuevos, en vez de responderme como a un desconocido.*
- **Técnicas:** inyectar en el system prompt de `tutor-chat`/`delta-chat` un bloque compacto: top-5 temas débiles (ratio), últimas 10 preguntas falladas (enunciado+su respuesta+correcta), calibración. Acciones rápidas en la UI del tutor: "Explícame mi último fallo", "Ponme 3 preguntas nuevas de mi tema más flojo" (genera vía practica, marca como efímeras). Detector de lagunas: 2+ fallos en la misma pregunta → crear flashcard automática "concepto crítico" (entra al mazo con nivel 0).
- **Interfaz:** chips de acción rápida sobre el input del tutor; las flashcards auto-creadas se etiquetan 🔥.
- **Datos:** ninguna tabla nueva (usa `erroresPorPregunta` de P1.1).

#### P2.3 Dashboard de rendimiento con predicción honesta

- **Historia:** *Como opositor, quiero un veredicto semanal claro: nota proyectada, cobertura del temario, retención, y QUÉ hacer esta semana.*
- **Cálculo de predicción (v1, transparente):** nota proyectada = media móvil (3 últimos simulacros) ajustada por cobertura (% temario con ≥1 vuelta) y retención media de P1.3. Mostrar SIEMPRE con banda de incertidumbre y texto "estimación orientativa" — no prometer aprobados.
- **Interfaz:** `Estadisticas.tsx` → añadir: gráfico evolución de nota, horas/semana, retención media, semáforo (verde/ámbar/rojo) + "plan de la semana" (3 acciones generadas por reglas: peor tema, backlog, simulacro pendiente).
- **Técnicas:** todo client-side sobre datos existentes + P1; sin IA.

#### P2.4 Tiempo por tema + bloques de estudio

- **Historia:** *Como opositor, quiero saber en qué temas gasto tiempo sin resultado, y estudiar en bloques con descanso.*
- **Datos:** `Progreso.tiempoPorTema: Record<temaId, segundos>`; cronómetro acumulado en TemaDetalle/Tests.
- **Interfaz:** Pomodoro opcional (25/5) como overlay discreto en TemaDetalle; en Estadísticas, scatter "tiempo vs acierto" por tema con alerta "mucho tiempo + poco acierto → cambia de método: haz test antes de releer".
- **Por qué sí aprueba más:** detecta relectura pasiva (el error nº 1 del opositor) y la reconvierte a test.

#### P2.5 Interleaving como modo de test

- **Historia:** *Como opositor, quiero un modo "Mezcla" que combine 3-4 temas que ya estudié, porque mezclar es lo que hace el examen real.*
- **Interfaz:** en Tests, modo "Mezcla inteligente" (elige automáticamente: 1 tema débil + 1 en riesgo de olvido + 1 dominado).
- **Técnicas:** reutiliza `seleccionarPreguntas` con pool multi-tema; 15 preguntas; registra en `rendimientoPorTema` normal.

### P3 — Impacto alto + desarrollo alto (roadmap estratégico, 3-12 meses)

- **P3.1 FSRS-4.5 en lugar del SM-2 simplificado.** Migrar `spaced-repetition.ts` al algoritmo FSRS (estado por tarjeta: stability, difficulty, retrievability) con parámetros por usuario. Es el estándar actual (Anki moderno); reduce repasos innecesarios ~20-30% a igual retención = más temario por hora. Migración: convertir `{nivel, intervalo}` → estado FSRS inicial estimado.
- **P3.2 Estadísticas colectivas y percentil.** Tabla `pregunta_stats` global → dificultad real por pregunta, "esta pregunta la falla el 62%", percentil del alumno en cada simulacro frente al resto. Potente para motivación y para calibrar el banco. Requiere volumen de usuarios.
- **P3.3 Simulacro adaptativo (IRT ligero).** Selección de preguntas por dificultad estimada cercana al nivel del alumno → mide mejor con menos preguntas. Solo cuando P3.2 tenga datos.
- **P3.4 Repaso pre-examen automático.** A 7 días de la convocatoria detectada: plan especial "los 40 conceptos con mayor (riesgo de olvido × importancia)" + 1 simulacro/día + veda de contenido nuevo a 48h.
- **P3.5 Modo audio de flashcards (TTS)** para repasar caminando/conduciendo — los opositores tienen tiempos muertos; el coste es medio (Web Speech API primero).
- **P3.6 Predicción de aprobado calibrada** con cohortes reales (cuando existan datos de alumnos presentados). Hasta entonces, mantener la v1 orientativa de P2.3.

## 4. Mejoras pedagógicas (mapa principio → acción)

| Principio | Acción concreta |
|---|---|
| Retrieval dirigido | P1.1 cuaderno de errores |
| Spaced repetition real | P1.4 cola elástica → P3.1 FSRS |
| Metacognición | P1.5 confianza pre-respuesta + matriz de calibración |
| Curva de olvido | P1.3 dominio con decay + "en riesgo hoy" |
| Interleaving | P2.5 modo mezcla |
| Elaboración | P2.2 tutor con contexto + "explícame mi fallo" |
| Transferencia al examen | P1.2 nota por cuerpo + estrategia de blancos |
| Deliberate practice | P2.4 tiempo vs acierto (detecta relectura pasiva) |

## 5. Mejoras UX/UI (solo las que aprueban más)

1. **Dashboard orientado a decisión**: la primera pantalla debe responder "¿qué hago AHORA?" — bloque único "Tu sesión de hoy" + "En riesgo hoy" + backlog. Ya existe la base; reordenar jerarquía visual.
2. **Resultado de test accionable**: tras corregir, el CTA primario es "Repasar falladas" (no "Volver").
3. **Temario con semáforo de dominio** (P1.3) en lugar de solo % — decisión de estudio en un vistazo.
4. **Contador de convocatoria → plan** (P1.6): convertir ansiedad en ritmo concreto.
5. **Mobile**: los modos de test deben ser usables a una mano (botones de opción grandes, ya casi). No invertir en más decoración.

## 6. Mejoras IA (con guardarraíles)

- Tutor consciente del alumno (P2.2) — la mejora IA de mayor ROI.
- Generación de banco SOLO con pipeline de revisión (P2.1) — **regla dura: ninguna pregunta IA llega al alumno sin pasar la auditoría** (`auditar-preguntas.mjs` + ojo humano). Ya sufrimos respuestas incorrectas IA-generadas; está documentado en `docs/auditoria-preguntas.txt`.
- Flashcards automáticas desde fallos repetidos (P2.2).
- Descartado: chat IA genérico adicional, resúmenes automáticos masivos (riesgo de error factual, bajo retrieval).

## 7. Roadmap 30 días (P1 completo)

Semana 1: P1.2 nota por cuerpo + cap historial 50 + P1.4 cola elástica.
Semana 2: P1.1 cuaderno de errores (datos + registro en los 3 flujos).
Semana 3: P1.1 UI re-test + P1.5 confianza en MotorTest.
Semana 4: P1.3 servicio dominio + chips en Temario/Dashboard + P1.6 plan inverso. QA + beta testers.

## 8. Roadmap 90 días (P2)

Mes 2: P2.3 dashboard predicción + P2.4 tiempo por tema + P2.5 modo mezcla.
Mes 3: P2.1 banco inteligente (tabla, generación, pipeline revisión) + P2.2 tutor con contexto + flashcards 🔥.

## 9. Roadmap 12 meses (P3)

T3: FSRS (P3.1) + repaso pre-examen (P3.4). T4: stats colectivas (P3.2) + TTS (P3.5). T+: adaptativo IRT (P3.3) y predicción calibrada (P3.6) cuando haya masa de usuarios.

## 10. Funcionalidades diferenciadoras frente a academias/apps típicas

1. Cuaderno de errores con graduación + "falsos seguros" (calibración) — casi nadie lo hace bien.
2. Riesgo de olvido visible por tema con plan diario derivado.
3. Nota y estrategia de blancos POR TRIBUNAL.
4. Tutor IA que conoce tus fallos concretos y genera tarjetas de tus lagunas.
5. Plan inverso automático desde la convocatoria real (BOC/BOE ya integrado — ventaja única de OpoDAM).

## 11. Impacto esperado (estimaciones honestas, por mecanismo)

| Mejora | Mecanismo | Impacto esperado |
|---|---|---|
| P1.1 errores | retrieval dirigido | la mayor ganancia de retención por minuto; -30-50% fallos repetidos en 4 semanas |
| P1.2 nota/cuerpo | transferencia | elimina estrategia de examen mal entrenada (riesgo directo de suspenso por blancos/arriesgos mal calibrados) |
| P1.3+P1.4 | repaso en el momento óptimo | menos olvido entre vueltas; backlog bajo control |
| P1.5 | calibración | menos errores "seguros" (los que más restan con penalización) |
| P2.1 | banco fresco | el test vuelve a medir en 3ª+ vuelta; mantiene la dificultad deseable |
| P2.2 | feedback elaborado | cierre de lagunas persistentes |
| P3.1 FSRS | eficiencia de repaso | ~20-30% menos repasos a igual retención = más temario/hora |

## 12. Descartados (no aprueban más)

- Ligas/avatares/XP cosmético (la racha ya cubre el hábito; el resto es ruido).
- Editor de mapas mentales (consumo pasivo).
- Más modos de chat IA sin contexto del alumno.
- Social/foros (fuera de foco; coste de moderación).

---

*Implementación: cada P1 está especificado a nivel de archivo y modelo de datos sobre el código actual (`spaced-repetition.ts`, `adaptativo.ts`, `examen.ts`, `storage.ts`, `Progreso`). Ningún P1 requiere tabla nueva en Supabase; P2.1 es el primero que la necesita.*
