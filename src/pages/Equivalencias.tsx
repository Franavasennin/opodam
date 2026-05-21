// src/pages/Equivalencias.tsx
import { useNavigate } from 'react-router-dom'

const FILAS_GENERAL = [
  ['Constitución 1978, derechos fundamentales y garantías', '1', '1, 2, 3', 'Total'],
  ['La Corona', '2', '4 (parte)', 'Alto'],
  ['Cortes Generales: Congreso y Senado', '3', '4 (parte)', 'Alto'],
  ['Poder Judicial, Ministerio Fiscal, TC, TS, TSJ', '4', '6', 'Total'],
  ['El Gobierno y organización territorial', '5', '5', 'Total'],
  ['Administración General del Estado', '6', '8 (parte)', 'Alto'],
  ['Administración territorial / CC.AA.', '7', '8', 'Total'],
  ['Administración local: provincia, municipio', '8', '8, 11, 12', 'Total'],
  ['Estatuto de Autonomía de Canarias', '9, 10', '7', 'Total'],
  ['Procedimiento administrativo y recursos', '12', '9', 'Total'],
  ['Jurisdicción contencioso-administrativa', '—', '10', 'Solo PL'],
  ['Cabildos Insulares (Ley 8/2015)', '16', '7, 11', 'Alto'],
  ['Municipios de Canarias (Ley 7/2015)', '17', '11, 12, 14, 15', 'Total'],
  ['Personal local / función pública', '20', '13', 'Alto'],
  ['Ordenanzas, bandos y licencias municipales', '—', '14', 'Solo PL'],
  ['Sesiones y participación ciudadana municipal', '—', '15', 'Solo PL'],
  ['Protección de datos', '19', '22 (parte)', 'Medio'],
]

const FILAS_ESPECIFICO = [
  ['LO 2/1986 — Fuerzas y Cuerpos de Seguridad', '24', '16', 'Total'],
  ['Sistema Canario de Seguridad y Emergencias (Ley 9/2007)', '25', '17, 21', 'Total'],
  ['Policía judicial y atestado', '35', '20', 'Total'],
  ['Seguridad ciudadana (LO 4/2015) + videocámaras', '40', '19', 'Total'],
  ['Derecho penal — parte general', '31', '23 (parte)', 'Total'],
  ['Delitos contra vida, libertad e indemnidad sexual', '32', '23', 'Total'],
  ['Delitos contra el patrimonio', '33 (parte)', '24', 'Total'],
  ['Delitos seguridad colectiva, drogas, vial, Admón. pública, orden público', '34', '25', 'Total'],
  ['Violencia de género (LO 1/2004)', '38, 39', '26', 'Total'],
  ['Responsabilidad penal del menor (LO 5/2000)', '37', '27', 'Total'],
  ['Tráfico y seguridad vial — Código de circulación', '42 (parte)', '29, 30, 31, 32, 33', 'Alto'],
  ['Turismo en Canarias', '42 (parte)', '36', 'Total'],
  ['Medio ambiente', '43 (parte)', '35', 'Total'],
  ['Población, demografía y extranjería', '44 (parte)', '37', 'Alto'],
  ['Policía de proximidad y patrullaje', '—', '22', 'Solo PL'],
  ['Delitos leves', '—', '28', 'Solo PL'],
  ['Sanidad, consumo, obras y espectáculos', '—', '34', 'Solo PL'],
  ['Ley 2/2008, Decreto 77/2010 y Reglamento de armas', '26-30', '—', 'Solo CGPC'],
  ['Sumario, procedimiento abreviado, habeas corpus', '36', '—', 'Solo CGPC'],
]

const SOLO_CGPC = [
  'Diputado del Común, Audiencia de Cuentas, Consejo Consultivo (T11)',
  'Derechos ciudadanos y acceso electrónico (T13)',
  'Organización admin. de Canarias I y II (T14, T15)',
  'Instituciones de la Unión Europea (T18)',
  'Prevención de riesgos laborales (T21)',
  'Responsabilidad patrimonial (T22)',
  'Ortografía (T23)',
  'Ley 2/2008 y Decreto 77/2010 del CGPC (T26-29)',
  'Reglamento de armas (T30)',
  'Sumario, abreviado y habeas corpus (T36)',
  'Protección de menores en Canarias (T41)',
  'Patrimonio histórico y pueblos aborígenes (T43)',
  'Territorio de Canarias y REF (T44)',
  'Informática básica, Word y redes (T45)',
]

const SOLO_PL = [
  'Jurisdicción contencioso-administrativa (T10)',
  'Ordenanzas, reglamentos, bandos y licencias municipales (T14)',
  'Sesiones municipales y participación ciudadana (T15)',
  'Policías Locales de Canarias (Ley 6/1997) y Academia (T18)',
  'Policía y sociedad, proximidad y patrullaje (T22)',
  'Delitos leves (T28)',
  'Tráfico y seguridad vial — desarrollo extenso (T29-33)',
  'Sanidad, consumo, obras y espectáculos (T34)',
]

function colorSolape(s: string) {
  switch (s) {
    case 'Total':     return 'bg-emerald-100 text-emerald-700'
    case 'Alto':      return 'bg-marca-100 text-marca-700'
    case 'Medio':     return 'bg-amber-100 text-amber-700'
    case 'Solo PL':   return 'bg-purple-100 text-purple-700'
    case 'Solo CGPC': return 'bg-rose-100 text-rose-700'
    default:          return 'bg-slate-100 text-slate-600'
  }
}

function Tabla({ filas }: { filas: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-2 font-semibold">Materia</th>
            <th className="py-2 px-2 font-semibold whitespace-nowrap">CGPC</th>
            <th className="py-2 px-2 font-semibold whitespace-nowrap">P. Local</th>
            <th className="py-2 pl-2 font-semibold">Solape</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([materia, cgpc, pl, solape]) => (
            <tr key={materia} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-2 text-slate-700">{materia}</td>
              <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{cgpc}</td>
              <td className="py-2 px-2 text-slate-500 whitespace-nowrap">{pl}</td>
              <td className="py-2 pl-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorSolape(solape)}`}>
                  {solape}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Equivalencias() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/mis-oposiciones')} className="text-marca-600 text-sm font-medium">
          ← Inicio
        </button>
        <span className="font-bold text-slate-900">Equivalencias entre temarios</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-12 space-y-4">
        {/* Hero */}
        <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-marca-900 to-marca-600">
          <h1 className="font-extrabold text-xl leading-tight">CGPC ↔ Policía Local</h1>
          <p className="text-sm text-marca-100 mt-1.5">
            Cruce entre los 45 temas del CGPC y los 37 de Policía Local. Quien prepara ambas oposiciones
            aprovecha entre el <span className="font-bold">60 % y el 70 %</span> del esfuerzo.
          </p>
        </div>

        {/* Bloque general */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Bloque general</h2>
          <p className="text-xs text-slate-500 mb-3">Derecho constitucional y administrativo</p>
          <Tabla filas={FILAS_GENERAL} />
        </section>

        {/* Bloque específico */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Bloque específico</h2>
          <p className="text-xs text-slate-500 mb-3">Seguridad, derecho penal y procesal</p>
          <Tabla filas={FILAS_ESPECIFICO} />
        </section>

        {/* Solo en cada oposición */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 mr-1">Solo CGPC</span>
            </h2>
            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-5">
              {SOLO_CGPC.map(t => <li key={t}>{t}</li>)}
            </ul>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-2">
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 mr-1">Solo Policía Local</span>
            </h2>
            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-5">
              {SOLO_PL.map(t => <li key={t}>{t}</li>)}
            </ul>
          </section>
        </div>

        {/* Estrategia */}
        <section className="bg-acento-100 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Estrategia de estudio</h2>
          <ol className="text-xs text-slate-700 space-y-1 list-decimal pl-5">
            <li><span className="font-semibold">Fase troncal compartida:</span> estudia las materias comunes una sola vez con el material más profundo de ambas.</li>
            <li><span className="font-semibold">Específicos CGPC:</span> Ley 2/2008, Decreto 77/2010, armas, UE, riesgos laborales, responsabilidad patrimonial, ortografía, REF e informática.</li>
            <li><span className="font-semibold">Específicos Policía Local:</span> Ley 6/1997, ordenanzas, tráfico ampliado, sanidad y consumo, espectáculos, delitos leves y proximidad.</li>
            <li><span className="font-semibold">Repaso cruzado final:</span> practica con tests y simulacros de ambas para fijar los matices propios de cada cuerpo.</li>
          </ol>
        </section>
      </main>
    </div>
  )
}
