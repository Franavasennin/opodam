import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { exportarProgreso, importarProgreso } from '../services/storage'
import { enviarMagicLink, cerrarSesion, obtenerUsuario } from '../services/supabase'
import { sincronizar } from '../services/sync'
import type { User } from '@supabase/supabase-js'

export function Perfil() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [ultimoSync, setUltimoSync] = useState<string | null>(null)

  useEffect(() => {
    obtenerUsuario().then(setUsuario)
  }, [])

  async function handleMagicLink() {
    if (!email.includes('@')) { setMensaje('Introduce un email válido'); return }
    setEnviando(true)
    const { error } = await enviarMagicLink(email)
    setEnviando(false)
    setMensaje(error ? `Error: ${error}` : '✅ Email enviado. Revisa tu bandeja de entrada.')
  }

  async function handleSync() {
    setSyncing(true)
    await sincronizar()
    setUltimoSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    setSyncing(false)
    setMensaje('✅ Sincronizado correctamente')
  }

  async function handleCerrarSesion() {
    await cerrarSesion()
    setUsuario(null)
    setMensaje('Sesión cerrada.')
  }

  function handleExportar() {
    const json = exportarProgreso()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `opodam-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importarProgreso(ev.target!.result as string)
        setMensaje('✅ Progreso importado correctamente.')
      } catch {
        setMensaje('❌ Fichero inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold pt-4">👤 Mi cuenta</h1>

      {mensaje && (
        <div className="text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2">
          {mensaje}
        </div>
      )}

      <Card>
        {!usuario ? (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Sincroniza tu progreso entre dispositivos con un magic link (sin contraseña).
            </p>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
              />
              <button onClick={handleMagicLink} disabled={enviando}
                className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 whitespace-nowrap">
                {enviando ? '...' : 'Enviar enlace'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">✅ {usuario.email}</p>
                {ultimoSync && <p className="text-xs text-gray-400">🔄 Último sync: {ultimoSync}</p>}
              </div>
              <button onClick={handleCerrarSesion} className="text-xs text-gray-400 underline">
                Cerrar sesión
              </button>
            </div>
            <button onClick={handleSync} disabled={syncing}
              className="w-full mt-3 bg-brand-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
              {syncing ? 'Sincronizando...' : '🔄 Sincronizar ahora'}
            </button>
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">💾 Copia de seguridad</h2>
        <div className="flex gap-2">
          <button onClick={handleExportar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium hover:bg-gray-50">
            ⬇ Exportar progreso
          </button>
          <label className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 text-center cursor-pointer">
            ⬆ Importar progreso
            <input type="file" accept=".json" onChange={handleImportar} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          El backup incluye todo tu progreso, flashcards y resultados de exámenes.
        </p>
      </Card>
    </div>
  )
}
