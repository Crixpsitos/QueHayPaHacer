import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY, LegalDocument } from "@/app/components/layout/shared/LegalDocument";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Que Hay Pa Hacer? recoge, usa y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalDocument
      title="Política de privacidad"
      intro={`Esta política explica qué datos personales trata ${LEGAL_ENTITY.name} cuando usas la plataforma, para qué los usa y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.`}
    >
      <section>
        <h2>Responsable del tratamiento</h2>
        <p>
          {LEGAL_ENTITY.name}, con domicilio en {LEGAL_ENTITY.city}. Puedes contactarnos para cualquier asunto
          relacionado con tus datos desde <Link href={LEGAL_ENTITY.contactHref}>Contáctanos</Link>.
        </p>
      </section>

      <section>
        <h2>Qué datos recogemos</h2>
        <ul>
          <li><strong>Cuenta:</strong> nombre, apellido, nombre de usuario, correo electrónico, teléfono y contraseña (cifrada por nuestro proveedor de autenticación). Si entras con Google, recibimos tu nombre, correo y foto de esa cuenta.</li>
          <li><strong>Perfil:</strong> foto, portada, biografía, sitio web y redes sociales que decidas agregar.</li>
          <li><strong>Contenido que publicas:</strong> eventos, sitios, imágenes, descripciones y colaboradores que acreditas.</li>
          <li><strong>Inscripciones:</strong> los eventos en los que te inscribes y las respuestas a los formularios que el creador del evento solicite.</li>
          <li><strong>Actividad:</strong> vistas, me gusta y compartidos de eventos y sitios, usados de forma agregada para ordenar y medir el contenido.</li>
          <li><strong>Contacto y soporte:</strong> el correo, teléfono y mensaje que nos envías.</li>
          <li><strong>Plan Premium:</strong> el historial de activaciones de tu plan (fechas, vencimiento y la referencia del pago que nos compartes). No recibimos ni guardamos datos de tarjetas ni claves bancarias: el pago lo haces desde tu banco o Nequi.</li>
        </ul>
      </section>

      <section>
        <h2>Para qué los usamos</h2>
        <ul>
          <li>Crear y mantener tu cuenta e iniciar sesión de forma segura.</li>
          <li>Mostrar tu perfil y el contenido que publicas en la cartelera de Ibagué.</li>
          <li>Gestionar tus inscripciones y permitir que el creador del evento las administre.</li>
          <li>Revisar el contenido publicado para evitar abuso, fraude o información falsa.</li>
          <li>Darte estadísticas de tus eventos y sitios si usas el Estudio.</li>
          <li>Responder tus mensajes y solicitudes de soporte.</li>
        </ul>
        <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>
      </section>

      <section>
        <h2>Qué es público y qué no</h2>
        <p>
          Tu nombre, nombre de usuario, foto y el contenido que publicas son visibles para cualquier visitante. Desde la
          configuración de tu perfil puedes hacerlo privado: en ese caso solo se muestran tu nombre, usuario y foto.
          Tu correo y teléfono nunca se muestran públicamente.
        </p>
        <p>
          Cuando te inscribes en un evento, su creador puede ver tu nombre, correo y las respuestas del formulario de
          inscripción para gestionar la asistencia.
        </p>
      </section>

      <section>
        <h2>Con quién los compartimos</h2>
        <p>
          Usamos Google Cloud y Firebase (Google LLC) para alojar la plataforma, la base de datos, las imágenes y la
          autenticación. Estos servicios pueden almacenar datos fuera de Colombia, con garantías de seguridad
          equivalentes. Solo compartiremos datos con autoridades cuando la ley lo exija.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Usamos cookies estrictamente necesarias para mantener tu sesión iniciada. No usamos cookies de publicidad ni
          de seguimiento de terceros.
        </p>
      </section>

      <section>
        <h2>Tus derechos</h2>
        <p>Como titular de los datos puedes:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos (la mayoría desde tu perfil).</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber cómo hemos usado tus datos.</li>
          <li>Revocar la autorización o pedir que eliminemos tus datos. Puedes eliminar tu cuenta desde la configuración del perfil.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
        </ul>
        <p>
          Responderemos consultas en un máximo de 10 días hábiles y reclamos en un máximo de 15 días hábiles, como
          establece la ley.
        </p>
      </section>

      <section>
        <h2>Conservación y seguridad</h2>
        <p>
          Conservamos tus datos mientras tengas una cuenta activa. Al eliminarla, borramos tu perfil y datos de cuenta;
          algunos registros pueden mantenerse el tiempo que exija la ley. Protegemos la información con cifrado en
          tránsito, control de acceso y reglas de seguridad en la base de datos.
        </p>
      </section>

      <section>
        <h2>Menores de edad</h2>
        <p>
          La plataforma está dirigida a mayores de 18 años. Los menores solo pueden usarla con autorización de su
          padre, madre o representante legal.
        </p>
      </section>

      <section>
        <h2>Cambios a esta política</h2>
        <p>
          Si cambiamos esta política te avisaremos en la plataforma. La fecha de la última actualización aparece al
          inicio de este documento. También puedes leer los <Link href="/terminos">términos y condiciones</Link>.
        </p>
      </section>
    </LegalDocument>
  );
}
