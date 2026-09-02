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
