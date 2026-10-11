import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY, LegalDocument, responsibleLine } from "@/app/components/layout/shared/LegalDocument";
import { FOUNDER_LIMIT, FOUNDER_MONTHS, PREMIUM_PRICE_COP, formatCOP } from "@/presentation/profile/lib/membership";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Reglas de uso de Que Hay Pa Hacer?, la cartelera de eventos y sitios de Ibagué.",
};

export default function TerminosPage() {
  return (
    <LegalDocument
      title="Términos y condiciones"
      intro={`${LEGAL_ENTITY.name} es una cartelera digital donde la comunidad publica y descubre eventos, planes y sitios en Ibagué. Al crear una cuenta o usar la plataforma aceptas estos términos.`}
    >
      <section>
        <h2>Tu cuenta</h2>
        <ul>
          <li>Debes dar información real y mantenerla actualizada.</li>
          <li>Eres responsable de lo que pase con tu cuenta; no compartas tu contraseña.</li>
          <li>Tu nombre de usuario es único y no puede suplantar a otra persona, marca o entidad.</li>
          <li>Puedes eliminar tu cuenta cuando quieras desde la configuración de tu perfil.</li>
        </ul>
      </section>

      <section>
        <h2>Contenido que publicas</h2>
        <p>
          Los eventos, sitios, imágenes y textos que publicas siguen siendo tuyos. Nos das una licencia gratuita y no
          exclusiva para mostrarlos, adaptarlos al formato de la plataforma y compartirlos mientras estén publicados.
        </p>
        <p>Al publicar confirmas que tienes derecho a hacerlo y que la información es veraz. No está permitido publicar:</p>
        <ul>
          <li>Eventos o sitios falsos, engañosos o que ya no existen.</li>
          <li>Contenido ilegal, violento, discriminatorio, sexual explícito o que vulnere derechos de terceros.</li>
          <li>Imágenes o marcas sobre las que no tienes derechos.</li>
          <li>Spam, publicidad no relacionada o enlaces maliciosos.</li>
        </ul>
      </section>

      <section>
        <h2>Una plataforma abierta</h2>
        <p>
          {LEGAL_ENTITY.name} es una plataforma tecnológica abierta: personas y organizaciones publican por su cuenta
          eventos y sitios, y otras personas los descubren. Actuamos como intermediario: no creamos, editamos, aprobamos
          ni garantizamos el contenido que publican los usuarios, y cada autor responde por lo que publica. Que
          podamos revisar o retirar contenido no nos convierte en organizadores ni en garantes de nada.
        </p>
      </section>

      <section>
        <h2>Revisión y retiro de contenido</h2>
        <p>
          El contenido puede pasar por una revisión antes o después de publicarse. Podemos rechazar, ocultar o retirar
          publicaciones que incumplan estos términos, y suspender cuentas que lo hagan de forma reiterada. Si crees que
          retiramos algo por error, escríbenos.
        </p>
      </section>

      <section>
        <h2>Cómo avisarnos de contenido ilegal o que infringe derechos</h2>
        <p>
          Si encuentras un evento, sitio o perfil que es ilegal, falso, peligroso o usa tu obra o imagen sin permiso,
          usa el botón <strong>Reportar</strong> de la página o escríbenos
          {LEGAL_ENTITY.email ? <> a <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a></> : <> desde <Link href={LEGAL_ENTITY.contactHref}>Contáctanos</Link></>}
          con:
        </p>
        <ul>
          <li>El enlace del contenido.</li>
          <li>Qué está mal y, si es un asunto de derechos de autor o de imagen, que eres el titular o su representante.</li>
          <li>Tus datos de contacto.</li>
        </ul>
        <p>
          Revisaremos el aviso lo antes posible. Si el contenido es ilegal o infringe derechos, lo retiraremos o
          suspenderemos la cuenta, y podemos pedirle su versión al autor. Si un tercero reclama por contenido que
          publicaste, responderás frente a esa persona y nos ayudarás a resolverlo.
        </p>
      </section>

      <section>
        <h2>Eventos de terceros</h2>
        <p>
          {LEGAL_ENTITY.name} no organiza los eventos publicados ni administra los sitios. Cada creador responde por la
          información, el precio, la realización y la seguridad de su evento. Las inscripciones o compras en enlaces
          externos se rigen por los términos de esos servicios. Te recomendamos confirmar los detalles con el creador
          antes de asistir.
        </p>
      </section>

      <section>
        <h2>Plan Premium</h2>
        <p>
          Algunas herramientas, como el Estudio, los eventos de varias fechas, el control de asistencia, los
          formularios personalizados, los colaboradores y el soporte prioritario, están disponibles con el plan{" "}
          <Link href="/premium">Premium</Link>.
        </p>
        <ul>
          <li>Premium cuesta {formatCOP(PREMIUM_PRICE_COP)} pesos colombianos por mes.</li>
          <li>La plataforma no procesa pagos en línea. Se paga por transferencia bancaria o Nequi y activamos el plan cuando confirmamos el pago.</li>
          <li>No hay renovación ni cobro automático. El plan dura el periodo pagado; al vencer, la cuenta vuelve a Básico. Tus eventos y sitios siguen publicados y las herramientas Premium se pausan hasta que renueves.</li>
          <li>Plan fundador: los primeros {FOUNDER_LIMIT} creadores que lo soliciten reciben {FOUNDER_MONTHS} meses de Premium sin costo, una sola vez por cuenta.</li>
          <li>Los pagos de periodos ya activados no son reembolsables, salvo cuando la ley lo exija o el servicio no pueda prestarse por causas atribuibles a nosotros.</li>
          <li>El precio y las funciones de cada plan pueden cambiar; los cambios no afectan el periodo que ya pagaste y te avisaremos antes.</li>
        </ul>
      </section>

      <section>
        <h2>Uso aceptable</h2>
        <p>
          No intentes acceder a cuentas o datos ajenos, interferir con el funcionamiento del servicio ni extraer
          información de forma automatizada sin autorización.
        </p>
      </section>

      <section>
        <h2>Responsabilidad</h2>
        <p>
          Ofrecemos la plataforma tal como está y trabajamos para que funcione de forma continua, pero no garantizamos
          que esté libre de errores o interrupciones. No respondemos por daños derivados del contenido publicado por
          usuarios ni de eventos organizados por terceros, en la medida en que la ley colombiana lo permita.
        </p>
      </section>

      <section>
        <h2>Datos personales</h2>
        <p>
          El tratamiento de tus datos se rige por nuestra <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </section>

      <section>
        <h2>Quién está detrás</h2>
        <p>{responsibleLine()}.</p>
      </section>

      <section>
        <h2>Cambios y ley aplicable</h2>
        <p>
          Podemos actualizar estos términos; si el cambio es importante te avisaremos en la plataforma. Estos términos
          se rigen por las leyes de la República de Colombia.
        </p>
      </section>
    </LegalDocument>
  );
}
