import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY, LegalDocument } from "@/app/components/layout/shared/LegalDocument";

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
        <h2>Revisión y retiro de contenido</h2>
        <p>
          El contenido puede pasar por una revisión antes o después de publicarse. Podemos rechazar, ocultar o retirar
          publicaciones que incumplan estos términos, y suspender cuentas que lo hagan de forma reiterada. Si crees que
          retiramos algo por error, escríbenos.
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
          Algunas herramientas, como el Estudio, los eventos de varias fechas, los colaboradores y el soporte
          prioritario, están disponibles con el plan Premium. Hoy la plataforma no procesa pagos. Las funciones de cada
          plan pueden cambiar; te avisaremos antes de hacerlo.
        </p>
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
        <h2>Cambios y ley aplicable</h2>
        <p>
          Podemos actualizar estos términos; si el cambio es importante te avisaremos en la plataforma. Estos términos
          se rigen por las leyes de la República de Colombia.
        </p>
      </section>
    </LegalDocument>
  );
}
