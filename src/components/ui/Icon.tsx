/**
 * Iconografía SVG del chrome de la app (navegación y shell).
 *
 * Sustituye a los emojis que se usaban como iconos de navegación. Un emoji
 * no hereda `currentColor` (no puede reflejar el estado activo/inactivo),
 * se dibuja distinto en cada sistema operativo y los lectores de pantalla lo
 * anuncian en voz alta ("libros", "cerebro") duplicando la etiqueta de texto.
 *
 * Trazo de 1.75 sobre lienzo 24×24, alineado con el resto del sistema.
 * Por defecto `aria-hidden`: el nombre accesible lo pone siempre el texto
 * o el `aria-label` del control que lo contiene.
 */

export type NombreIcono =
  | 'resumen' | 'temario' | 'flashcards' | 'tests' | 'tutor'
  | 'psicotecnicos' | 'supuestos' | 'entrevista' | 'personalidad'
  | 'estadisticas' | 'procoach' | 'perfil' | 'escudo'
  | 'biodata' | 'informe' | 'racha'
  | 'fisico' | 'policia' | 'espadas' | 'justicia' | 'salud' | 'candado'
  | 'acierto' | 'fallo' | 'blanco' | 'alerta' | 'duda'
  | 'triste' | 'contento' | 'celebracion'
  | 'mezcla' | 'diana' | 'tirita' | 'dificil' | 'idea' | 'rayo'
  | 'tiempo' | 'marcador' | 'tendencia' | 'calendario' | 'repetir'
  | 'descargar' | 'subir' | 'copia' | 'sonido' | 'silencio'
  | 'menu' | 'cerrar' | 'chevron' | 'check' | 'mas'
  | 'sol' | 'luna' | 'nota'

const TRAZOS: Record<NombreIcono, string> = {
  resumen:       '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/>',
  temario:       '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2.5 2.5 0 0 1 2 1 2.5 2.5 0 0 1 2-1h4.5A1.5 1.5 0 0 1 20 5.5v12a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 0 0-2 1 2 2 0 0 0-2-1H5.5A1.5 1.5 0 0 1 4 17.5Z"/><path d="M12 5v14"/>',
  flashcards:    '<rect x="3" y="6.5" width="13" height="13" rx="2"/><path d="M8 3.5h10A2.5 2.5 0 0 1 20.5 6v10"/>',
  tests:         '<path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14.5 3v4.5H19"/><path d="M8.5 13l2 2 4-4"/>',
  tutor:         '<path d="M12 3 3 7.5l9 4.5 9-4.5Z"/><path d="M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5"/><path d="M21 7.5v6"/>',
  psicotecnicos: '<path d="M12 4.5a3.5 3.5 0 0 0-3.5 3.5A3 3 0 0 0 6 11a3 3 0 0 0 1.6 2.7A3 3 0 0 0 10 18.5a2.5 2.5 0 0 0 2-1V4.5Z"/><path d="M12 4.5A3.5 3.5 0 0 1 15.5 8 3 3 0 0 1 18 11a3 3 0 0 1-1.6 2.7A3 3 0 0 1 14 18.5a2.5 2.5 0 0 1-2-1"/>',
  supuestos:     '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M9 11h6M9 15h4"/>',
  entrevista:    '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0"/><path d="M12 17.5V21M9 21h6"/>',
  personalidad:  '<path d="M9.5 4h5v2.2a1.8 1.8 0 0 0 3.6 0V4H20v5.5h-2.2a1.8 1.8 0 0 0 0 3.6H20V20h-5.5v-2.2a1.8 1.8 0 0 0-3.6 0V20H5.5v-5.5h2.2a1.8 1.8 0 0 0 0-3.6H5.5V4Z"/>',
  estadisticas:  '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  procoach:      '<path d="m12 3 1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7Z"/><path d="M18.5 15.5 19 17l1.5.5L19 18l-.5 1.5-.5-1.5L16.5 17l1.5-.5Z"/>',
  perfil:        '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  escudo:        '<path d="M12 3.2 5 6v5.6c0 4.2 2.9 7.4 7 9.2 4.1-1.8 7-5 7-9.2V6Z"/>',
  biodata:       '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9.5" cy="9" r="2.2"/><path d="M6 17c.6-1.9 1.9-2.8 3.5-2.8s2.9.9 3.5 2.8"/><path d="M15 8.5h3M15 12h3"/>',
  informe:       '<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4"/><path d="M9.5 17v-3M12 17v-5M14.5 17v-2"/>',
  racha:         '<path d="M12 3s4.5 3.4 4.5 7.5A4.5 4.5 0 0 1 12 15a4.5 4.5 0 0 1-4.5-4.5C7.5 6.4 12 3 12 3Z"/><path d="M9 15.5c0 2.5 1.3 4.5 3 4.5s3-2 3-4.5"/>',
  // Cuerpos y oposiciones (glifo identificativo)
  fisico:        '<path d="M6.5 8.5v7M4 10v4M17.5 8.5v7M20 10v4M6.5 12h11"/>',
  policia:       '<path d="M4.5 16a7.5 7.5 0 0 1 15 0"/><rect x="3" y="16" width="18" height="3.8" rx="1.4"/><path d="M10.2 11.5h3.6"/>',
  espadas:       '<path d="m4 4 11.5 11.5M20 4 8.5 15.5"/><path d="m14.5 16.5 2-2 4 4-2 2Z"/><path d="m9.5 16.5-2-2-4 4 2 2Z"/>',
  justicia:      '<path d="M12 3.5v17M7.5 20.5h9"/><path d="m4.5 7 7.5-1.6L19.5 7"/><path d="M7.5 7 4.5 14a3 3 0 0 0 6 0Z"/><path d="M16.5 7 13.5 14a3 3 0 0 0 6 0Z"/>',
  salud:         '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
  candado:       '<rect x="4" y="10" width="16" height="10.5" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><path d="M12 14v2.6"/>',

  // Estado: resultado, aviso y calibracion
  acierto:       '<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.3 2.6 2.6 5-5.2"/>',
  fallo:         '<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/>',
  blanco:        '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/>',
  alerta:        '<path d="M12 4.2 2.9 19.2h18.2Z"/><path d="M12 10v3.6M12 16.4h.01"/>',
  duda:          '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.5"/><path d="M12 17.2h.01"/>',
  triste:        '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 15.8a4.2 4.2 0 0 1 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  contento:      '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 13.8a4.2 4.2 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  celebracion:   '<path d="M3.5 20.5 8.6 8.4l7 7-12.1 5.1Z"/><path d="m7.6 12.3 4.1 4.1"/><path d="M13.5 3.5v2M20.5 10.5h-2M17.4 6.6l1.6-1.6M16.4 10.6l-1-1"/>',

  // Acciones y metricas
  mezcla:        '<path d="M3 7h3.4c1.2 0 2.3.6 3 1.6l4.2 6c.7 1 1.8 1.6 3 1.6H21"/><path d="M3 17h3.4c1.2 0 2.3-.6 3-1.6l4.2-6c.7-1 1.8-1.6 3-1.6H21"/><path d="m18.4 4.6 2.6 2.4-2.6 2.4M18.4 14.6l2.6 2.4-2.6 2.4"/>',
  diana:         '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 12h.01"/>',
  tirita:        '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(-45 12 12)"/>',
  dificil:       '<path d="M12 3c0 3.4-4.6 4.8-4.6 9.4a4.6 4.6 0 0 0 9.2 0c0-2.1-1.1-3.6-2.3-4.9C13.2 6.3 12.6 4.6 12 3Z"/><path d="M12 12.5c0 1.7-1.6 2-1.6 3.6a1.6 1.6 0 0 0 3.2 0c0-1.2-1-1.8-1.6-3.6Z"/>',
  idea:          '<circle cx="12" cy="9.5" r="5.5"/><path d="M9.8 14.5v3M14.2 14.5v3"/><path d="M9.5 17.5h5M10.3 20.5h3.4"/>',
  rayo:          '<path d="M13 2.5 5 13.5h6L11 21.5l8-11h-6Z"/>',
  tiempo:        '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
  marcador:      '<path d="M8.5 3.5h7l-1 4.6 3 3.4v1.6H6.5v-1.6l3-3.4Z"/><path d="M12 13.1V21"/>',
  tendencia:     '<path d="M3 16.5 9.5 10l3.5 3.5L21 6"/><path d="M15.5 6H21v5.5"/>',
  calendario:    '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
  repetir:       '<path d="M20 11.5A8 8 0 0 0 6.3 6.4L3.5 9"/><path d="M3.5 4.5V9H8"/><path d="M4 12.5a8 8 0 0 0 13.7 5.1l2.8-2.6"/><path d="M20.5 19.5V15H16"/>',
  descargar:     '<path d="M12 4v11.5"/><path d="m7.5 11 4.5 4.5L16.5 11"/><path d="M4 15v4.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15"/>',
  subir:         '<path d="M12 16V4.5"/><path d="m7.5 9 4.5-4.5L16.5 9"/><path d="M4 15v4.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15"/>',
  copia:         '<ellipse cx="12" cy="6.5" rx="7.5" ry="3"/><path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  sonido:        '<path d="M4 9.5h3l4.5-3.8v12.6L7 14.5H4Z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.8 7a7 7 0 0 1 0 10"/>',
  silencio:      '<path d="M4 9.5h3l4.5-3.8v12.6L7 14.5H4Z"/><path d="m16 10 4 4M20 10l-4 4"/>',

  menu:          '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cerrar:        '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron:       '<path d="m9 5 7 7-7 7"/>',
  check:         '<path d="m5 12.5 4.5 4.5L19 7"/>',
  mas:           '<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>',
  sol:           '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  luna:          '<path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4Z"/>',
  nota:          '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
}

interface IconProps {
  nombre: NombreIcono
  /** Tamaño en px del lienzo cuadrado. Por defecto 20. */
  size?: number
  className?: string
  /**
   * Solo si el icono es la ÚNICA fuente de significado del control.
   * Si el control ya tiene texto o aria-label, déjalo vacío.
   */
  titulo?: string
}

export function Icon({ nombre, size = 20, className, titulo }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: TRAZOS[nombre] }}
    />
  )
}
