import { labelStyle } from '../lib/styles'

const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }
const CONTACT_EMAIL = 'diasporaspatrimoniales@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-stone-800" style={labelStyle}>{title}</h2>
      <div className="text-sm text-stone-500 leading-relaxed flex flex-col gap-2" style={labelStyle}>
        {children}
      </div>
    </div>
  )
}

export function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-white pt-navbar" style={labelStyle}>
      <div className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-10">

        <div className="flex flex-col gap-3">
          <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400">Legal</p>
          <h1 className="text-4xl uppercase tracking-tight text-stone-800" style={titleStyle}>
            Política de Privacidad y Cookies
          </h1>
          <p className="text-xs text-stone-400">Última actualización: junio 2026</p>
        </div>

        <div className="w-full h-px bg-stone-100" />

        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales recogidos a través de esta plataforma es
            la entidad gestora de <strong>Diásporas Patrimoniales</strong>.
            Para cualquier consulta relacionada con la privacidad puede contactar en:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-stone-700 transition-colors">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <p>Al crear una cuenta y utilizar la plataforma, podemos recopilar los siguientes datos:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li>Nombre y dirección de correo electrónico (mediante registro con email o Google)</li>
            <li>Historial de inscripciones a actividades</li>
            <li>Datos de sesión necesarios para la autenticación</li>
          </ul>
          <p>No recopilamos datos de pago, localización ni ningún otro dato sensible.</p>
        </Section>

        <Section title="3. Finalidad y base legal del tratamiento">
          <p>Los datos se tratan con las siguientes finalidades:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li><strong>Gestión de cuenta y autenticación</strong> — base legal: ejecución de contrato (art. 6.1.b GDPR)</li>
            <li><strong>Gestión de inscripciones a actividades</strong> — base legal: ejecución de contrato</li>
            <li><strong>Envío de email de confirmación de inscripción</strong> — base legal: ejecución de contrato</li>
            <li><strong>Cumplimiento de obligaciones legales</strong> — base legal: obligación legal (art. 6.1.c GDPR)</li>
          </ul>
        </Section>

        <Section title="4. Terceros encargados del tratamiento">
          <p>Para prestar el servicio utilizamos los siguientes proveedores que actúan como encargados del tratamiento:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li><strong>Google Firebase</strong> (Google LLC) — autenticación de usuarios y base de datos. Servidores en Europa (europe-west). Política: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">firebase.google.com/support/privacy</a></li>
            <li><strong>Vercel Inc.</strong> — alojamiento de la plataforma web y funciones de servidor. Política: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">vercel.com/legal/privacy-policy</a></li>
            <li><strong>Resend</strong> — envío de emails transaccionales de confirmación. Infraestructura en la región EU (Ireland). Política: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">resend.com/legal/privacy-policy</a></li>
            <li><strong>Cloudinary</strong> — gestión de imágenes (uso exclusivo del equipo administrador). Política: <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">cloudinary.com/privacy</a></li>
          </ul>
        </Section>

        <Section title="5. Cookies y almacenamiento local">
          <p>
            Esta plataforma utiliza exclusivamente <strong>cookies técnicas y almacenamiento local estrictamente necesarios</strong> para su funcionamiento:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li><strong>Token de sesión Firebase</strong> — almacenado en IndexedDB/localStorage para mantener la sesión iniciada</li>
            <li><strong>Caché local de Firestore</strong> — almacenado en IndexedDB para mejorar el rendimiento y el acceso sin conexión</li>
            <li><strong>Preferencia de cookies</strong> — almacenado en localStorage para recordar que has aceptado este aviso</li>
          </ul>
          <p>
            No se utilizan cookies publicitarias, de seguimiento, analíticas ni de terceros con fines comerciales.
            Al tratarse únicamente de cookies técnicas necesarias, no es posible rechazarlas sin afectar al funcionamiento de la plataforma.
          </p>
        </Section>

        <Section title="6. Conservación de los datos">
          <p>
            Los datos se conservan mientras la cuenta esté activa. Al eliminar tu cuenta, los datos personales
            asociados serán eliminados salvo que exista una obligación legal de conservarlos.
            Los registros de inscripción se conservan durante el periodo necesario para la gestión de las actividades.
          </p>
        </Section>

        <Section title="7. Tus derechos">
          <p>De acuerdo con el GDPR y la LOPDGDD, tienes derecho a:</p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
            <li><strong>Acceso</strong> — conocer qué datos tratamos sobre ti</li>
            <li><strong>Rectificación</strong> — corregir datos inexactos</li>
            <li><strong>Supresión</strong> — solicitar la eliminación de tus datos</li>
            <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado</li>
            <li><strong>Oposición y limitación</strong> — oponerte o limitar el tratamiento en determinadas circunstancias</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, contacta en{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-stone-700 transition-colors">
              {CONTACT_EMAIL}
            </a>.
            También tienes derecho a presentar una reclamación ante la{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Agencia Española de Protección de Datos (AEPD)
            </a>.
          </p>
        </Section>

        <div className="w-full h-px bg-stone-100" />

        <p className="text-xs text-stone-400" style={labelStyle}>
          Este documento puede actualizarse para reflejar cambios en la plataforma o en la legislación aplicable.
          La fecha de última actualización aparece al inicio de este documento.
        </p>

      </div>
    </main>
  )
}
