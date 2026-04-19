import { useState, useEffect } from 'react'

export function useNotifications() {
  const [permiso, setPermiso] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) setPermiso(Notification.permission)
  }, [])

  async function solicitarPermiso(): Promise<boolean> {
    if (!('Notification' in window)) return false
    const resultado = await Notification.requestPermission()
    setPermiso(resultado)
    return resultado === 'granted'
  }

  function programarRecordatorio(hora: string): void {
    if (permiso !== 'granted') return
    const [h, m] = hora.split(':').map(Number)
    const objetivo = new Date()
    objetivo.setHours(h, m, 0, 0)
    if (objetivo <= new Date()) objetivo.setDate(objetivo.getDate() + 1)
    const ms = objetivo.getTime() - Date.now()
    setTimeout(() => {
      new Notification('OpoDAM — ¡Hora de estudiar!', {
        body: 'Tienes temas pendientes. ¡Tú puedes!',
        icon: '/icons/icon-192.png',
      })
    }, ms)
  }

  return { permiso, solicitarPermiso, programarRecordatorio }
}
