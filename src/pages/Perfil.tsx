import { useState, useEffect } from 'react'
import { exportarProgreso, importarProgreso } from '../services/storage'
import { enviarMagicLink, cerrarSesion, obtenerUsuario } from '../services/supabase'
import { sincronizar } from '../services/sync'
import { Icon } from '../components/ui/Icon'
import type { User } from '@supabase/supabase-js'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

/**
 * El aviso lleva el tipo aparte del texto: antes el emoji de estado iba dentro
 * de la propia cadena, así que el banner no podía teñirse distinto según fuese
 * error o confirmación y el lector de pantalla lo verbalizaba.
 */
type Aviso = { tipo: 'ok' | 'error' | 'info'; texto: string }

export function Perfil() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [mensaje, setMensaje] = useState<Aviso | null>(null)
  const [ultimoSync, setUltimoSync] = useState<string | null>(null)

  useEffect(() => {
    obtenerUsuario().then(setUsuario)
  }, [])

  async function handleMagicLink() {
    if (!email.includes('@')) { setMensaje({ tipo: 'error', texto: 'Introduce un email válido' }); return }
    setEnviando(true)
    const { error } = await enviarMagicLink(email)
    setEnviando(false)
    setMensaje(error
      ? { tipo: 'error', texto: `Error: ${error}` }
      : { tipo: 'ok', texto: 'Email enviado. Revisa tu bandeja de entrada.' })
  }

  async function handleSync() {
    setSyncing(true)
    await sincronizar()
    setUltimoSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    setSyncing(false)
    setMensaje({ tipo: 'ok', texto: 'Sincronizado correctamente' })
  }

  async function handleCerrarSesion() {
    await cerrarSesion()
    setUsuario(null)
    setMensaje({ tipo: 'info', texto: 'Sesión cerrada.' })
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
        setMensaje({ tipo: 'ok', texto: 'Progreso importado correctamente.' })
      } catch {
        setMensaje({ tipo: 'error', texto: 'Fichero inválido.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const fieldStyle: React.CSSProperties = {
    flex: 1, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg)', color: 'var(--ink)', padding: '8px 12px', fontSize: 13.5,
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Mi cuenta</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Cuenta y datos</div>
          <h1 className="display" style={{ margin: 0, fontSize: 30, letterSpacing: '-0.015em' }}>
            Tu <span className="display-italic" style={{ color: 'var(--accent)' }}>progreso</span>, contigo.
          </h1>
        </div>

        {mensaje && (
          <div className="rounded-xl px-4 py-2" role="status" style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            background: mensaje.tipo === 'error' ? 'var(--warn-soft)' : 'var(--accent-soft)',
            color: mensaje.tipo === 'error' ? 'var(--warn)' : 'var(--accent)',
          }}>
            {mensaje.tipo !== 'info' && (
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                <Icon nombre={mensaje.tipo === 'ok' ? 'acierto' : 'fallo'} size={15} />
              </span>
            )}
            <span>{mensaje.texto}</span>
          </div>
        )}

        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          {!usuario ? (
            <>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Sincroniza tu progreso entre dispositivos con un magic link (sin contraseña).
              </p>
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                  style={fieldStyle} onKeyDown={e => e.key === 'Enter' && handleMagicLink()} />
                <button onClick={handleMagicLink} disabled={enviando} className="btn-editorial btn-acc" style={{ whiteSpace: 'nowrap', opacity: enviando ? 0.5 : 1 }}>
                  {enviando ? '…' : 'Enviar enlace'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--accent)' }}><Icon nombre="acierto" size={15} /> {usuario.email}</p>
                  {ultimoSync && <p className="num-display" style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '2px 0 0', fontSize: 11.5, color: 'var(--mute)' }}><Icon nombre="repetir" size={13} /> Último sync: {ultimoSync}</p>}
                </div>
                <button onClick={handleCerrarSesion} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 12, color: 'var(--mute)', textDecoration: 'underline' }}>Cerrar sesión</button>
              </div>
              <button onClick={handleSync} disabled={syncing} className="btn-editorial btn-acc" style={{ width: '100%', marginTop: 14, opacity: syncing ? 0.5 : 1 }}>
                {syncing ? 'Sincronizando…' : <><Icon nombre="repetir" size={17} /> Sincronizar ahora</>}
              </button>
            </>
          )}
        </div>

        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}><Icon nombre="copia" size={14} /> Copia de seguridad</div>
          <div className="flex gap-2">
            <button onClick={handleExportar} className="btn-editorial btn-sec" style={{ flex: 1 }}><Icon nombre="descargar" size={17} /> Exportar</button>
            <label className="btn-editorial btn-sec" style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
              <Icon nombre="subir" size={17} /> Importar
              <input type="file" accept=".json" onChange={handleImportar} className="hidden" />
            </label>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 10 }}>
            El backup incluye todo tu progreso, flashcards y resultados de exámenes.
          </p>
        </div>
      </main>
    </div>
  )
}
