// src/pages/Equivalencias.tsx
import { useNavigate } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

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

function estiloSolape(s: string): React.CSSProperties {
  switch (s) {
    case 'Total':     return { background: 'var(--accent-soft)', color: 'var(--accent)' }
    case 'Alto':      return { background: 'color-mix(in srgb, #a07a2c 16%, transparent)', color: '#a07a2c' }
    case 'Medio':     return { background: 'var(--warn-soft)', color: 'var(--warn)' }
    case 'Solo PL':   return { background: 'var(--surface-2)', color: 'var(--ink-soft)' }
    case 'Solo CGPC': return { background: 'var(--surface-2)', color: 'var(--ink-soft)' }
    default:          return { background: 'var(--surface-2)', color: 'var(--mute)' }
  }
}

function Tabla({ filas }: { filas: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--mute)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '8px 8px 8px 0', fontWeight: 600 }}>Materia</th>
            <th className="num-display" style={{ padding: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>CGPC</th>
            <th className="num-display" style={{ padding: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>P. Local</th>
            <th style={{ padding: '8px 0 8px 8px', fontWeight: 600 }}>Solape</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([materia, cgpc, pl, solape]) => (
            <tr key={materia} style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <td style={{ padding: '8px 8px 8px 0', color: 'var(--ink-soft)' }}>{materia}</td>
              <td className="num-display" style={{ padding: '8px', color: 'var(--mute)', whiteSpace: 'nowrap' }}>{cgpc}</td>
              <td className="num-display" style={{ padding: '8px', color: 'var(--mute)', whiteSpace: 'nowrap' }}>{pl}</td>
              <td style={{ padding: '8px 0 8px 8px' }}>
                <span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, ...estiloSolape(solape) }}>{solape}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Equivalencias() {
  useSeo({
    title: 'Equivalencias de temario entre oposiciones',
    description: 'Tabla de equivalencias de temario entre Policía Canaria (CGPC) y Policía Local en Canarias.',
    path: '/equivalencias',
  })
  const navigate = useNavigate()
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate('/mis-oposiciones')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Equivalencias entre temarios</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="hero" style={{ padding: 24 }}>
          <div className="hero-grain" />
          <div style={{ position: 'relative' }}>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Dos oposiciones, un esfuerzo</div>
            <h1 className="display" style={{ margin: '8px 0 6px', fontSize: 26 }}>CGPC <span className="display-italic" style={{ color: 'var(--accent)' }}>↔</span> Policía Local</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.5 }}>
              Cruce entre los 45 temas del CGPC y los 37 de Policía Local. Quien prepara ambas aprovecha entre el <strong>60 % y el 70 %</strong> del esfuerzo.
            </p>
          </div>
        </div>

        <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Bloque general</div>
          <p style={{ fontSize: 11.5, color: 'var(--mute)', margin: '2px 0 12px' }}>Derecho constitucional y administrativo</p>
          <Tabla filas={FILAS_GENERAL} />
        </section>

        <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Bloque específico</div>
          <p style={{ fontSize: 11.5, color: 'var(--mute)', margin: '2px 0 12px' }}>Seguridad, derecho penal y procesal</p>
          <Tabla filas={FILAS_ESPECIFICO} />
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div style={{ marginBottom: 8 }}><span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>Solo CGPC</span></div>
            <ul style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SOLO_CGPC.map(t => <li key={t}>{t}</li>)}
            </ul>
          </section>
          <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div style={{ marginBottom: 8 }}><span style={{ display: 'inline-block', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>Solo Policía Local</span></div>
            <ul style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SOLO_PL.map(t => <li key={t}>{t}</li>)}
            </ul>
          </section>
        </div>

        <section className="card" style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-soft)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Estrategia de estudio</div>
          <ol style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.45 }}>
            <li><strong>Fase troncal compartida:</strong> estudia las materias comunes una sola vez con el material más profundo de ambas.</li>
            <li><strong>Específicos CGPC:</strong> Ley 2/2008, Decreto 77/2010, armas, UE, riesgos laborales, responsabilidad patrimonial, ortografía, REF e informática.</li>
            <li><strong>Específicos Policía Local:</strong> Ley 6/1997, ordenanzas, tráfico ampliado, sanidad y consumo, espectáculos, delitos leves y proximidad.</li>
            <li><strong>Repaso cruzado final:</strong> practica con tests y simulacros de ambas para fijar los matices propios de cada cuerpo.</li>
          </ol>
        </section>
      </main>
    </div>
  )
}
