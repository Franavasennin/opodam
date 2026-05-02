# OpoDAM Fase 2 — Contenido completo 40 temas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar los 40 ficheros JSON de contenido restantes (temas 4–23 bloque general y 26–45 bloque específico) para completar el temario completo de la oposición CGPC, y actualizar el registro de temas en `src/data/topics/index.ts`.

**Architecture:** Cada fichero `tema-NN.json` sigue exactamente la misma interfaz TypeScript `Tema` que los 5 ya existentes. Cada tarea crea 5 ficheros JSON de contenido real sobre Derecho Constitucional, Administrativo, Penal y materias específicas de la Policía Canaria, y actualiza `index.ts` en lotes.

**Tech Stack:** JSON estático, TypeScript interfaces existentes en `src/types/index.ts`, React + Vite ya configurado.

---

## Estructura JSON obligatoria

Cada fichero `src/data/topics/tema-NN.json` (con NN de 2 dígitos, ej: `tema-04.json`) debe seguir **exactamente** esta interfaz:

```typescript
interface Tema {
  id: number                    // número del tema
  titulo: string                // título completo
  bloque: 'general' | 'especifico'
  secciones: Array<{            // mínimo 5 secciones
    titulo: string
    contenido: string           // mínimo 300 palabras por sección
  }>
  esquemas: Array<{             // exactamente 2 esquemas
    tipo: 'mermaid'
    titulo: string
    codigo: string              // código Mermaid válido (graph TD o graph LR)
  }>
  mapaMental: {
    nodos: Array<{              // 12-13 nodos
      id: string
      data: { label: string }
      position: { x: number; y: number }
    }>
    aristas: Array<{            // edges conectando nodos
      id: string
      source: string
      target: string
      label?: string
    }>
  }
  flashcards: Array<{           // mínimo 20 flashcards
    id: string                  // "tNN-fNN" ej: "t04-f01"
    pregunta: string
    respuesta: string           // respuesta completa y detallada
  }>
  preguntas: Array<{            // exactamente 15 preguntas
    id: string                  // "tNN-qNN" ej: "t04-q01"
    enunciado: string
    opciones: [string, string, string]  // exactamente 3 opciones
    correcta: 0 | 1 | 2        // índice de la opción correcta — VARIAR entre 0,1,2
    explicacion: string         // explicación del por qué es correcta
  }>
}
```

**Reglas críticas:**
- `id` de flashcards: formato `"t{id}-f{nn}"` con `nn` de 2 dígitos (01, 02…)
- `id` de preguntas: formato `"t{id}-q{nn}"` con `nn` de 2 dígitos (01, 02…)
- `correcta` debe variar entre 0, 1 y 2 (no siempre el mismo índice)
- Contenido real y preciso sobre la legislación española y canaria
- El nodo raíz del mapa mental tiene id `"root"`

---

## Task 1: Actualizar index.ts con los 45 temas

**Files:**
- Modify: `src/data/topics/index.ts`

- [ ] **Step 1: Reemplazar completamente `src/data/topics/index.ts`**

```typescript
import type { Tema } from '../../types';

export const TEMAS_META = [
  // Bloque General
  { id: 1,  titulo: 'La Constitución Española de 1978. Estructura y contenido. Derechos y deberes fundamentales. Los estados excepcionales', bloque: 'general' },
  { id: 2,  titulo: 'La Corona. Funciones constitucionales del Rey. El refrendo', bloque: 'general' },
  { id: 3,  titulo: 'Las Cortes Generales. El Congreso y el Senado. La función legislativa. Relaciones Gobierno-Cortes', bloque: 'general' },
  { id: 4,  titulo: 'El Gobierno. El Presidente del Gobierno. Los Ministros. Las Comisiones Delegadas. El Consejo de Estado', bloque: 'general' },
  { id: 5,  titulo: 'El Poder Judicial. El Tribunal Constitucional. El Tribunal Supremo. El Consejo General del Poder Judicial', bloque: 'general' },
  { id: 6,  titulo: 'La organización territorial del Estado. Las Comunidades Autónomas. Los Estatutos de Autonomía. La financiación autonómica', bloque: 'general' },
  { id: 7,  titulo: 'La Comunidad Autónoma de Canarias. El Estatuto de Autonomía de Canarias. El Parlamento de Canarias. El Gobierno de Canarias', bloque: 'general' },
  { id: 8,  titulo: 'La Administración Pública. Principios constitucionales. La Administración del Estado. La Administración Local. La Administración Autonómica', bloque: 'general' },
  { id: 9,  titulo: 'El acto administrativo. Concepto, elementos y clases. La notificación. El silencio administrativo. La ejecución forzosa', bloque: 'general' },
  { id: 10, titulo: 'El procedimiento administrativo. La Ley 39/2015. Fases. Los recursos administrativos: alzada, reposición y revisión', bloque: 'general' },
  { id: 11, titulo: 'La responsabilidad patrimonial de la Administración Pública. Requisitos. El procedimiento. La acción de regreso', bloque: 'general' },
  { id: 12, titulo: 'El personal al servicio de las Administraciones Públicas. Clases. Derechos y deberes. Incompatibilidades. Régimen disciplinario', bloque: 'general' },
  { id: 13, titulo: 'Los contratos del sector público. Ley 9/2017 LCSP. Tipos. El contrato de obras. El contrato de servicios. Garantías', bloque: 'general' },
  { id: 14, titulo: 'El Código Penal. Concepto y principios. La infracción penal. Circunstancias modificativas de la responsabilidad criminal. Las penas', bloque: 'general' },
  { id: 15, titulo: 'Delitos contra la vida e integridad física. Homicidio. Asesinato. Lesiones. El delito de violencia habitual', bloque: 'general' },
  { id: 16, titulo: 'Delitos contra la libertad. Detenciones ilegales y secuestro. Amenazas. Coacciones. Acoso', bloque: 'general' },
  { id: 17, titulo: 'Delitos contra el patrimonio. Robo. Hurto. Estafa. Apropiación indebida. Daños. Receptación', bloque: 'general' },
  { id: 18, titulo: 'Delitos contra la salud pública. Tráfico de drogas. Delitos contra la seguridad vial', bloque: 'general' },
  { id: 19, titulo: 'Delitos contra la Administración Pública. Prevaricación. Cohecho. Tráfico de influencias. Malversación. Fraudes', bloque: 'general' },
  { id: 20, titulo: 'Delitos contra el orden público. Sedición. Atentado. Resistencia. Desobediencia. Desórdenes públicos', bloque: 'general' },
  { id: 21, titulo: 'La Ley de Enjuiciamiento Criminal. El proceso penal. La detención. La prisión provisional. El juicio oral', bloque: 'general' },
  { id: 22, titulo: 'La protección de datos. El RGPD. La LO 3/2018. La Agencia Española de Protección de Datos. Derechos ARCO', bloque: 'general' },
  { id: 23, titulo: 'La Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana. Infracciones y sanciones. El derecho de reunión', bloque: 'general' },
  // Bloque Específico
  { id: 24, titulo: 'Las Fuerzas y Cuerpos de Seguridad. LO 2/1986. Principios básicos de actuación. Policías de las CCAA y Policías Locales', bloque: 'especifico' },
  { id: 25, titulo: 'El Sistema Canario de Seguridad y Emergencias. La Ley 9/2007. CECOES 1-1-2', bloque: 'especifico' },
  { id: 26, titulo: 'El personal de la Policía Canaria. Decreto 87/2021. Estructura de la Policía Canaria. Régimen disciplinario', bloque: 'especifico' },
  { id: 27, titulo: 'La coordinación de las Policías Locales de Canarias. Ley 6/1997. Homologación. La Junta de Coordinación', bloque: 'especifico' },
  { id: 28, titulo: 'Deontología policial. El Código Europeo de Ética Policial. Declaración de Barcelona. Derechos humanos y policía', bloque: 'especifico' },
  { id: 29, titulo: 'Los derechos fundamentales en la actuación policial. La detención policial. El registro de personas y lugares. La entrada en domicilio', bloque: 'especifico' },
  { id: 30, titulo: 'La identificación de personas. Las diligencias de identificación. Cacheos. Las restricciones de derechos en la actuación policial', bloque: 'especifico' },
  { id: 31, titulo: 'La violencia de género. LO 1/2004. Protocolos de actuación policial ante la violencia de género. La orden de protección', bloque: 'especifico' },
  { id: 32, titulo: 'La protección de menores. LO 1/1996. La Ley de Protección de la Infancia. Actuación policial ante menores', bloque: 'especifico' },
  { id: 33, titulo: 'El tráfico y la seguridad vial. RDL 6/2015. El permiso de conducir por puntos. Las infracciones de tráfico. El atestado de accidente', bloque: 'especifico' },
  { id: 34, titulo: 'Las armas. Reglamento de Armas RD 137/1993. Clases de armas. El uso de armas por la policía. La legítima defensa', bloque: 'especifico' },
  { id: 35, titulo: 'La policía administrativa. Las infracciones administrativas. El procedimiento sancionador. La potestad inspectora', bloque: 'especifico' },
  { id: 36, titulo: 'La policía de proximidad. La mediación policial. El policía comunitario. Relaciones policía-ciudadano', bloque: 'especifico' },
  { id: 37, titulo: 'La criminalística. El atestado policial. Las pruebas periciales. La cadena de custodia. La inspección ocular', bloque: 'especifico' },
  { id: 38, titulo: 'Las emergencias y la protección civil. El Plan Territorial de Emergencias de Canarias (PLATECA). Actuación policial en emergencias', bloque: 'especifico' },
  { id: 39, titulo: 'La seguridad privada. Ley 5/2014. Los vigilantes de seguridad. Coordinación con las Fuerzas y Cuerpos de Seguridad', bloque: 'especifico' },
  { id: 40, titulo: 'Las comunicaciones policiales. Las transmisiones. El Sistema de Información Schengen (SIS). Las bases de datos policiales', bloque: 'especifico' },
  { id: 41, titulo: 'El uso de la fuerza policial. Los principios de proporcionalidad, congruencia y oportunidad. Las esposas y otros medios coercitivos', bloque: 'especifico' },
  { id: 42, titulo: 'Los primeros auxilios. El soporte vital básico. La RCP. Actuación policial ante accidentes y urgencias sanitarias', bloque: 'especifico' },
  { id: 43, titulo: 'La geografía de Canarias. Las islas y municipios. Aspectos físicos, sociodemográficos y económicos', bloque: 'especifico' },
  { id: 44, titulo: 'La economía de Canarias. El Régimen Económico y Fiscal canario (REF). El turismo. La agricultura. La pesca', bloque: 'especifico' },
  { id: 45, titulo: 'Las instituciones canarias. El Parlamento de Canarias. El Gobierno. El Presidente. El Defensor del Pueblo canario. El Consejo Consultivo', bloque: 'especifico' },
] as const;

export type TemaMeta = typeof TEMAS_META[number];
export const TOTAL_TEMAS = TEMAS_META.length; // 45

const TEMA_FILE_MAP: Record<number, string> = {
  1: 'tema-01', 2: 'tema-02', 3: 'tema-03', 4: 'tema-04', 5: 'tema-05',
  6: 'tema-06', 7: 'tema-07', 8: 'tema-08', 9: 'tema-09', 10: 'tema-10',
  11: 'tema-11', 12: 'tema-12', 13: 'tema-13', 14: 'tema-14', 15: 'tema-15',
  16: 'tema-16', 17: 'tema-17', 18: 'tema-18', 19: 'tema-19', 20: 'tema-20',
  21: 'tema-21', 22: 'tema-22', 23: 'tema-23', 24: 'tema-24', 25: 'tema-25',
  26: 'tema-26', 27: 'tema-27', 28: 'tema-28', 29: 'tema-29', 30: 'tema-30',
  31: 'tema-31', 32: 'tema-32', 33: 'tema-33', 34: 'tema-34', 35: 'tema-35',
  36: 'tema-36', 37: 'tema-37', 38: 'tema-38', 39: 'tema-39', 40: 'tema-40',
  41: 'tema-41', 42: 'tema-42', 43: 'tema-43', 44: 'tema-44', 45: 'tema-45',
};

export async function cargarTema(id: number): Promise<Tema> {
  const fileName = TEMA_FILE_MAP[id];
  if (!fileName) throw new Error(`Tema con id ${id} no encontrado`);
  const modulo = await import(`./${fileName}.json`);
  return modulo.default as Tema;
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam" && npx tsc --noEmit
```
Expected: sin errores (los JSON faltantes no se verifican hasta runtime).

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
git add src/data/topics/index.ts
git commit -m "feat: register all 45 topics in TEMAS_META and TEMA_FILE_MAP"
```

---

## Task 2: Temas 4–8 JSON (Gobierno, Poder Judicial, CCAA, Canarias, Admón Pública)

**Files:**
- Create: `src/data/topics/tema-04.json`
- Create: `src/data/topics/tema-05.json`
- Create: `src/data/topics/tema-06.json`
- Create: `src/data/topics/tema-07.json`
- Create: `src/data/topics/tema-08.json`

**Tema 4 — El Gobierno** (`id:4, bloque:"general"`):
- Secciones: (1) Composición del Gobierno Art.98 CE: Presidente, Vicepresidentes, Ministros y otros miembros; (2) Nombramiento e investidura del Presidente: Art.99 CE, candidato propuesto por el Rey, mayoría absoluta 1ª votación o simple 2ª, plazo 2 meses para nueva propuesta; (3) Funciones del Presidente: Art.98.2 CE, dirección acción gubernamental, coordinación ministros, propuesta nombramientos; (4) Las Comisiones Delegadas del Gobierno: coordinación sectorial, composición flexible por RD; (5) El Consejo de Estado: Art.107 CE, supremo órgano consultivo, Pleno y Comisión Permanente, dictámenes preceptivos
- Mermaid 1: proceso de investidura (Rey→candidato→Congreso→mayoría→nombramiento)
- Mermaid 2: composición del Consejo de Ministros y Comisiones Delegadas

**Tema 5 — El Poder Judicial** (`id:5, bloque:"general"`):
- Secciones: (1) El Poder Judicial: Art.117 CE independencia, exclusividad, unidad jurisdiccional; (2) El Tribunal Supremo: sala de lo civil, penal, contencioso-administrativo, social, militar; (3) El Tribunal Constitucional: Arts.159-165 CE, 12 magistrados, mandato 9 años, recurso de inconstitucionalidad/amparo/conflicto; (4) El Consejo General del Poder Judicial: 20 vocales elegidos por Cortes (12 jueces+8 juristas), mandato 5 años, gobierno del Poder Judicial; (5) El Ministerio Fiscal: Art.124 CE, principios de unidad, dependencia jerárquica, legalidad e imparcialidad
- Mermaid 1: organización de la jurisdicción ordinaria (TS→TSJ→AP→Juzgados)
- Mermaid 2: recursos ante el TC (inconstitucionalidad, amparo, conflictos competenciales)

**Tema 6 — Organización territorial** (`id:6, bloque:"general"`):
- Secciones: (1) El Estado de las Autonomías: Arts.137-158 CE, principios de autonomía, solidaridad, igualdad; (2) Acceso a la autonomía: vía Art.143 (lenta, iniciativa provincial) vs Art.151 (rápida, referéndum); (3) Los Estatutos de Autonomía: naturaleza jurídica, contenido mínimo, reforma; (4) Distribución de competencias: Art.148 (CCAA), Art.149 (Estado exclusivas), cláusula residual; (5) La financiación autonómica: LOFCA, régimen común vs foral (País Vasco y Navarra)
- Mermaid 1: vías de acceso a la autonomía (Art.143 vs Art.151)
- Mermaid 2: distribución de competencias Estado-CCAA

**Tema 7 — CA de Canarias** (`id:7, bloque:"general"`):
- Secciones: (1) El Estatuto de Autonomía de Canarias LO 1/2018: estructura, derechos estatutarios; (2) El Parlamento de Canarias: 70 diputados, circunscripción insular, funciones legislativas y control; (3) El Gobierno de Canarias: Presidente (electo por Parlamento), Consejeros, Comisiones Delegadas; (4) Los Cabildos Insulares: instituciones propias de Canarias, competencias en cada isla; (5) El Régimen Económico y Fiscal (REF): Ley 19/1994, IGIC 7%, ZEC, puertos francos
- Mermaid 1: Instituciones de Canarias (Parlamento→Gobierno→Cabildos→Ayuntamientos)
- Mermaid 2: Organización territorial de Canarias (2 provincias, 7 islas habitadas, 88 municipios)

**Tema 8 — La Administración Pública** (`id:8, bloque:"general"`):
- Secciones: (1) Principios constitucionales: Art.103 CE (eficacia, jerarquía, descentralización, desconcentración, coordinación, objetividad, sometimiento a la ley); (2) La AGE: órganos centrales (Ministros, Secretarios de Estado) y periféricos (Delegados del Gobierno); (3) La Administración Local: Municipio (pleno, alcalde, tenientes de alcalde), Provincia (Diputación); (4) La Administración Autonómica canaria: Consejerías, organismos autónomos; (5) Las Administraciones Independientes: AEPD, CNMC, Banco de España, función regulatoria
- Mermaid 1: niveles de la Administración Pública (Estado→CCAA→Local)
- Mermaid 2: estructura del Municipio (órganos necesarios y complementarios)

- [ ] **Step 1: Crear `src/data/topics/tema-04.json`** con todo el contenido completo según especificación anterior (5 secciones ≥300 palabras c/u, 2 esquemas Mermaid, 12 nodos React Flow, ≥20 flashcards, 15 preguntas con `correcta` variando entre 0/1/2).

- [ ] **Step 2: Crear `src/data/topics/tema-05.json`** ídem.

- [ ] **Step 3: Crear `src/data/topics/tema-06.json`** ídem.

- [ ] **Step 4: Crear `src/data/topics/tema-07.json`** ídem.

- [ ] **Step 5: Crear `src/data/topics/tema-08.json`** ídem.

- [ ] **Step 6: Verificar JSON válido**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "
['04','05','06','07','08'].forEach(n => {
  const t = require('./src/data/topics/tema-' + n + '.json');
  const ok = t.secciones.length>=5 && t.esquemas.length===2 && t.mapaMental.nodos.length>=12 && t.flashcards.length>=20 && t.preguntas.length===15;
  console.log('T'+n+': '+(ok?'OK':'FAIL')+' | s='+t.secciones.length+' e='+t.esquemas.length+' n='+t.mapaMental.nodos.length+' f='+t.flashcards.length+' p='+t.preguntas.length);
})
"
```
Expected: todas las líneas muestran `OK`.

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-04.json src/data/topics/tema-05.json src/data/topics/tema-06.json src/data/topics/tema-07.json src/data/topics/tema-08.json
git commit -m "feat: content JSON for topics 4-8 (Gobierno, Poder Judicial, CCAA, Canarias, Admón)"
```

---

## Task 3: Temas 9–13 JSON (Acto adm., Procedimiento, Responsabilidad, Personal, Contratos)

**Files:**
- Create: `src/data/topics/tema-09.json` through `tema-13.json`

**Tema 9 — El acto administrativo** (`id:9, bloque:"general"`):
- Secciones: (1) Concepto y elementos: declaración de voluntad, elementos subjetivos (órgano competente), objetivos (objeto, causa, fin) y formales (motivación, forma); (2) Clases: resolutorios/de trámite, favorables/de gravamen, expresos/presuntos, simples/complejos; (3) La notificación: Arts.40-44 Ley 39/2015, plazo 10 días, notificación electrónica obligatoria para personas jurídicas, notificación edictal; (4) El silencio administrativo: Art.24 positivo como regla general; Art.25 silencio negativo en recursos; plazos de resolución 3 meses salvo norma especial; (5) Ejecución forzosa: apremio sobre patrimonio, ejecución subsidiaria, multas coercitivas (no sancionadoras), compulsión sobre personas
- Mermaid 1: clases de actos administrativos
- Mermaid 2: silencio administrativo (plazos y efectos positivo vs negativo)

**Tema 10 — Procedimiento administrativo** (`id:10, bloque:"general"`):
- Secciones: (1) La Ley 39/2015 LPACAP: principios, ámbito, relaciones electrónicas obligatorias; (2) Iniciación: de oficio (acuerdo del órgano) o a instancia de parte (solicitud, registro); (3) Instrucción: alegaciones (plazo 10-15 días), informes (preceptivos/facultativos, vinculantes/no vinculantes), información pública, audiencia; (4) Terminación: resolución (congruente con peticiones), desistimiento, renuncia, caducidad (3 meses de paralización); (5) Recursos administrativos: alzada (1 mes actos expresos, 3 meses silencio, ante órgano superior), reposición potestativa (1 mes), revisión extraordinaria (4 causas tasadas)
- Mermaid 1: fases del procedimiento administrativo
- Mermaid 2: recursos administrativos (alzada, reposición, revisión — plazos)

**Tema 11 — Responsabilidad patrimonial** (`id:11, bloque:"general"`):
- Secciones: (1) Fundamento constitucional: Art.106.2 CE, toda lesión que sea consecuencia del funcionamiento de los servicios públicos; (2) Requisitos: lesión antijurídica (que el ciudadano no tenga el deber de soportar), imputabilidad a la Administración, nexo causal, que no sea fuerza mayor; (3) El procedimiento: Arts.32-35 Ley 39/2015, solicitud del interesado o de oficio, dictamen Consejo de Estado en casos ≥50.000€, plazo resolución 6 meses; (4) La prescripción: 1 año desde que se conoce el daño (o desde consolidación de secuelas en lesiones); (5) Acción de regreso y responsabilidad del personal: la Administración puede repetir contra el funcionario causante si actuó con dolo, culpa o negligencia graves
- Mermaid 1: requisitos de la responsabilidad patrimonial
- Mermaid 2: procedimiento de responsabilidad patrimonial

**Tema 12 — Personal de las AAPP** (`id:12, bloque:"general"`):
- Secciones: (1) Clases de empleados públicos: funcionarios de carrera (relación estatutaria), interinos (plazas vacantes o temporales), personal laboral (contrato trabajo) y eventual (confianza política); (2) Derechos: retribuciones, carrera profesional, formación, jornada, vacaciones, negociación colectiva; (3) Deberes: lealtad constitucional, neutralidad, objetividad, sigilo profesional; (4) Incompatibilidades: Ley 53/1984, principio de dedicación exclusiva, autorizaciones y reconocimientos; (5) Régimen disciplinario TREBEP: faltas muy graves (separación del servicio, suspensión 3-6 años), graves (suspensión 1 mes-3 años), leves (apercibimiento, suspensión hasta 1 mes)
- Mermaid 1: clases de empleados públicos y su régimen jurídico
- Mermaid 2: régimen disciplinario (faltas y sanciones)

**Tema 13 — Contratos del sector público** (`id:13, bloque:"general"`):
- Secciones: (1) La Ley 9/2017 LCSP: objeto, ámbito subjetivo (poder adjudicador) y objetivo (contratos sujetos a regulación armonizada); (2) Tipos de contratos: obras, concesión de obras, concesión de servicios, suministros, servicios, mixtos; (3) Procedimientos de adjudicación: abierto (regla general), restringido, negociado (con/sin publicidad), diálogo competitivo, asociación para la innovación; (4) Las garantías: provisional (excepcional) y definitiva 5% del precio de adjudicación (o 10% si es precio anormalmente bajo); (5) Ejecución y extinción: modificación, suspensión, resolución del contrato, penalidades por demora
- Mermaid 1: tipos de contratos del sector público
- Mermaid 2: procedimientos de adjudicación (abierto, restringido, negociado)

- [ ] **Step 1-5:** Crear `tema-09.json` a `tema-13.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['09','10','11','12','13'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-09.json src/data/topics/tema-10.json src/data/topics/tema-11.json src/data/topics/tema-12.json src/data/topics/tema-13.json
git commit -m "feat: content JSON for topics 9-13 (acto adm, procedimiento, responsabilidad, personal, contratos)"
```

---

## Task 4: Temas 14–18 JSON (Derecho Penal — CP y delitos principales)

**Files:**
- Create: `src/data/topics/tema-14.json` through `tema-18.json`

**Tema 14 — El Código Penal** (`id:14, bloque:"general"`):
- Secciones: (1) Principios del Derecho Penal: legalidad (nullum crimen sine lege), culpabilidad, proporcionalidad, intervención mínima, resocialización; (2) La infracción penal: delito doloso (conocimiento y voluntad), imprudente (infracción deber de cuidado); iter criminis: actos preparatorios (conspiración, proposición, provocación), tentativa (Art.16), consumación; (3) Autoría y participación: autor directo, coautor, autor mediato; inductor (Art.28), cooperador necesario (Art.28), cómplice (Art.29); (4) Circunstancias modificativas: eximentes Art.20 (enajenación mental, intoxicación plena, legítima defensa, estado de necesidad, miedo insuperable), atenuantes Art.21, agravantes Art.22 (alevosía, precio, disfraz, reincidencia), mixta parentesco Art.23; (5) Las penas: privativas libertad (prisión, localización permanente), privativas derechos (inhabilitación, suspensión), multa (cuota diaria). Reglas determinación: grado de ejecución y participación
- Mermaid 1: iter criminis (fases de ejecución del delito)
- Mermaid 2: circunstancias modificativas de la responsabilidad criminal

**Tema 15 — Delitos contra vida e integridad** (`id:15, bloque:"general"`):
- Secciones: (1) Homicidio: Art.138 CP 10-15 años prisión; homicidio imprudente grave Art.142 (1-4 años), menos grave (3-18 meses multa); (2) Asesinato: Art.139 (15-25 años) — concurrencia de: alevosía, precio/recompensa/promesa, ensañamiento, para facilitar la comisión de otro delito o para evitar ser descubierto; asesinato hiperagravado Art.140 (prisión permanente revisable); (3) Lesiones: Art.147.1 (6 meses-3 años lesión que requiere tratamiento médico), agravadas Arts.149-150 (pérdida de órgano/sentido, gran invalidez); (4) Lesiones al feto Arts.157-158; (5) Violencia habitual en el ámbito familiar Art.173.2 (6 meses-3 años + inhabilitación)
- Mermaid 1: diferencia homicidio/asesinato (circunstancias cualificantes)
- Mermaid 2: tipos y penas de lesiones (Art.147, 149, 150)

**Tema 16 — Delitos contra la libertad** (`id:16, bloque:"general"`):
- Secciones: (1) Detenciones ilegales: Art.163 (4-6 años); si dura más de 15 días o pone en peligro la vida 5-8 años; si la víctima es menor de edad o persona con discapacidad 5-9 años; (2) Secuestro con condición: Art.164 (6-10 años); (3) Amenazas: Arts.169-171 — condicionales con mal constitutivo de delito (1-5 años), con armas u otros instrumentos peligrosos (1-3 años), leves (localización permanente o multa); (4) Coacciones: Art.172 — violencia para impedir acto lícito o compeler a acto no querido (6 meses-3 años); leves (multa); (5) Acoso u hostigamiento stalking: Art.172 ter — conductas reiteradas de vigilancia, comunicación no deseada (3 meses-2 años), agravado cuando víctima es pareja o ex (1-2 años)
- Mermaid 1: detención ilegal vs secuestro (comparativa penas)
- Mermaid 2: tipos de amenazas y coacciones

**Tema 17 — Delitos contra el patrimonio** (`id:17, bloque:"general"`):
- Secciones: (1) Robo con fuerza en las cosas: Arts.237-241 (1-3 años; agravado si es casa habitada 2-5 años); robo con violencia o intimidación: Art.242 (2-5 años, si uso de armas 3,5-5 años); (2) Hurto: Art.234 — sustracción sin violencia ni intimidación (6-18 meses si ≥400€; multa si <400€); agravado Art.235 si habitualidad, uso de menores, vulnerabilidad víctima; (3) Estafa: Art.248 — engaño bastante, error en el sujeto pasivo, disposición patrimonial, ánimo de lucro (6 meses-3 años; agravada >50.000€ 1-6 años); (4) Apropiación indebida: Art.253 (6 meses-3 años); administración desleal Art.252; (5) Receptación y blanqueo: Art.298 (6 meses-2 años receptación), Art.301 blanqueo de capitales (6 meses-6 años)
- Mermaid 1: comparativa robo/hurto (elementos diferenciadores)
- Mermaid 2: cuantías y agravantes en delitos patrimoniales

**Tema 18 — Salud pública y seguridad vial** (`id:18, bloque:"general"`):
- Secciones: (1) Delitos contra la salud pública: Arts.359-378 CP — elaboración/despacho de sustancias nocivas o peligrosas; (2) Tráfico de drogas: Art.368 — sustancias que causan grave daño a la salud (cocaína, heroína: 3-6 años y multa) vs resto (cannabis: 1-3 años y multa); agravantes: cantidad de notoria importancia, organización, menores, establecimientos públicos; (3) Delitos contra la seguridad vial: Arts.379-385 — conducción a velocidad excesiva (Art.379.1: >60 km/h en ciudad o >80 km/h en interurbana), bajo influencia alcohol/drogas (Art.379.2: ≥0,25 mg/l aire espirado o ≥0,60 g/l sangre), conducción temeraria (Art.380); (4) Negativa a pruebas de alcoholemia Art.383: 6 meses-1 año prisión o multa 12-24 meses; (5) Conducción con temeridad manifiesta causando peligro concreto Art.380 (6 meses-2 años)
- Mermaid 1: tipos de tráfico de drogas y penas (Art.368)
- Mermaid 2: delitos contra la seguridad vial (Arts.379-385) y tasas

- [ ] **Step 1-5:** Crear `tema-14.json` a `tema-18.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['14','15','16','17','18'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-14.json src/data/topics/tema-15.json src/data/topics/tema-16.json src/data/topics/tema-17.json src/data/topics/tema-18.json
git commit -m "feat: content JSON for topics 14-18 (CP, homicidio/lesiones, libertad, patrimonio, salud pública)"
```

---

## Task 5: Temas 19–23 JSON (Delitos admón, orden público, LECrim, LOPD, Seg. Ciudadana)

**Files:**
- Create: `src/data/topics/tema-19.json` through `tema-23.json`

**Tema 19 — Delitos contra la Admón Pública** (`id:19, bloque:"general"`):
- Secciones: (1) Prevaricación: Art.404 (inhabilitación especial 7-10 años) — resolución arbitraria a sabiendas de su injusticia; (2) Cohecho: pasivo propio Art.419 (2-6 años + multa, inhabilitación 7-12 años) — funcionario que solicita/acepta dádiva para realizar acto injusto; cohecho impropio Art.420; activo Art.424; (3) Tráfico de influencias: Arts.428-431 — influir en funcionario prevaliéndose de la relación personal (6 meses-2 años y multa); (4) Malversación: Art.432 (2-6 años) — sustracción o consentimiento de sustracción de caudales públicos; (5) Fraudes y exacciones ilegales: Arts.436-438; negociaciones prohibidas a funcionarios Art.439-440
- Mermaid 1: tipos de cohecho (activo vs pasivo, propio vs impropio)
- Mermaid 2: comparativa delitos de funcionarios (prevaricación, cohecho, malversación)

**Tema 20 — Delitos contra el orden público** (`id:20, bloque:"general"`):
- Secciones: (1) Sedición derogada por LO 14/2022 — sustituida por delito de desórdenes públicos agravados y desobediencia grave; (2) Atentado: Art.550 CP — agresión o acometimiento a autoridad/agente/funcionario en ejercicio funciones (1-4 años; con armas/medios peligrosos 2-6 años; si víctima es agente seguridad 2-4 años básico); (3) Resistencia y desobediencia: Art.556 — resistencia activa grave o desobediencia grave (3 meses-1 año); (4) Desórdenes públicos: Art.557 — actuación en grupo con violencia/intimidación afectando bienes/personas (6 meses-3 años); (5) Tenencia de explosivos y terrorismo: Arts.570 bis y ss — organización criminal (colaboración 6 meses-2 años, dirección 4-8 años)
- Mermaid 1: diferencia atentado/resistencia/desobediencia
- Mermaid 2: penas en delitos contra el orden público según circunstancias

**Tema 21 — La LECrim** (`id:21, bloque:"general"`):
- Secciones: (1) El proceso penal: principios acusatorio, contradicción, publicidad, oralidad, inmediación; tipos: ordinario (delitos graves), abreviado (penas <9 años), jurado, menores, rápido; (2) La detención policial: motivos (Art.492 y 495 LECrim), plazo 72 horas prorrogable 48h por juez, puesta a disposición judicial; (3) Derechos del detenido Art.520: información cargos, asistencia letrada (de oficio si no tiene), intérprete, médico forense, notificación familiar/consular, comunicación telefónica; (4) La prisión provisional: Arts.502-519 — requisitos (indicios delito, riesgo fuga/reiteración/destrucción pruebas), plazo máximo 2 años (prorrogable a 4 para penas >6 años); (5) El juicio oral: acusación provisional y definitiva, práctica de prueba, informes, última palabra, sentencia
- Mermaid 1: fases del proceso penal abreviado
- Mermaid 2: derechos del detenido Art.520 LECrim

**Tema 22 — Protección de datos** (`id:22, bloque:"general"`):
- Secciones: (1) El RGPD (UE) 2016/679: aplicación directa desde 25/05/2018, principios (licitud, lealtad, transparencia, limitación de finalidad, minimización, exactitud, limitación conservación, integridad); (2) Bases de legitimación del tratamiento: consentimiento, contrato, obligación legal, interés vital, interés público, interés legítimo; (3) La LO 3/2018 LOPDGDD: adaptación española del RGPD, derechos digitales (rectificación en internet, desconexión laboral, privacidad ante IA); (4) Derechos ARCO+: acceso (1 mes), rectificación, supresión (derecho al olvido), oposición, portabilidad, limitación del tratamiento; (5) La AEPD: autoridad de control independiente, poderes de investigación y sanción (multas hasta 20M€ o 4% facturación global); DPD obligatorio en AAPP
- Mermaid 1: principios del RGPD y bases de legitimación
- Mermaid 2: derechos ARCO+ y plazos de respuesta

**Tema 23 — Ley de Seguridad Ciudadana** (`id:23, bloque:"general"`):
- Secciones: (1) La LO 4/2015: objeto (proteger la seguridad ciudadana y el libre ejercicio de derechos), principios (legalidad, intervención mínima, proporcionalidad, eficiencia); (2) Las actuaciones para el mantenimiento de la seguridad: identificación, registros, controles, disolución de reuniones; (3) Infracciones muy graves: multa 30.001-600.000€ (ej: desórdenes graves en actos públicos, uso de imágenes agentes para atentar contra su honor); (4) Infracciones graves: multa 601-30.000€ (ej: falta de respeto a agentes, desobediencia a órdenes de dispersión, reuniones no comunicadas); (5) Infracciones leves: multa 100-600€ (ej: consumo de alcohol en vía pública, infracciones menores). El derecho de reunión: LO 9/1983, comunicación previa 10 días para reuniones en lugares de tránsito
- Mermaid 1: tipos de infracciones LO 4/2015 y cuantías
- Mermaid 2: el derecho de reunión (LO 9/1983) — comunicación y prohibición

- [ ] **Step 1-5:** Crear `tema-19.json` a `tema-23.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['19','20','21','22','23'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-19.json src/data/topics/tema-20.json src/data/topics/tema-21.json src/data/topics/tema-22.json src/data/topics/tema-23.json
git commit -m "feat: content JSON for topics 19-23 (delitos admón, orden público, LECrim, LOPD, Seg. Ciudadana)"
```

---

## Task 6: Temas 26–30 JSON (Personal Policía Canaria, Coord., Deontología, DDHH, Identificación)

**Files:**
- Create: `src/data/topics/tema-26.json` through `tema-30.json`

**Tema 26 — Personal de la Policía Canaria** (`id:26, bloque:"especifico"`):
- Secciones: (1) Estructura de la Policía Canaria: Escala Superior (Comisarios y Inspectores Jefe), Escala Ejecutiva (Inspectores), Escala de Subinspección (Subinspectores), Escala Básica (Oficiales, Agentes); (2) El Decreto 87/2021: ingreso por oposición libre y promoción interna, formación en Academia Canaria de Seguridad, período de prácticas; (3) Derechos del personal: retribuciones, uniformidad, armas, carrera profesional, negociación colectiva, asistencia jurídica; (4) Deberes: cumplimiento de órdenes, secreto profesional, trato correcto a ciudadanos, uso proporcional de la fuerza; (5) Régimen disciplinario: faltas muy graves (separación del servicio, suspensión 3-6 años), graves (suspensión 1 mes-3 años), leves (apercibimiento, suspensión hasta 1 mes); prescripción 10/3/1 años
- Mermaid 1: estructura jerárquica de la Policía Canaria (escalas y categorías)
- Mermaid 2: régimen disciplinario (faltas, sanciones y prescripción)

**Tema 27 — Coordinación Policías Locales** (`id:27, bloque:"especifico"`):
- Secciones: (1) La Ley 6/1997 de Coordinación de las Policías Locales de Canarias: objeto, ámbito; (2) La Junta de Coordinación de Policías Locales: composición (representantes Gobierno Canario y ayuntamientos), funciones coordinadoras; (3) La homologación: uniformidad de medios, equipos, armas reglamentarias; uniformes homologados; (4) La Academia Canaria de Seguridad: formación, selección, cursos de ascenso, colaboración con universidades; (5) Los convenios interadministrativos: colaboración Policía Canaria-Policías Locales-Cuerpo Nacional de Policía-Guardia Civil
- Mermaid 1: sistema de coordinación policial en Canarias
- Mermaid 2: estructura de la Academia Canaria de Seguridad

**Tema 28 — Deontología policial** (`id:28, bloque:"especifico"`):
- Secciones: (1) El Código Europeo de Ética Policial Rec 2001/10: elaboración democrática, legalidad, proporcionalidad, no discriminación, rendición de cuentas, formación continua; (2) La Declaración de Barcelona (2000): policía democrática, DDHH, servicio público; (3) Los 10 principios básicos de actuación de la LO 2/1986 Art.5: adecuación al ordenamiento, jerarquía, colaboración con autoridades, relación con la comunidad, proporcionalidad, secreto profesional, respeto a la Constitución, dedicación, integridad, neutralidad política; (4) El Convenio Europeo de DDHH y la actuación policial: Arts.2 (vida), 3 (prohibición tortura), 5 (libertad), 6 (proceso justo), 8 (vida privada); (5) Integridad y lucha contra la corrupción: GRECO recomendaciones, denuncias internas, protección del denunciante
- Mermaid 1: principios básicos de actuación (LO 2/1986 Art.5)
- Mermaid 2: CEDH y derechos protegidos en la actuación policial

**Tema 29 — Derechos fundamentales en actuación policial** (`id:29, bloque:"especifico"`):
- Secciones: (1) La detención policial: fundamento legal (Art.492 LECrim — in fraganti, indicios racionales, requisitoria), derechos del detenido (Art.17 CE + Art.520 LECrim); (2) Los derechos del detenido: información de los hechos, asistencia letrada (incluso de oficio), médico forense, intérprete, notificación a familiar, comunicación consular para extranjeros; (3) El registro de personas: Art.18 CE inviolabilidad, requisitos para registro personal: consentimiento, flagrante delito o autorización judicial; (4) La entrada y registro en domicilio: Art.18.2 CE — consentimiento del titular, flagrante delito, o mandamiento judicial motivado; procedimiento Art.550 LECrim; (5) Intervención de comunicaciones: Art.18.3 CE reserva judicial, Arts.588 bis y ss LECrim (introducidos por LO 13/2015), autorización judicial motivada, plazo 3 meses prorrogable
- Mermaid 1: supuestos de detención policial y sus requisitos
- Mermaid 2: supuestos de entrada y registro domiciliario

**Tema 30 — Identificación de personas** (`id:30, bloque:"especifico"`):
- Secciones: (1) La identificación de personas: Art.16 LO 4/2015 — indicios de participación en infracción, indicios de alteración de la seguridad pública; obligación de identificarse los agentes (Art.5 LO 2/1986); (2) El traslado a dependencias policiales para identificación: máximo 6 horas, con libro-registro, diligencias de identificación; (3) Los cacheos: control superficial de ropa y enseres, no constituye registro (Art.18 CE), requisito: indicios de portar armas u objetos peligrosos; (4) Las restricciones de derechos en la actuación policial: siempre proporcionales, necesarias, previstas en la ley y revisables judicialmente; (5) Las bases de datos policiales: ADEXTTRA (detenidos y requisitoriados), SIS II (Schengen), AFIS (huellas dactilares); acceso restringido a personal autorizado, protección RGPD
- Mermaid 1: procedimiento de identificación policial (Art.16 LO 4/2015)
- Mermaid 2: diferencia entre identificación, cacheo y detención

- [ ] **Step 1-5:** Crear `tema-26.json` a `tema-30.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['26','27','28','29','30'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-26.json src/data/topics/tema-27.json src/data/topics/tema-28.json src/data/topics/tema-29.json src/data/topics/tema-30.json
git commit -m "feat: content JSON for topics 26-30 (personal Policía Canaria, coord, deontología, DDHH, identificación)"
```

---

## Task 7: Temas 31–35 JSON (Violencia género, Menores, Tráfico, Armas, Policía adm.)

**Files:**
- Create: `src/data/topics/tema-31.json` through `tema-35.json`

**Tema 31 — Violencia de género** (`id:31, bloque:"especifico"`):
- Secciones: (1) La LO 1/2004 de Medidas de Protección Integral: objeto (violencia del hombre sobre la mujer en relaciones de pareja), principios (transversalidad, especialización); (2) La orden de protección: Art.544 ter LECrim — solicitud en 72h, Juzgado de Violencia sobre la Mujer (JVSM), medidas civiles y penales simultáneas; (3) El sistema VioGén: valoración policial del riesgo (sin riesgo/bajo/medio/alto/extremo), seguimiento y activación de protocolos según nivel; (4) Medidas cautelares: alejamiento, prohibición de comunicación, suspensión patria potestad, retirada de armas; penas accesorias; (5) Diferencia violencia de género (LO 1/2004) vs violencia doméstica (Art.173.2 CP): sujeto activo, juzgados competentes, penas agravadas por razón de género
- Mermaid 1: procedimiento de la orden de protección (Art.544 ter LECrim)
- Mermaid 2: niveles de riesgo VioGén y actuaciones policiales

**Tema 32 — Protección de menores** (`id:32, bloque:"especifico"`):
- Secciones: (1) La LO 1/1996 de Protección Jurídica del Menor (modificada por LO 8/2015 y Ley 26/2015): interés superior del menor como principio rector, derechos del menor; (2) La LO 8/2021 de Protección Integral a la Infancia y la Adolescencia (LOPIVI): prevención, detección y respuesta ante el abuso; (3) La LO 5/2000 reguladora de la responsabilidad penal de los menores: ámbito (14-18 años), principio educativo, medidas no privativas y privativas de libertad (internamiento régimen cerrado), Juzgado de Menores; (4) Actuación policial ante menores víctimas: explotación sexual, trata, abuso intrafamiliar — denuncia de oficio obligatoria; (5) Actuación policial ante menores infractores: detención, información de derechos adaptada, notificación al Ministerio Fiscal, prohibición de publicidad
- Mermaid 1: sistema de protección del menor (instituciones y procedimientos)
- Mermaid 2: medidas de la LORPM (LO 5/2000) de menor a mayor gravedad

**Tema 33 — Tráfico y seguridad vial** (`id:33, bloque:"especifico"`):
- Secciones: (1) El RDL 6/2015 Ley de Tráfico: objeto, órganos (DGT, jefaturas provinciales), competencias autonómicas y municipales; (2) El permiso por puntos: saldo inicial 12 puntos (15 para nuevos conductores tras 3 años), pérdida por infracciones, recuperación por cursos homologados; (3) Infracciones de tráfico: muy graves (multa 500-1.000€, posible pérdida puntos), graves (200-500€), leves (100-200€); plazos de prescripción 6/3/1 meses; (4) Inmovilización y retirada de vehículos: causas, procedimiento, depósito; (5) El atestado de accidente de tráfico: contenido (croquis, declaraciones, partes médicos, prueba etilométrica), valor de denuncia oficial, firma de los intervinientes
- Mermaid 1: sistema de permiso por puntos (saldo, pérdida y recuperación)
- Mermaid 2: tipos de infracciones de tráfico y cuantías de multas

**Tema 34 — Las armas** (`id:34, bloque:"especifico"`):
- Secciones: (1) El Reglamento de Armas RD 137/1993: categorías (1ª armas fuego largas; 2ª armas defensa personal; 3ª armas aire comprimido; 4ª carabinas y pistolas; 5ª armas blancas; 6ª armas de imitación; 7ª arcos, ballestas; 8ª cuchilos de monte); (2) El uso de armas de fuego por la policía: principios de necesidad, proporcionalidad, precaución; Código de Conducta ONU 1979 y Principios Básicos ONU 1990; (3) La guía de pertenencia: documento que acredita la posesión lícita, renovación, depósito de armas; (4) La legítima defensa: Art.20.4 CP — agresión ilegítima (real, actual o inminente), necesidad racional del medio empleado, falta de provocación suficiente; (5) Intervención de armas: aprehensión policial, decomiso, destrucción; armas prohibidas (Arts.4-6 Reglamento)
- Mermaid 1: categorías de armas según RD 137/1993
- Mermaid 2: requisitos de la legítima defensa (Art.20.4 CP)

**Tema 35 — Policía administrativa** (`id:35, bloque:"especifico"`):
- Secciones: (1) La actividad de policía administrativa: concepto, clases (regulación, autorización, inspección, sanción); (2) Las infracciones administrativas: tipicidad (reserva de ley), culpabilidad (dolo o imprudencia), antijuridicidad; concurso de infracciones; (3) El procedimiento sancionador: Arts.85-98 Ley 39/2015 — iniciación (de oficio o denuncia), instrucción (pliego de cargos, alegaciones 15 días), resolución; reducción 20% por pago voluntario o reconocimiento; (4) La prescripción de infracciones: muy graves 3 años, graves 2 años, leves 6 meses; prescripción de sanciones: muy graves 5/3/1 años; (5) La potestad inspectora: planes de inspección, actas de inspección (valor probatorio presunción de veracidad), medidas provisionales
- Mermaid 1: fases del procedimiento sancionador administrativo
- Mermaid 2: plazos de prescripción de infracciones y sanciones

- [ ] **Step 1-5:** Crear `tema-31.json` a `tema-35.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['31','32','33','34','35'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-31.json src/data/topics/tema-32.json src/data/topics/tema-33.json src/data/topics/tema-34.json src/data/topics/tema-35.json
git commit -m "feat: content JSON for topics 31-35 (VG, menores, tráfico, armas, policía administrativa)"
```

---

## Task 8: Temas 36–40 JSON (Proximidad, Criminalística, Emergencias, Seg. privada, Comunicaciones)

**Files:**
- Create: `src/data/topics/tema-36.json` through `tema-40.json`

**Tema 36 — Policía de proximidad** (`id:36, bloque:"especifico"`):
- Secciones: (1) Origen del modelo de policía comunitaria: Estados Unidos (community policing años 70-80), Reino Unido, extensión a España; (2) La mediación policial: concepto (proceso voluntario, confidencial, imparcial), principios, fases (premediación, mediación, acuerdo), tipos de conflictos mediables; (3) El policía de barrio o proximidad: funciones (prevención, información, relaciones vecinales), perfil profesional, coordinación con servicios sociales; (4) La participación ciudadana en seguridad: juntas locales de seguridad, consejos de participación, policía de proximidad como nexo; (5) Programas específicos: Plan Director (prevención violencia y acoso escolar), Programa ALBA (trata), actuación con colectivos vulnerables
- Mermaid 1: modelo de policía comunitaria vs policía tradicional
- Mermaid 2: fases de la mediación policial

**Tema 37 — La criminalística** (`id:37, bloque:"especifico"`):
- Secciones: (1) El atestado policial: concepto (denuncia oficial con valor probatorio, Arts.292-298 LECrim), estructura (encabezamiento, hechos, diligencias practicadas, conclusiones, firma), valor como prueba documental; (2) La inspección ocular técnico-policial: acotamiento y protección de la escena, documentación fotográfica, recogida de indicios; (3) Las huellas dactilares: tipos (latentes/moldeadas/patentes), técnicas de revelado (polvo dactilar, luminol, vapor de yodo), AFIS (sistema automatizado de identificación dactilar); (4) La cadena de custodia: concepto (garantía de integridad de la evidencia), embalaje correcto, etiquetado, registro de traslados, ruptura de cadena (inadmisibilidad de la prueba); (5) El informe pericial: estructura, objetividad científica, ratificación en juicio, la Policía Científica de la Guardia Civil y la Policía Nacional
- Mermaid 1: estructura del atestado policial
- Mermaid 2: cadena de custodia (fases y controles)

**Tema 38 — Emergencias y protección civil** (`id:38, bloque:"especifico"`):
- Secciones: (1) La Ley 17/2015 del Sistema Nacional de Protección Civil: objeto, principios (solidaridad, subsidiariedad, lealtad institucional), catálogos de actividades de riesgo; (2) El PLATECA (Plan Territorial de Emergencias de Canarias): Decreto 95/2010, estructura (Director del Plan, CECOES, grupos de acción), niveles de emergencia 0/1/2/3; (3) El CECOES 1-1-2: centro coordinador de emergencias y seguridad, activación de recursos, coordinación entre policía, bomberos y sanidad; (4) Actuación policial en emergencias: establecimiento del perímetro de seguridad, evacuación, control de accesos, información a la población, colaboración con CECOES; (5) Planes especiales y de autoprotección: plan de emergencia nuclear (PEVOLCA en Canarias para volcanes), planes municipales, planes de autoprotección de edificios
- Mermaid 1: estructura del PLATECA (niveles y organismos)
- Mermaid 2: coordinación en emergencias (policía, bomberos, sanidad, CECOES)

**Tema 39 — La seguridad privada** (`id:39, bloque:"especifico"`):
- Secciones: (1) La Ley 5/2014 de Seguridad Privada: objeto, principios (complementariedad, subordinación a las FFCCSS, proporcionalidad), registro de empresas y personal; (2) Las empresas de seguridad: autorización ministerial, ámbitos de actuación (vigilancia, transporte de fondos, protección de personas, investigación); (3) El personal de seguridad privada: vigilante de seguridad, escolta privado, guarda rural, detective privado, jefe de seguridad, director de seguridad; (4) Funciones y límites: no pueden ejercer funciones de FFCCSS, no pueden detener (solo retener hasta llegada policial), obligación de comunicar hechos delictivos; (5) Coordinación con FFCCSS: transmisión de información, comunicación inmediata de delitos, subordinación operativa
- Mermaid 1: tipos de personal de seguridad privada y sus funciones
- Mermaid 2: relación seguridad privada — Fuerzas y Cuerpos de Seguridad

**Tema 40 — Comunicaciones policiales** (`id:40, bloque:"especifico"`):
- Secciones: (1) Las comunicaciones operativas policiales: radiocomunicación analógica y digital TETRA, telefonía, protocolos de comunicación, códigos fonéticos (alfabeto OTAN); (2) El Sistema de Información Schengen SIS II: base de datos europea (búsqueda de personas, objetos, vehículos robados), acceso en tiempo real, Oficina SIRENE; (3) Las bases de datos policiales españolas: ADEXTTRA (antecedentes, detenidos), SINCO (Policía Nacional), GARDA (Guardia Civil), ficheros de ADN (LO 10/2007); (4) La interoperabilidad europea: Prüm Convention (intercambio ADN, huellas, matrículas), EUROPOL y la Base de Datos de Análisis; (5) Seguridad de las comunicaciones: cifrado de las comunicaciones policiales, protección de información clasificada, STIC (seguridad de las tecnologías de la información y comunicaciones)
- Mermaid 1: ecosistema de bases de datos policiales (SIS, ADEXTTRA, AFIS, ADN)
- Mermaid 2: comunicaciones operativas (TETRA, protocolos, códigos)

- [ ] **Step 1-5:** Crear `tema-36.json` a `tema-40.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['36','37','38','39','40'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-36.json src/data/topics/tema-37.json src/data/topics/tema-38.json src/data/topics/tema-39.json src/data/topics/tema-40.json
git commit -m "feat: content JSON for topics 36-40 (proximidad, criminalística, emergencias, seg. privada, comunicaciones)"
```

---

## Task 9: Temas 41–45 JSON (Uso fuerza, Primeros auxilios, Geografía, Economía, Instituciones)

**Files:**
- Create: `src/data/topics/tema-41.json` through `tema-45.json`

**Tema 41 — Uso de la fuerza** (`id:41, bloque:"especifico"`):
- Secciones: (1) Marco normativo: Art.5.2.c LO 2/1986 (proporcionalidad, congruencia, oportunidad), Código de Conducta ONU 1979 Art.3, Principios Básicos ONU 1990 sobre uso de la fuerza; (2) Los principios para el uso de la fuerza: congruencia (adecuación del medio al objetivo), oportunidad (solo cuando sea necesario), proporcionalidad (no exceder lo imprescindible); (3) El continuum del uso de la fuerza: presencia policial → comunicación verbal → control físico sin armas → armas intermedias (defensa, spray) → armas de fuego; (4) Los medios coercitivos reglamentarios: esposas (solo para traslado o resistencia activa), defensa (porra), spray de pimienta OC, arma de fuego (último recurso); (5) Responsabilidad penal por uso excesivo: Arts.550-556 CP y Art.16 LO 2/1986, doctrina TEDH Art.2 CEDH (uso de la fuerza letal)
- Mermaid 1: continuum del uso de la fuerza policial
- Mermaid 2: medios coercitivos reglamentarios y sus condiciones de uso

**Tema 42 — Primeros auxilios** (`id:42, bloque:"especifico"`):
- Secciones: (1) La cadena de supervivencia: alerta precoz → RCP precoz → desfibrilación precoz → soporte vital avanzado precoz; proteger-alertar-socorrer (PAS); (2) La RCP básica: compresiones torácicas 30:2, profundidad 5-6 cm, frecuencia 100-120 por minuto, posición manos en centro del pecho, apertura de vía aérea (maniobra frente-mentón); (3) El DEA (desfibrilador externo automático): uso en los primeros 3-5 minutos mejora supervivencia, instrucciones de voz, modo de colocación de parches, precauciones; (4) La obstrucción de la vía aérea por cuerpo extraño: adulto consciente (maniobra de Heimlich: 5 golpes interescapulares + 5 compresiones abdominales), inconsciente (RCP), lactante (5 palmadas + 5 compresiones torácicas); (5) Hemorragias, fracturas, quemaduras y shock: compresión directa y torniquete en hemorragias graves, inmovilización de fracturas sin reducción, PLS (posición lateral de seguridad) en inconsciente que respira
- Mermaid 1: cadena de supervivencia y actuación policial en emergencias sanitarias
- Mermaid 2: algoritmo de RCP básica adulto (30:2)

**Tema 43 — Geografía de Canarias** (`id:43, bloque:"especifico"`):
- Secciones: (1) Situación geográfica: 27-29°N, 13-18°O, frente a la costa noroccidental de África (100 km de Marruecos), macronesia; (2) Las 8 islas: Tenerife (2.034 km², cap. S/C de Tenerife), Gran Canaria (1.560 km², cap. Las Palmas GC), La Palma (708 km²), Lanzarote (845 km²), Fuerteventura (1.660 km²), La Gomera (369 km²), El Hierro (269 km²), La Graciosa (29 km²); (3) Las 2 provincias: S/C de Tenerife (Tenerife, La Palma, La Gomera, El Hierro) y Las Palmas (Gran Canaria, Fuerteventura, Lanzarote, La Graciosa); 88 municipios; (4) Orografía y clima: Teide 3.718m (punto más alto de España), clima subtropical árido en zonas costeras, laurisilva, flora y fauna endémica (drago, lagarto gigante, tabaiba); (5) Demografía: 2,2 millones habitantes, densidad variable por isla, distribución costero-urbana, inmigración como factor demográfico
- Mermaid 1: las 8 islas de Canarias y sus provincias
- Mermaid 2: municipios más poblados y distribución demográfica

**Tema 44 — Economía de Canarias** (`id:44, bloque:"especifico"`):
- Secciones: (1) El Régimen Económico y Fiscal (REF): Ley 19/1994, origen histórico (puertos francos s.XIX), justificación (ultraperiferia Art.349 TFUE, reconocimiento UE Reglamento 2021/1perso); (2) El IGIC (Impuesto General Indirecto Canario): tipo general 7% (vs IVA 21% peninsular), tipos reducidos 3%/0%, aplicación insular, exenciones en educación y sanidad; (3) La Zona Especial Canaria (ZEC): tributación reducida al 4% Impuesto Sociedades, requisitos de empleo mínimo, sectores permitidos, ventaja competitiva para inversión; (4) El turismo: >15 millones de turistas anuales, principales mercados (Reino Unido, Alemania, Escandinavia), aportación >30% PIB, turismo de sol y playa, diversificación hacia turismo cultural y rural; (5) Otros sectores: plátano de Canarias (IGP, cuota UE garantizada), tomate, cultivos en invernadero, pesca artesanal, acuicultura, energías renovables (aerogeneración El Hierro)
- Mermaid 1: estructura del REF canario (IGIC, ZEC, ayudas europeas)
- Mermaid 2: sectores económicos de Canarias y su peso en el PIB

**Tema 45 — Instituciones canarias** (`id:45, bloque:"especifico"`):
- Secciones: (1) El Parlamento de Canarias: 70 diputados, mandato 4 años, circunscripción insular (con corrección para igualdad), funciones legislativas, presupuestarias y de control; (2) El Gobierno de Canarias: Presidente (elegido por el Parlamento), Vicepresidente/s, Consejeros (máximo 10), Comisiones Delegadas; dimisión/cese/moción de censura constructiva; (3) El Presidente del Gobierno de Canarias: representación ordinaria del Estado en la CCAA, dirige la acción del Gobierno, propone nombramiento de Consejeros al Rey; candidato con mayoría absoluta en 1ª votación o mayoría simple en 2ª; (4) El Defensor del Pueblo canario (Diputado del Común): elegido por el Parlamento por mayoría de 3/5, mandato 5 años, defiende derechos y libertades de los canarios ante la Administración autonómica y local; (5) El Consejo Consultivo de Canarias: Ley 5/1984, supremo órgano consultivo, dictámenes preceptivos (reglamentos, recursos de inconstitucionalidad, proyectos de estatuto), Presidente nombrado por el Gobierno de Canarias
- Mermaid 1: instituciones básicas de la CA de Canarias y sus relaciones
- Mermaid 2: proceso de investidura del Presidente de Canarias

- [ ] **Step 1-5:** Crear `tema-41.json` a `tema-45.json` con contenido completo.

- [ ] **Step 6: Verificar**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "['41','42','43','44','45'].forEach(n=>{const t=require('./src/data/topics/tema-'+n+'.json');const ok=t.secciones.length>=5&&t.esquemas.length===2&&t.flashcards.length>=20&&t.preguntas.length===15;console.log('T'+n+':'+(ok?'OK':'FAIL'))})"
```

- [ ] **Step 7: Commit**

```bash
git add src/data/topics/tema-41.json src/data/topics/tema-42.json src/data/topics/tema-43.json src/data/topics/tema-44.json src/data/topics/tema-45.json
git commit -m "feat: content JSON for topics 41-45 (uso fuerza, primeros auxilios, geografía, economía, instituciones Canarias)"
```

---

## Task 10: Build final y verificación completa

**Files:** Ninguno — solo verificación.

- [ ] **Step 1: Verificar que los 45 JSON existen y cumplen los requisitos mínimos**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
node -e "
const fs=require('fs');
const ids=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45];
let errors=0;
ids.forEach(id=>{
  const f='src/data/topics/tema-'+String(id).padStart(2,'0')+'.json';
  if(!fs.existsSync(f)){console.error('MISSING: '+f);errors++;return;}
  const t=JSON.parse(fs.readFileSync(f,'utf8'));
  if(t.secciones.length<5){console.error('T'+id+': secciones='+t.secciones.length);errors++;}
  if(t.esquemas.length!==2){console.error('T'+id+': esquemas='+t.esquemas.length);errors++;}
  if(t.mapaMental.nodos.length<12){console.error('T'+id+': nodos='+t.mapaMental.nodos.length);errors++;}
  if(t.flashcards.length<20){console.error('T'+id+': flashcards='+t.flashcards.length);errors++;}
  if(t.preguntas.length!==15){console.error('T'+id+': preguntas='+t.preguntas.length);errors++;}
});
console.log(errors===0?'ALL 45 TOPICS OK':'ERRORS: '+errors);
"
```
Expected: `ALL 45 TOPICS OK`

- [ ] **Step 2: Build de producción**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam" && npm run build
```
Expected: `✓ built in X.XXs` sin errores TypeScript.

- [ ] **Step 3: Tests**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam" && npm run test:run
```
Expected: `Test Files 3 passed (3)`, `Tests 17 passed (17)`.

- [ ] **Step 4: Commit final**

```bash
cd "C:\Users\Apari\Proyecto claude\opodam"
git add -A
git commit -m "feat: Fase 2 complete — 45 temas con contenido completo 🎓"
```
