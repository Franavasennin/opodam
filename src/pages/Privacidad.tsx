// src/pages/Privacidad.tsx
// Añadir ruta en App.tsx: <Route path="/privacidad" element={<Privacidad />} />
import { useSeo } from '../hooks/useSeo'

export default function Privacidad() {
  useSeo({
    title: 'Política de Privacidad',
    description: 'Cómo tratamos tus datos personales en OpoDAM, plataforma de preparación de oposiciones en Canarias.',
    path: '/privacidad',
  })
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
      <p className="text-xs text-gray-500 mb-8">Última actualización: 16 de junio de 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Responsable del tratamiento</h2>
        <p>
          <strong>Francisco José Navarro Fabelo</strong> — NIF: <strong>[TU-NIF]</strong>
          <br />
          Las Palmas de Gran Canaria, España
          <br />
          Correo de contacto:{' '}
          <a href="mailto:aasmannfran@gmail.com" className="text-amber-700 underline">
            aasmannfran@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Datos que recogemos</h2>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="bg-amber-50">
              <th className="border border-amber-200 px-3 py-2 text-left">Dato</th>
              <th className="border border-amber-200 px-3 py-2 text-left">Cuándo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Correo electrónico', 'Al registrarse'],
              ['Proveedor OAuth (Google)', 'Si usa «Entrar con Google»'],
              ['Progreso y resultados de tests', 'Durante el uso de la app'],
              ['Conversaciones con el tutor IA', 'Al usar el tutor (almacenadas por oposición)'],
              ['Datos de pago (tokenizados)', 'Al suscribirse — gestionados por Stripe, OpoDAM no almacena nº de tarjeta'],
              ['Dirección IP (temporal)', 'Para rate-limiting de las funciones IA'],
              ['Errores y excepciones', 'Automáticamente, vía Sentry (sin datos personales en el stack trace)'],
            ].map(([dato, cuando]) => (
              <tr key={dato} className="border-b border-amber-100">
                <td className="border border-amber-200 px-3 py-2">{dato}</td>
                <td className="border border-amber-200 px-3 py-2">{cuando}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Finalidades y base jurídica</h2>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="bg-amber-50">
              <th className="border border-amber-200 px-3 py-2 text-left">Finalidad</th>
              <th className="border border-amber-200 px-3 py-2 text-left">Base jurídica (RGPD)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Gestión de cuenta y acceso al servicio', 'Ejecución de contrato (art. 6.1.b)'],
              ['Procesamiento de pagos y facturación', 'Ejecución de contrato (art. 6.1.b)'],
              ['Envío de correos transaccionales (confirmación de pago, racha, convocatoria)', 'Ejecución de contrato (art. 6.1.b)'],
              ['Detección de errores técnicos (Sentry)', 'Interés legítimo (art. 6.1.f)'],
              ['Mejora del servicio mediante análisis de uso agregado', 'Interés legítimo (art. 6.1.f)'],
            ].map(([fin, base]) => (
              <tr key={fin} className="border-b border-amber-100">
                <td className="border border-amber-200 px-3 py-2">{fin}</td>
                <td className="border border-amber-200 px-3 py-2">{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Encargados del tratamiento (terceros)</h2>
        <p className="mb-3">OpoDAM utiliza los siguientes proveedores, con los que existen o existen cláusulas de protección de datos:</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-amber-50">
              <th className="border border-amber-200 px-3 py-2 text-left">Proveedor</th>
              <th className="border border-amber-200 px-3 py-2 text-left">Finalidad</th>
              <th className="border border-amber-200 px-3 py-2 text-left">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Supabase', 'Base de datos y autenticación', 'UE (AWS Frankfurt)'],
              ['Stripe', 'Procesamiento de pagos', 'UE / EE.UU. (SCCs)'],
              ['Groq Cloud', 'Tutor IA y generación de contenido', 'EE.UU. (SCCs)'],
              ['SendGrid (Twilio)', 'Correos transaccionales', 'EE.UU. (SCCs)'],
              ['Sentry', 'Monitorización de errores', 'UE (Frankfurt)'],
              ['Netlify', 'Alojamiento y funciones serverless', 'EE.UU. (SCCs)'],
            ].map(([p, f, u]) => (
              <tr key={p} className="border-b border-amber-100">
                <td className="border border-amber-200 px-3 py-2 font-medium">{p}</td>
                <td className="border border-amber-200 px-3 py-2">{f}</td>
                <td className="border border-amber-200 px-3 py-2">{u}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          SCCs = Cláusulas Contractuales Estándar aprobadas por la Comisión Europea (art. 46.2.c RGPD).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Plazo de conservación</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Datos de cuenta y progreso: mientras la cuenta esté activa + 3 años tras la baja.</li>
          <li>Datos de facturación: 5 años (obligación fiscal, art. 66 LGT).</li>
          <li>Conversaciones del tutor IA: mientras la cuenta esté activa; se eliminan al dar de baja la cuenta.</li>
          <li>IPs de rate-limiting: 24 horas.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Derechos del interesado</h2>
        <p>
          Puede ejercer sus derechos de <strong>acceso, rectificación, supresión, oposición, portabilidad y
          limitación del tratamiento</strong> escribiendo a{' '}
          <a href="mailto:aasmannfran@gmail.com" className="text-amber-700 underline">
            aasmannfran@gmail.com
          </a>{' '}
          con asunto «RGPD – [derecho que ejerce]». Responderemos en el plazo máximo de 30 días.
        </p>
        <p className="mt-3">
          Si considera que el tratamiento vulnera sus derechos, puede presentar reclamación ante la{' '}
          <strong>Agencia Española de Protección de Datos</strong> (
          <a href="https://www.aepd.es" className="text-amber-700 underline" target="_blank" rel="noopener noreferrer">
            www.aepd.es
          </a>
          ).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Cookies</h2>
        <p>
          OpoDAM utiliza exclusivamente cookies técnicas necesarias para la autenticación de sesión
          (gestionadas por Supabase). No se emplean cookies de seguimiento publicitario ni se comparten
          datos con redes de publicidad.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Cambios en esta política</h2>
        <p>
          Cualquier modificación sustancial será notificada por correo electrónico con al menos 15 días
          de antelación. La versión vigente siempre estará disponible en{' '}
          <a href="/privacidad" className="text-amber-700 underline">
            opodam.netlify.app/privacidad
          </a>
          .
        </p>
      </section>
    </div>
  );
}
