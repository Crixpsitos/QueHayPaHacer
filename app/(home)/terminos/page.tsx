import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY, LegalDocument, TE_PROTEJO_URL, responsibleLine } from "@/app/components/layout/shared/LegalDocument";
import { FOUNDER_LIMIT, FOUNDER_MONTHS, PREMIUM_PRICE_COP, formatCOP } from "@/presentation/profile/lib/membership";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Reglas de uso de Que Hay Pa Hacer?, la cartelera de eventos y sitios de Ibagué.",
};

export default function TerminosPage() {
  const reportChannel = LEGAL_ENTITY.email ? (
    <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
  ) : (
    <Link href={LEGAL_ENTITY.contactHref}>Contáctanos</Link>
  );

  return (
    <LegalDocument
      title="Términos y condiciones"
      intro={`${LEGAL_ENTITY.name} es una plataforma abierta donde la comunidad publica y descubre eventos, planes y sitios en Ibagué. Al crear una cuenta, publicar contenido o usar la plataforma aceptas estos términos. Léelos: explican qué hacemos nosotros y qué responsabilidades tiene cada persona.`}
    >
      <section>
        <h2>Qué es la plataforma y quién la ofrece</h2>
        <p>
          {LEGAL_ENTITY.name} es un software y un servicio tecnológico. Su creador y propietario ofrece las
          herramientas para que cualquier persona publique información y para que otras la encuentren. La plataforma,
          su código, su diseño y su marca son propiedad de su creador; usarla no te da derechos sobre ellos.
        </p>
        <p>
          Actuamos únicamente como <strong>intermediario tecnológico</strong>: no organizamos los eventos, no
          administramos los sitios, no vendemos entradas ni somos parte de lo que acuerden organizadores y asistentes.
        </p>
      </section>

      <section>
        <h2>Tu cuenta</h2>
        <ul>
          <li>Debes ser mayor de 18 años. Al registrarte declaras que lo eres.</li>
          <li>Debes dar información real y mantenerla actualizada.</li>
          <li>Eres responsable de lo que pase con tu cuenta; no compartas tu contraseña.</li>
          <li>Tu nombre de usuario es único y no puede suplantar a otra persona, marca o entidad.</li>
          <li>Puedes eliminar tu cuenta cuando quieras desde la configuración de tu perfil.</li>
        </ul>
        <p>
          Al aceptar estos términos guardamos la fecha y la versión que aceptaste, como prueba de tu aceptación.
        </p>
      </section>

      <section>
        <h2>Cada autor es responsable de lo que publica</h2>
        <p>
          Todo lo que publicas es responsabilidad tuya, no nuestra. Al publicar un evento o un sitio marcas una
          declaración que queda registrada con la fecha y la versión de estos términos. En ella confirmas, entre otras
          cosas, que:
        </p>
        <ul>
          <li>
            <strong>Tienes los derechos:</strong> eres el titular, o cuentas con licencia o autorización, de los textos,
            imágenes, videos, música, logos y marcas que publicas, y no infringes derechos de autor ni derechos
            conexos de nadie.
          </li>
          <li>
            <strong>Las personas que aparecen lo autorizaron:</strong> tienes el permiso de quienes se ven o se oyen en
            tu material y, si son menores de edad, el de su padre, madre o representante legal.
          </li>
          <li>
            <strong>La información es veraz:</strong> fecha, hora, lugar, precio, cupos y condiciones son reales, y avisas
            si algo cambia o se cancela.
          </li>
          <li>
            <strong>Cuentas con los permisos:</strong> licencias y autorizaciones exigidas por la ley y por las
            autoridades locales para tu evento o sitio.
          </li>
        </ul>
        <p>Si organizas un evento, además:</p>
        <ul>
          <li>
            Eres el organizador y el responsable de todo lo relacionado con él: aforo, seguridad, salubridad, seguros,
            permisos de aglomeración y de espectáculos públicos, licencias de comunicación pública de obras (por
            ejemplo, ante SAYCO y ACINPRO cuando aplique), venta responsable de alcohol y la protección de menores.
          </li>
          <li>
            Si vendes entradas o servicios, eres el vendedor frente a quien compra y debes cumplir las normas de
            protección al consumidor: información clara, precio total, derecho de retracto cuando aplique, garantías
            y devoluciones si cancelas o cambias el evento.
          </li>
          <li>
            Si recibes datos de inscritos, eres responsable de tratarlos conforme a la Ley 1581 de 2012: úsalos solo
            para el evento, no los vendas ni los cedas y no pidas datos sensibles (por ejemplo, de salud) salvo que sea
            indispensable y tengas la autorización expresa de cada persona.
          </li>
        </ul>
        <p>
          Si un tercero (un titular de derechos, un asistente, una autoridad) reclama por algo que publicaste, respondes
          tú frente a él y nos ayudas a resolverlo. En la medida en que la ley lo permita, nos mantendrás indemnes de
          los reclamos, costos y daños que se deriven de tu contenido o de tu evento, incluidos honorarios razonables de
          abogados.
        </p>
      </section>

      <section>
        <h2>Lo que no puedes publicar ni hacer</h2>
        <ul>
          <li>Eventos o sitios falsos, engañosos, fraudulentos o que ya no existen; estafas o cobros indebidos.</li>
          <li>Contenido ilegal, o que promueva delitos, violencia, odio o discriminación.</li>
          <li>Material sexual explícito. <strong>Tolerancia cero</strong> con cualquier contenido que sexualice o explote a menores de edad.</li>
          <li>Venta o promoción de bienes o servicios prohibidos por la ley (armas, drogas ilícitas, etc.).</li>
          <li>Imágenes, música, textos o marcas sobre los que no tienes derechos, o imágenes de personas sin su permiso.</li>
          <li>Suplantar a otra persona o entidad, o inventar reseñas, cifras o asistentes.</li>
          <li>Spam, publicidad no relacionada, enlaces maliciosos o intentos de acceder a cuentas o datos ajenos.</li>
          <li>Extraer información de forma automatizada, interferir con el servicio o copiar, descompilar o revender el software.</li>
        </ul>
      </section>

      <section>
        <h2>Una plataforma abierta, no un garante</h2>
        <ul>
          <li>No tenemos la obligación de vigilar ni revisar de manera general lo que publican los usuarios.</li>
          <li>No garantizamos que el contenido sea veraz, legal, seguro o que los eventos ocurran como se anuncian.</li>
          <li>Las inscripciones, compras y pagos que se hagan por fuera de la plataforma o en enlaces externos se rigen por los términos de esos terceros.</li>
          <li>Que podamos revisar, ocultar o retirar contenido no nos convierte en organizadores, vendedores ni garantes. Moderar no equivale a aprobar.</li>
          <li>Te recomendamos confirmar los detalles con el organizador antes de asistir o pagar.</li>
        </ul>
      </section>

      <section>
        <h2>Moderación y cumplimiento de la ley</h2>
        <p>
          Aplicamos moderación con la diligencia razonable que está a nuestro alcance para respetar la ley colombiana. El
          contenido puede pasar por revisión antes o después de publicarse, y atendemos los reportes de la comunidad.
          Podemos, sin previo aviso cuando sea necesario para cumplir la ley o proteger a otras personas:
        </p>
        <ul>
          <li>Rechazar, ocultar o retirar publicaciones.</li>
          <li>Suspender o cerrar cuentas, de inmediato si la infracción es grave o reiterada.</li>
          <li>Conservar evidencia (contenido, reportes y decisiones) y entregarla a las autoridades cuando la pidan.</li>
          <li>Denunciar ante las autoridades competentes los hechos que lo ameriten.</li>
        </ul>
        <p>Si crees que retiramos algo por error, escríbenos y lo revisamos.</p>
      </section>

      <section>
        <h2>Cómo avisarnos de contenido ilegal o que infringe derechos</h2>
        <p>
          Si encuentras un evento, sitio o perfil que es ilegal, falso, peligroso o usa tu obra o tu imagen sin permiso,
          usa el botón <strong>Reportar</strong> de la página o escribe a {reportChannel} con:
        </p>
        <ul>
          <li>El enlace del contenido.</li>
          <li>Qué está mal y por qué. Si es un asunto de derechos de autor o de imagen, que eres el titular o su representante.</li>
          <li>Tus datos de contacto y la declaración de que actúas de buena fe.</li>
        </ul>
        <p>
          Revisaremos el aviso lo antes posible. Si hay indicios razonables, podemos ocultar el contenido mientras lo
          revisamos; si es ilegal o infringe derechos lo retiramos y, si corresponde, suspendemos la cuenta. Le
          informamos al autor y le damos la oportunidad de responder; si el aviso resulta infundado podemos restablecer
          el contenido. Enviar avisos falsos o de mala fe puede llevar a la suspensión de tu cuenta.
        </p>
        <p>
          <strong>Explotación sexual de menores:</strong> si ves este tipo de contenido, denúncialo directamente en{" "}
          <a href={TE_PROTEJO_URL} target="_blank" rel="noopener noreferrer">
            Te Protejo
          </a>{" "}
          o ante la Policía Nacional, y también repórtalo aquí. Lo retiraremos de inmediato y lo pondremos en conocimiento
          de las autoridades.
        </p>
      </section>

      <section>
        <h2>Uso de tus datos para gestionar incumplimientos</h2>
        <p>
          Al crear tu cuenta y aceptar estos términos autorizas que usemos tus datos (identificación y contacto, el
          contenido que publicas, tus aceptaciones, reportes, decisiones de moderación y registros de actividad) para:
        </p>
        <ul>
          <li>Prevenir, detectar, investigar y gestionar fraude, abuso e incumplimientos de la ley o de estos términos.</li>
          <li>Atender reclamos de terceros y requerimientos de las autoridades.</li>
          <li>Conservar la evidencia necesaria para defender derechos y cumplir obligaciones legales.</li>
          <li>
            Entregar tus datos a las autoridades competentes cuando los exijan y, cuando la ley lo permita o lo
            ordene, a quien tenga un reclamo legítimo contra tu contenido o tu evento para que lo resuelvan directamente
            contigo.
          </li>
        </ul>
        <p>
          Si organizas eventos con venta de entradas o servicios al público, podemos pedirte datos adicionales de
          identificación (por ejemplo, documento, dirección y teléfono) y guardarlos. Esa información puede ser consultada
          por quien haya comprado para presentar una queja y debe entregarse a la autoridad que la solicite.
        </p>
        <p>
          El tratamiento de tus datos se rige por la <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </section>

      <section>
        <h2>Contenido que publicas: licencia</h2>
        <p>
          Lo que publicas sigue siendo tuyo. Nos das una licencia gratuita, no exclusiva y limitada para mostrarlo,
          adaptarlo al formato de la plataforma (por ejemplo, optimizar imágenes) y compartirlo mientras esté
          publicado, y para conservarlo como evidencia cuando sea necesario según estos términos.
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
          <li>Los pagos de periodos ya activados no son reembolsables, salvo cuando la ley lo exija (por ejemplo, el derecho de retracto) o el servicio no pueda prestarse por causas atribuibles a nosotros.</li>
          <li>El precio y las funciones de cada plan pueden cambiar; los cambios no afectan el periodo que ya pagaste y te avisaremos antes.</li>
        </ul>
      </section>

      <section>
        <h2>Disponibilidad y límites de responsabilidad</h2>
        <p>
          Ofrecemos la plataforma tal como está y trabajamos para que funcione de forma continua, pero no garantizamos
          que esté libre de errores o interrupciones. Hasta donde la ley colombiana lo permita:
        </p>
        <ul>
          <li>No respondemos por el contenido publicado por usuarios, por los eventos o sitios de terceros, ni por lo que ocurra en ellos.</li>
          <li>No respondemos por daños indirectos, lucro cesante ni pérdida de oportunidades.</li>
          <li>Nuestra responsabilidad por daños directos causados por el servicio se limita a lo que hayas pagado por Premium en los últimos 12 meses.</li>
        </ul>
        <p>
          Esto no excluye la responsabilidad que la ley no permite excluir (por ejemplo, por dolo o culpa grave) ni los
          derechos que la ley te reconoce como consumidor.
        </p>
      </section>

      <section>
        <h2>Suspensión y cierre de cuentas</h2>
        <p>
          Puedes cerrar tu cuenta cuando quieras. Nosotros podemos suspenderla o cerrarla si incumples estos términos o la
          ley, o si lo exige una autoridad. El cierre no borra la evidencia que debamos conservar según la política de
          privacidad.
        </p>
      </section>

      <section>
        <h2>Quién está detrás</h2>
        <p>{responsibleLine()}.</p>
      </section>

      <section>
        <h2>Cambios, ley aplicable y reclamos</h2>
        <p>
          Podemos actualizar estos términos; si el cambio es importante te avisaremos en la plataforma y, si
          corresponde, te pediremos aceptarlos de nuevo. Estos términos se rigen por las leyes de la República de
          Colombia. Para peticiones, quejas o reclamos escríbenos primero a {reportChannel}; lo atendemos y respondemos
          dentro de los plazos legales. Lo que no se resuelva así corresponde a los jueces y autoridades competentes de
          Colombia.
        </p>
      </section>
    </LegalDocument>
  );
}
