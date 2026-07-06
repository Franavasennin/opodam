// src/pages/Reembolsos.tsx
// Añadir ruta en App.tsx: <Route path="/reembolsos" element={<Reembolsos />} />
import { useSeo } from '../hooks/useSeo'

export default function Reembolsos() {
  useSeo({
    title: 'Política de Reembolsos y Cancelaciones',
    description: 'Condiciones de reembolso y cancelación de la suscripción a OpoDAM.',
    path: '/reembolsos',
  })
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Reembolsos y Cancelaciones</h1>
      <p className="text-xs text-gray-500 mb-8">Última actualización: 16 de junio de 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Naturaleza del servicio</h2>
        <p>
          OpoDAM es un servicio digital de contenido educativo de acceso inmediato. Al suscribirse, el
          usuario acepta expresamente que el servicio comienza a prestarse de forma inmediata, renunciando
          al derecho de desistimiento de 14 días previsto en el art. 103.a) del Real Decreto Legislativo
          1/2007 (TRLGDCU) para el suministro de contenido digital no prestado en soporte material
          cuando la ejecución haya comenzado con el previo consentimiento y conocimiento del consumidor.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Cancelación de suscripción</h2>
        <p>
          El usuario puede cancelar su suscripción en cualquier momento desde su perfil, sin coste ni
          penalización. Tras la cancelación:
        </p>
        <ul className="list-disc list-inside mt-3 space-y-2">
          <li>
            El acceso al contenido de la oposición suscrita <strong>permanece activo hasta el fin del período mensual ya abonado</strong>.
          </li>
          <li>
            No se genera ningún cargo adicional a partir de la cancelación.
          </li>
          <li>
            El progreso y los datos del usuario se conservan durante 3 años por si decide reactivar la
            suscripción.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Política de reembolsos</h2>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="font-semibold text-amber-900">Regla general</p>
          <p className="mt-1">
            No se realizan reembolsos por el período de suscripción ya iniciado y en curso. La
            cancelación evita cargos futuros pero no genera devolución del mes en curso.
          </p>
        </div>

        <p className="font-medium mb-2">Excepciones (reembolso total del último cargo):</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Error de doble cargo:</strong> si Stripe ha procesado dos cobros en el mismo período,
            se reembolsa el duplicado en un plazo máximo de 5 días hábiles.
          </li>
          <li>
            <strong>Fallo técnico grave imputable al servicio:</strong> si OpoDAM ha estado inaccesible
            durante más de 72 horas consecutivas en un mes de suscripción y el usuario lo notifica en
            los 7 días siguientes, se evaluará el reembolso proporcional.
          </li>
          <li>
            <strong>Cargo accidental:</strong> si el usuario fue cargado tras solicitar la cancelación
            correctamente y antes de que esta surtiera efecto, se reembolsará íntegramente.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Cómo solicitar un reembolso</h2>
        <p>Envía un correo a{' '}
          <a href="mailto:aasmannfran@gmail.com" className="text-amber-700 underline">
            aasmannfran@gmail.com
          </a>{' '}
          con asunto <strong>«Reembolso OpoDAM»</strong> indicando:
        </p>
        <ul className="list-disc list-inside mt-3 space-y-1">
          <li>Tu correo electrónico de cuenta.</li>
          <li>Fecha y concepto del cargo.</li>
          <li>Motivo de la solicitud.</li>
        </ul>
        <p className="mt-3">
          Responderemos en un máximo de <strong>3 días hábiles</strong>. Los reembolsos aprobados se
          procesan a través de Stripe y suelen tardar 5–10 días hábiles en reflejarse en tu extracto
          bancario, dependiendo del banco emisor.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Ley aplicable</h2>
        <p>
          Esta política se rige por la legislación española, en particular el Real Decreto Legislativo
          1/2007 (TRLGDCU) y el resto de normativa de protección de consumidores y usuarios vigente en
          España.
        </p>
      </section>
    </div>
  );
}
