import { supabase } from './supabase'
import type {
  PerfilPsicologico,
  InformeIdoneidad,
  Veredicto,
} from '../types/psicologico'

// ── CRUD Supabase ──────────────────────────────────────────────────

export async function obtenerPerfil(
  userId: string,
  slug: string,
): Promise<PerfilPsicologico | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('perfil_psicologico')
    .select('datos')
    .eq('user_id', userId)
    .eq('oposicion_slug', slug)
    .maybeSingle()
  if (error || !data) return null
  return (data as { datos: PerfilPsicologico }).datos
}

export async function guardarPerfil(
  userId: string,
  slug: string,
  datos: PerfilPsicologico,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { error } = await supabase
    .from('perfil_psicologico')
    .upsert(
      { user_id: userId, oposicion_slug: slug, datos },
      { onConflict: 'user_id,oposicion_slug' },
    )
  return { error: error?.message ?? null }
}

// ── Textos por cuerpo ─────────────────────────────────────────────
const NOMBRE_CUERPO: Record<string, string> = {
  'guardia-civil': 'la Guardia Civil',
  'cgpc': 'la Policía Canaria',
  'policia-local': 'la Policía Local',
}

const PREGUNTAS_BASE: Record<string, string[]> = {
  'guardia-civil': [
    '¿Por qué quieres ser Guardia Civil?',
    '¿Cómo reaccionarías ante una orden que consideras injusta?',
    '¿Has tenido algún conflicto en un equipo? ¿Cómo lo resolviste?',
  ],
  'cgpc': [
    '¿Por qué quieres ser Policía Canaria?',
    '¿Cómo actuarías ante una situación de riesgo en la vía pública?',
    '¿Has tenido algún conflicto en un equipo? ¿Cómo lo resolviste?',
  ],
  'policia-local': [
    '¿Por qué quieres ser Policía Local?',
    '¿Cómo mediarías en un conflicto vecinal?',
    '¿Cómo gestionarías una situación de violencia doméstica?',
  ],
}

// ── Motor algorítmico de idoneidad ────────────────────────────────
// Criterios (sesión 2026-06-07, extendido a CGPC/PL 2026-06-09):
//   Psicotécnicos global ≥ P50 → APTO  |  < P35 → RIESGO
//   Estabilidad emocional (N inverso) > 55 → APTO | < 40 → RIESGO
//   Responsabilidad (C) > 60 → APTO | < 45 → RIESGO
//   Extraversión (E) > 45 → APTO
//   Biodata actividad física ≥ 3h/sem → APTO | < 1h → RIESGO  (solo GC)
//   Entrevista coherencia > 6/10 → APTO | < 4/10 → RIESGO

export function calcularInforme(perfil: PerfilPsicologico, slug = 'guardia-civil'): InformeIdoneidad {
  const fortalezas: string[] = []
  const mejoras: string[] = []
  const riesgos: string[] = []

  // — Psicotécnicos —
  if (perfil.psicotecnicos?.completado) {
    const p = perfil.psicotecnicos.globalPercentil
    if (p >= 50) fortalezas.push(`Aptitudes cognitivas en percentil ${p} (≥ P50)`)
    else if (p < 35) riesgos.push(`Percentil cognitivo bajo: P${p} (umbral mínimo P35)`)
    else mejoras.push(`Percentil cognitivo P${p} — refuerza razonamiento abstracto`)
  }

  // — Personalidad Big Five —
  if (perfil.personalidad?.completado) {
    const { C, N, E } = perfil.personalidad.bigFive
    const estabilidad = 100 - N

    if (estabilidad > 55) fortalezas.push(`Alta estabilidad emocional (${estabilidad}/100)`)
    else if (estabilidad < 40) riesgos.push(`Estabilidad emocional baja (${estabilidad}/100) — trabajo en gestión del estrés`)
    else mejoras.push(`Estabilidad emocional mejorable (${estabilidad}/100)`)

    if (C > 60) fortalezas.push(`Alta responsabilidad y autodisciplina (C=${C})`)
    else if (C < 45) riesgos.push(`Baja responsabilidad percibida (C=${C}) — área crítica para ${NOMBRE_CUERPO[slug] ?? 'el cuerpo'}`)
    else mejoras.push(`Responsabilidad a reforzar (C=${C})`)

    if (E > 45) fortalezas.push(`Extraversión adecuada para trabajo en equipo (E=${E})`)

    if (perfil.personalidad.sesgoDeseabilidad > 70)
      mejoras.push('Tendencia a respuesta socialmente deseable — sé más espontáneo en la entrevista')
  }

  // — Biodata (GC) —
  if (perfil.biodata?.completado) {
    const horas = Number(perfil.biodata.respuestas['actividadFisicaHoras'] ?? 0)
    if (horas >= 3) fortalezas.push(`Actividad física regular (${horas}h/sem)`)
    else if (horas < 1) riesgos.push(`Actividad física insuficiente (${horas}h/sem) — ${NOMBRE_CUERPO[slug] ?? 'el cuerpo'} valora la condición física`)
    else mejoras.push(`Actividad física a aumentar (${horas}h/sem, objetivo ≥3h)`)
  }

  // — Entrevista —
  if (perfil.entrevista && perfil.entrevista.sesiones > 0) {
    const p = perfil.entrevista.puntuacionMedia
    if (p > 6) fortalezas.push(`Buena coherencia en entrevista (${p}/10)`)
    else if (p < 4) riesgos.push(`Coherencia de discurso baja en entrevista (${p}/10)`)
    else mejoras.push(`Practica más entrevistas simuladas (media actual ${p}/10)`)
  }

  // — Veredicto —
  let veredicto: Veredicto
  if (riesgos.length === 0 && fortalezas.length >= 2) veredicto = 'apto'
  else if (riesgos.length >= 2) veredicto = 'no-apto'
  else veredicto = 'riesgo'

  // — Preguntas probables en entrevista —
  const preguntasProbables: string[] = [
    ...(PREGUNTAS_BASE[slug] ?? PREGUNTAS_BASE['guardia-civil']),
  ]
  if (perfil.personalidad?.bigFive.N && perfil.personalidad.bigFive.N > 60)
    preguntasProbables.push('¿Cómo gestionas el estrés en situaciones de alta presión?')
  if (perfil.biodata?.respuestas['experienciaPrevia'])
    preguntasProbables.push('Cuéntame sobre tu experiencia previa relacionada con seguridad o servicio público.')

  // — Recomendación —
  const nombreCuerpo = NOMBRE_CUERPO[slug] ?? 'el cuerpo'
  const recomendacion =
    veredicto === 'apto'
      ? `Perfil compatible con los requisitos psicológicos de ${nombreCuerpo}. Mantén la constancia en preparación física y sigue practicando entrevistas.`
      : veredicto === 'riesgo'
        ? 'Perfil con áreas de mejora. Trabaja los puntos señalados antes de la prueba psicológica.'
        : 'Perfil con factores de riesgo significativos. Consulta con un psicólogo antes de continuar la preparación.'

  return {
    fecha: new Date().toISOString().slice(0, 10),
    veredicto,
    fortalezas,
    mejoras: [...mejoras, ...riesgos],
    preguntasProbables,
    recomendacion,
  }
}
