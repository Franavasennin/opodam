// src/pages/MisOposiciones.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerPerfil, obtenerUsuario } from '../services/supabase'
import { OPOSICIONES } from '../data/oposiciones'
import { setActiveSlug } from '../services/storage'
import type { Perfil } from '../types'

export default function MisOposiciones() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function cargar() {
      const [usuario, p] = await Promise.all([obtenerUsuario(), obtenerPerfil()])
      if (usuario?.email) {
        const partes = usuario.email.split('@')
        setNombreUsuario(partes[0] ?? '')
      }
      setPerfil(p)
    }
    cargar()
  }, [])

  function handleEntrar(slug: string) {
    setActiveSlug(slug)
    navigate(`/oposicion/${slug}`)
  }

  const misOposiciones = perfil
    ? OPOSICIONES.filter(op => perfil.oposiciones.includes(op.slug))
    : []

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <span className="font-extrabold text-slate-800">OpoDAM</span>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center uppercase">
          {nombreUsuario.charAt(0)}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <h1 className="text-lg font-bold text-slate-800">
          Hola, {nombreUsuario || 'opositor'}
        </h1>
        <p className="text-sm text-slate-500 mb-5">Selecciona con qué oposición trabajar hoy</p>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Mis oposiciones</p>

        <div className="space-y-3">
          {misOposiciones.map(op => (
            <div
              key={op.slug}
              className="rounded-2xl p-4 text-white"
              style={{ background: `linear-gradient(135deg, ${op.color}dd, ${op.color})` }}
            >
              <div className="font-bold text-sm">{op.nombre}</div>
              <div className="text-xs opacity-80 mt-0.5">
                {op.numTemas ? `${op.numTemas} temas disponibles` : 'Contenido en preparación'}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs opacity-90">Toca para entrar</span>
                <button
                  onClick={() => handleEntrar(op.slug)}
                  className="bg-white/25 hover:bg-white/40 transition-colors rounded-lg px-3 py-1 text-xs font-semibold"
                >
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
