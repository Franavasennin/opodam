// src/pages/Terminos.tsx
// Añadir ruta en App.tsx: <Route path="/terminos" element={<Terminos />} />
import { useSeo } from '../hooks/useSeo'

export default function Terminos() {
  useSeo({
    title: 'Términos y Condiciones',
    description: 'Términos y condiciones de uso de OpoDAM, plataforma de preparación de oposiciones en Canarias.',
    path: '/terminos',
  })
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
      <p className="text-xs text-gray-500 mb-8">Última actualización: 16 de junio de 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Titular del servicio</h2>
        <p>
          El presente sitio web y la aplicación <strong>OpoDAM</strong> (en adelante, «el Servicio») son
          titularidad de <strong>Francisco José Navarro Fabelo</strong>, con NIF <strong>[TU-NIF]</strong>,
          domicilio en Las Palmas de Gran Canaria (España) y dirección de correo electrónico de contacto:{' '}
          <a href="mailto:aasmannfran@gmail.com" className="text-amber-700 underline">
            aasmannfran@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Objeto y descripción del servicio</h2>
        <p>
          OpoDAM es una plataforma digital de preparación de oposiciones que ofrece temario estructurado,
          tests, flashcards, simulacros de examen, tutor con inteligencia artificial, módulo psicológico
          y seguimiento de progreso para los cuerpos disponibles en cada momento.
        </p>
        <p className="mt-3">
          El contenido del Servicio tiene carácter <strong>orientativo y pedagógico</strong>. OpoDAM no
          garantiza la aprobación de ninguna oposición ni la exactitud absoluta del temario, que puede
          diferir de la convocatoria vigente en cada momento. El usuario es responsable de contrastar la
          información con las bases oficiales publicadas en el BOE o BOC correspondiente.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Acceso y registro</h2>
        <p>
          El acceso a las funcionalidades de pago requiere registro mediante correo electrónico o cuenta
          Google. El usuario es responsable de mantener la confidencialidad de sus credenciales y de
          todas las actividades realizadas desde su cuenta.
        </p>
        <p className="mt-3">
          Está prohibido compartir la cuenta con terceros. El titular se reserva el derecho a suspender
          cuentas en caso de uso fraudulento o contrario a estos términos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Planes y precios</h2>
        <p>
          El acceso a cada oposición se contrata mediante suscripción mensual de{' '}
          <strong>19,90 € / mes</strong> (IVA incluido). Cada suscripción activa desbloquea todo el
          contenido disponible para esa oposición concreta.
        </p>
        <p className="mt-3">
          El titular se reserva el derecho a modificar los precios con un preaviso mínimo de 30 días.
          Los cambios no afectarán a los ciclos de facturación ya en curso.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Pago y renovación</h2>
        <p>
          El pago se procesa a través de <strong>Stripe</strong> mediante cargo en la tarjeta
          facilitada. La suscripción se renueva automáticamente cada mes en la misma fecha de alta,
          salvo que el usuario la cancele antes del inicio del siguiente período.
        </p>
        <p className="mt-3">
          En caso de fallo en el cobro, el acceso se suspenderá hasta que el pago sea regularizado.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Cancelación</h2>
        <p>
          El usuario puede cancelar su suscripción en cualquier momento desde su perfil. La cancelación
          surte efecto al final del período mensual en curso; el usuario conserva el acceso hasta dicha
          fecha sin cargo adicional.
        </p>
        <p className="mt-3">
          Para la política de reembolsos, consulte el documento específico en{' '}
          <a href="/reembolsos" className="text-amber-700 underline">
            /reembolsos
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Propiedad intelectual</h2>
        <p>
          Todo el contenido del Servicio (textos, código, diseño, estructura, bases de datos, logotipos)
          es propiedad del titular o de sus licenciantes y está protegido por las leyes de propiedad
          intelectual aplicables. Queda expresamente prohibida su reproducción, distribución o
          comunicación pública sin autorización escrita.
        </p>
        <p className="mt-3">
          El material de oposiciones derivado de textos legales oficiales (BOE, BOC) se incluye al
          amparo de las excepciones de uso educativo previstas en el Real Decreto Legislativo 1/1996.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Uso aceptable</h2>
        <p>El usuario se compromete a no:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Usar el Servicio para fines ilícitos o contrarios a la buena fe.</li>
          <li>Intentar acceder a contenido sin suscripción activa mediante medios técnicos.</li>
          <li>Distribuir, revender o sublicenciar el acceso a terceros.</li>
          <li>Introducir código malicioso o realizar ataques contra la infraestructura.</li>
          <li>Usar scraping automatizado sobre el contenido del Servicio.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Limitación de responsabilidad</h2>
        <p>
          El Servicio se presta «tal cual» («as is»). El titular no se responsabiliza de la
          disponibilidad continuada del servicio ni de errores en el contenido pedagógico que puedan
          derivar en un rendimiento inferior en el proceso selectivo. La responsabilidad máxima del
          titular frente al usuario queda limitada al importe abonado en los tres meses anteriores al
          hecho causante.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Modificaciones</h2>
        <p>
          El titular puede modificar estos Términos en cualquier momento. Los cambios sustanciales se
          notificarán por correo electrónico con al menos 15 días de antelación. El uso continuado del
          Servicio tras esa fecha implica la aceptación de los nuevos términos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por la legislación española. Para cualquier controversia derivada del
          Servicio, las partes se someten a los juzgados y tribunales de <strong>Las Palmas de Gran Canaria</strong>,
          salvo que la normativa de protección de consumidores establezca otro fuero.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">12. Contacto</h2>
        <p>
          Para cualquier consulta relacionada con estos Términos:{' '}
          <a href="mailto:aasmannfran@gmail.com" className="text-amber-700 underline">
            aasmannfran@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}
