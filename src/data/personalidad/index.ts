import cuestionario from './cuestionario.json'

export interface ItemPersonalidad { id: string; texto: string; rasgo: string; invertido: boolean }
export interface ResultadoRasgo { rasgo: string; titulo: string; puntuacion: number; banda: 'bajo' | 'medio' | 'alto' }

export const RASGOS = [
  { id: 'estabilidad', titulo: 'Estabilidad emocional', descripcion: 'Calma y equilibrio ante la presión.' },
  { id: 'responsabilidad', titulo: 'Responsabilidad', descripcion: 'Compromiso, orden y cumplimiento.' },
  { id: 'sociabilidad', titulo: 'Sociabilidad', descripcion: 'Trato y comunicación con las personas.' },
  { id: 'autocontrol', titulo: 'Autocontrol', descripcion: 'Gestión de impulsos y reacciones.' },
  { id: 'trabajo_equipo', titulo: 'Trabajo en equipo', descripcion: 'Cooperación y aceptación de jerarquía.' },
] as const

export function cargarCuestionario(): ItemPersonalidad[] {
  return cuestionario as ItemPersonalidad[]
}

function banda(p: number): 'bajo' | 'medio' | 'alto' {
  if (p < 40) return 'bajo'
  if (p <= 70) return 'medio'
  return 'alto'
}

// Likert 1-5. Ítem invertido puntúa 6 - valor. Normaliza la media (1-5) a 0-100.
export function puntuar(respuestas: Record<string, number>): ResultadoRasgo[] {
  const items = cargarCuestionario()
  return RASGOS.map(r => {
    const delRasgo = items.filter(i => i.rasgo === r.id)
    const valores = delRasgo
      .map(i => ({ v: respuestas[i.id], inv: i.invertido }))
      .filter(x => typeof x.v === 'number')
      .map(x => (x.inv ? 6 - x.v : x.v))
    const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
    const puntuacion = valores.length ? Math.round(((media - 1) / 4) * 100) : 0
    return { rasgo: r.id, titulo: r.titulo, puntuacion, banda: banda(puntuacion) }
  })
}

const TEXTOS: Record<string, Record<'bajo' | 'medio' | 'alto', string>> = {
  estabilidad: {
    alto: 'Gestionas muy bien la presión; transmites serenidad, una cualidad clave en el servicio.',
    medio: 'Sueles mantener el equilibrio, aunque ciertas situaciones tensas pueden afectarte. Trabaja técnicas de gestión del estrés.',
    bajo: 'La presión te afecta con facilidad. Practica respiración y exposición gradual a situaciones tensas.',
  },
  responsabilidad: {
    alto: 'Muy comprometido y organizado; cumples y asumes tus obligaciones.',
    medio: 'Responsable en general; refuerza la planificación y la constancia.',
    bajo: 'Conviene reforzar el orden, la puntualidad y el cumplimiento de compromisos.',
  },
  sociabilidad: {
    alto: 'Te relacionas y comunicas con soltura; ideal para la atención al ciudadano.',
    medio: 'Trato correcto; gana confianza iniciando más interacciones.',
    bajo: 'El trato social te cuesta; practica la comunicación y la escucha activa.',
  },
  autocontrol: {
    alto: 'Excelente control de impulsos; reaccionas con cabeza ante provocaciones.',
    medio: 'Autocontrol aceptable; trabaja la pausa antes de reaccionar.',
    bajo: 'Tiendes a reaccionar en caliente. Entrena la gestión del enfado y la pausa.',
  },
  trabajo_equipo: {
    alto: 'Gran cooperador; aceptas jerarquía y apoyas al grupo.',
    medio: 'Trabajas en equipo bien; abre más espacio a otras opiniones.',
    bajo: 'Mejora la cooperación y la aceptación de criterios ajenos y del mando.',
  },
}

export function interpretacion(rasgo: string, b: 'bajo' | 'medio' | 'alto'): string {
  return (TEXTOS[rasgo] && TEXTOS[rasgo][b]) || ''
}
