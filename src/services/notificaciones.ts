// Notificaciones de racha PWA
// Estrategia: notificación local al abrir la app si llevas >20h sin estudiar.
// No requiere servidor push — funciona con el Notification API del navegador.

const CLAVE_ULTIMO_ESTUDIO = 'opodam-ultimo-estudio'
const CLAVE_PERMISOS = 'opodam-notif-pedidos'

/** Llama esto cada vez que el usuario complete una acción de estudio (test, tema, flashcard). */
export function registrarEstudio() {
  localStorage.setItem(CLAVE_ULTIMO_ESTUDIO, new Date().toISOString())
}

/** Pide permiso de notificación si aún no se ha pedido. */
export async function pedirPermiso(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (localStorage.getItem(CLAVE_PERMISOS)) return false // ya preguntamos, no insistir

  localStorage.setItem(CLAVE_PERMISOS, '1')
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

/** Comprueba si el usuario lleva más de 20h sin estudiar y muestra notificación. */
export function comprobarRacha(diasRacha: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const raw = localStorage.getItem(CLAVE_ULTIMO_ESTUDIO)
  if (!raw) return // primer día, no molestar

  const horasDesde = (Date.now() - new Date(raw).getTime()) / 1000 / 3600
  if (horasDesde < 20) return // estudió hoy, ok

  const mensaje = diasRacha > 0
    ? `Llevas ${diasRacha} días de racha 🔥 ¡No la rompas! Dedica 20 minutos hoy.`
    : 'Hace tiempo que no estudias. Vuelve hoy y empieza una nueva racha.'

  new Notification('OpoDAM — Acuérdate de estudiar', {
    body: mensaje,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'racha-diaria', // evita duplicados
  })
}
