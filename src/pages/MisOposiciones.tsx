// src/pages/MisOposiciones.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerPerfil, obtenerUsuario } from '../services/supabase'
import { OPOSICIONES } from '../data/oposiciones'
import { setActiveSlug, getOposicionesLocales } from '../services/storage'
import type { Perfil } from '../types'
import { BannerNutriplan } from '../components/promo/BannerNutriplan'

export default function MisOposiciones() {
  const [oposicionesSlug, setOposicionesSlug] = useState<string[]>([])
  const [nombreUsuario, setNombreUsuario] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function cargar() {
      // 1. Mostrar inmediatamente lo que hay en localStorage (sin esperar red)
      const locales = getOposicionesLocales()
      if (locales.length > 0) setOposicionesSlug(locales)

      // 2. Pedir usuario y perfil a Supabase en paralelo
      const [usuario, perfil] = await Promise.all([obtenerUsuario(), obtenerPerfil()])
      if (usuario?.email) {
        setNombreUsuario(usuario.email.split('@')[0] ?? '')
      }
      // Si Supabase devuelve datos, actualizar (pueden ser más recientes)
      if (perfil && (perfil as Perfil).oposiciones.length > 0) {
        setOposicionesSlug((perfil as Perfil).oposiciones)
      }
    }
    cargar()
  }, [])

  function handleEntrar(slug: string) {
    setActiveSlug(slug)
    navigate(`/oposicion/${slug}`)
  }

  const misOposiciones = OPOSICIONES.filter(op => oposicionesSlug.includes(op.slug))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-slate-900 tracking-tight">OpoDAM</span>
        <div className="w-9 h-9 rounded-full bg-marca-600 text-white text-sm font-bold flex items-center justify-center uppercase">
          {nombreUsuario.charAt(0)}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <h1 className="text-xl font-bold text-slate-900">
          Hola, {nombreUsuario || 'opositor'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">Selecciona con qué oposición trabajar hoy</p>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Mis oposiciones</p>

        <div className="space-y-3">
          {misOposiciones.map(op => (
            <div
              key={op.slug}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-1.5 self-stretch rounded-full shrink-0"
                  style={{ background: op.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900">{op.nombre}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {op.numTemas ? `${op.numTemas} temas disponibles` : 'Contenido en preparación'}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">Toca para entrar</span>
                <button
                  onClick={() => handleEntrar(op.slug)}
                  className="bg-marca-600 hover:bg-marca-700 text-white transition-colors rounded-lg px-4 py-1.5 text-xs font-semibold"
                >
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/procoach')}
          className="mt-4 w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
        >
          <div className="text-sm font-semibold text-slate-900">ProCoach AI</div>
          <div className="text-xs text-slate-500">Entrenador IA para oposiciones fisicas</div>
        </button>

        <BannerNutriplan />
      </main>
    </div>
  )
}
