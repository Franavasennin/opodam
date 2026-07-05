// scripts/public-oposiciones-config.mjs
// Espejo mínimo de src/data/oposiciones.ts para scripts de build (Node plano, sin TS).
// Si se añade/edita una oposición en oposiciones.ts, replicar aquí slug/nombre/descripcion/numTemas.
export const OPOSICIONES_PUBLICAS = [
  { slug: 'cgpc', nombre: 'Policía Canaria (CGPC)', descripcion: 'Cuerpo General de la Policía Canaria', numTemas: 45 },
  { slug: 'policia-local', nombre: 'Policía Local', descripcion: 'Cuerpos de Policía Local de Canarias', numTemas: 37 },
  { slug: 'aux-enfermeria', nombre: 'Auxiliar de Enfermería', descripcion: 'Servicio Canario de Salud', numTemas: 24 },
  { slug: 'guardia-civil', nombre: 'Guardia Civil', descripcion: 'Ingreso en el Cuerpo de la Guardia Civil', numTemas: 25 },
  { slug: 'aux-judicial', nombre: 'Auxiliar Judicial', descripcion: 'Administración de Justicia', numTemas: 29 },
  { slug: 'tramitacion-judicial', nombre: 'Tramitación Judicial', descripcion: 'Administración de Justicia', numTemas: 31 },
]
