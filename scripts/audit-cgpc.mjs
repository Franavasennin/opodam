import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data', 'topics', 'cgpc');

const errors = [];
const allIds = new Map(); // id -> temaLabel

function log(tema, id, tipo, detalle) {
  errors.push({ tema, id, tipo, detalle });
}

// Heuristic: check if explicacion clearly points to a different option
function checkExplicacionConsistency(pregunta, temaLabel) {
  const { id, opciones, respuestaCorrecta, explicacion } = pregunta;
  if (!explicacion || !opciones || typeof respuestaCorrecta !== 'number') return;

  const expl = explicacion.toLowerCase();

  // 1. Detect explicit letter references: "la opción B", "respuesta C", etc.
  const letraMap = { a: 0, b: 1, c: 2, d: 3 };
  const letraRefs = [...expl.matchAll(/(?:opci[oó]n|respuesta|alternativa|letra)\s+([abcd])\b/gi)]
    .map(m => letraMap[m[1].toLowerCase()])
    .filter(i => i !== undefined);

  for (const idx of letraRefs) {
    if (idx !== respuestaCorrecta) {
      log(temaLabel, id, 'SOSPECHA_EXPLICACION',
        `La explicación menciona la opción "${'ABCD'[idx]}" (índice ${idx}) pero respuestaCorrecta=${respuestaCorrecta} (opción ${'ABCD'[respuestaCorrecta]}).`
      );
      return;
    }
  }

  // 2. Detect article references: find articles cited in explicacion,
  //    check if exactly one option mentions them and it's NOT the correct one.
  const artRefs = [...expl.matchAll(/art(?:ículo|iculo|\.|\s)\s*(\d+(?:\.\d+)?(?:\s*(?:bis|ter))?)/gi)]
    .map(m => m[1].trim().toLowerCase());

  const uniqueArts = [...new Set(artRefs)];
  for (const artNum of uniqueArts) {
    const matchingOptions = opciones
      .map((opt, i) => ({ opt: opt.toLowerCase(), i }))
      .filter(({ opt }) => opt.includes(artNum));

    if (matchingOptions.length === 1 && matchingOptions[0].i !== respuestaCorrecta) {
      const correctaText = opciones[respuestaCorrecta]?.toLowerCase() || '';
      // Only flag if the correct option does NOT also mention this article
      if (!correctaText.includes(artNum)) {
        log(temaLabel, id, 'SOSPECHA_EXPLICACION',
          `Explicación menciona "art. ${artNum}" y solo la opción ${matchingOptions[0].i} (${'ABCD'[matchingOptions[0].i]}) la contiene, pero respuestaCorrecta=${respuestaCorrecta} (${'ABCD'[respuestaCorrecta]}).`
        );
        return;
      }
    }
  }
}

// Locate data files
let files;
try {
  files = readdirSync(dataDir)
    .filter(f => /^tema-\d+\.json$/.test(f))
    .sort();
} catch (e) {
  console.error('No se pudo leer el directorio:', dataDir, e.message);
  process.exit(1);
}

if (files.length === 0) {
  console.error('No se encontraron ficheros tema-XX.json en:', dataDir);
  process.exit(1);
}

let totalPreguntas = 0;

for (const file of files) {
  const temaLabel = file.replace('.json', '').toUpperCase();
  const filePath = join(dataDir, file);

  let data;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (e) {
    log(temaLabel, '—', 'JSON_INVALIDO', e.message);
    continue;
  }

  // Support root array or { preguntas: [...] }
  const preguntas = Array.isArray(data) ? data : (data.preguntas || data.questions || []);

  if (!Array.isArray(preguntas) || preguntas.length === 0) {
    log(temaLabel, '—', 'SIN_PREGUNTAS', 'El fichero no contiene un array de preguntas válido.');
    continue;
  }

  totalPreguntas += preguntas.length;

  for (let i = 0; i < preguntas.length; i++) {
    const p = preguntas[i];
    if (typeof p !== 'object' || p === null) {
      log(temaLabel, `(índice ${i})`, 'PREGUNTA_INVALIDA', 'El elemento no es un objeto.');
      continue;
    }

    const pid = p.id ?? `(índice ${i})`;

    // 3. Campos faltantes
    for (const field of ['id', 'enunciado', 'opciones', 'respuestaCorrecta', 'explicacion']) {
      if (p[field] === undefined || p[field] === null) {
        log(temaLabel, pid, 'CAMPO_FALTANTE', `Falta el campo "${field}"`);
      }
    }

    // 1. Duplicados de ID
    if (p.id !== undefined && p.id !== null) {
      if (allIds.has(p.id)) {
        log(temaLabel, p.id, 'ID_DUPLICADO', `Ya existe en ${allIds.get(p.id)}`);
      } else {
        allIds.set(p.id, temaLabel);
      }
    }

    // 2. respuestaCorrecta fuera de rango
    if (p.respuestaCorrecta !== undefined && p.respuestaCorrecta !== null) {
      const rc = p.respuestaCorrecta;
      if (typeof rc !== 'number' || !Number.isInteger(rc) || rc < 0 || rc > 3) {
        log(temaLabel, pid, 'RESPUESTA_FUERA_DE_RANGO',
          `respuestaCorrecta=${JSON.stringify(rc)} no es un entero entre 0 y 3`);
      }
    }

    // 4. opciones con longitud distinta a 4
    if (p.opciones !== undefined && p.opciones !== null) {
      if (!Array.isArray(p.opciones)) {
        log(temaLabel, pid, 'OPCIONES_INVALIDAS', '"opciones" no es un array');
      } else if (p.opciones.length !== 4) {
        log(temaLabel, pid, 'OPCIONES_INVALIDAS',
          `Tiene ${p.opciones.length} opciones en lugar de 4`);
      }
    }

    // 5. Inconsistencia explicacion/respuesta (heurística conservadora)
    checkExplicacionConsistency(p, temaLabel);
  }
}

// ── Output ──────────────────────────────────────────────────────────────────
console.log('='.repeat(70));
console.log('AUDITORÍA CGPC — RESULTADOS');
console.log('='.repeat(70));
console.log(`Ficheros analizados : ${files.length}`);
console.log(`Total preguntas     : ${totalPreguntas}`);
console.log(`Total errores       : ${errors.length}`);
console.log('='.repeat(70));

if (errors.length === 0) {
  console.log('\n✅ No se encontraron errores.\n');
} else {
  const byType = {};
  for (const e of errors) byType[e.tipo] = (byType[e.tipo] || 0) + 1;

  console.log('\nResumen por tipo:');
  for (const [tipo, count] of Object.entries(byType)) {
    console.log(`  ${tipo.padEnd(35)} ${count}`);
  }

  console.log('\nDetalle:\n');
  for (const e of errors) {
    console.log(`[${e.tema}] ${e.id} — ${e.tipo}: ${e.detalle}`);
  }
}
