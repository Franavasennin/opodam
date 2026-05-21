import { useNavigate } from 'react-router-dom'

export default function ProCoachAI() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/mis-oposiciones')} className="text-marca-600 text-sm">
          &larr; Inicio
        </button>
        <span className="font-bold text-slate-900">ProCoach AI</span>
      </header>
      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-marca-900 to-marca-600">
          <h1 className="font-extrabold text-xl">ProCoach AI</h1>
          <p className="text-sm opacity-90 mt-1">
            App movil con 1 agente IA especializado de disciplina deportiva: chat en
            tiempo real, gym mode, analisis de fotos, voz y planes personalizados.
            Backend Express + SQLite.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Agente</p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-marca-100 text-marca-700">DELTA</span>
            <div>
              <div className="text-sm font-semibold text-slate-900">Oposiciones fisicas</div>
              <div className="text-xs text-slate-500">Especialista GC, Policia, FF.AA. Espana</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/procoach/chat')}
            className="mt-3 w-full bg-marca-600 hover:bg-marca-700 transition-colors text-white text-sm font-semibold rounded-xl py-2.5"
          >
            Hablar con DELTA
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Capacidades</p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc pl-5">
            <li>Memoria activa (ultimos 20 mensajes)</li>
            <li>Modo gym (respuestas de 150 tokens o menos)</li>
            <li>Deteccion de problemas</li>
            <li>Limites profesionales</li>
          </ul>
        </div>

        <div className="bg-acento-100 rounded-2xl p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Nicho de entrada:</span> oposiciones fisicas.
            Sin competencia directa en Espana y demanda constante.
          </p>
        </div>
      </main>
    </div>
  )
}
