import { fetchEventDetailById } from "@/presentation/events/data/eventDetailFetchers";

/**
 * Detalle de evento con Parallel Routes:
 *  - `children` → encabezado del evento
 *  - `stats`    → SLOT A (estadísticas)
 *  - `registrations` → SLOT B (registros, según tipo)
 *  - `multidate` → SLOT alternativo para eventos con sesiones
 *
 * Los slots `stats`/`registrations` asumen un evento ÚNICO (con fecha, lugar y
 * registro propios). Un multi-date no tiene nada de eso en el documento padre:
 * vive en cada sesión. Por eso se ramifica con el patrón "Conditional Routes"
 * de Next. Al no renderizar un slot su page nunca se ejecuta, así que tampoco
 * dispara sus queries — ocultarlo por CSS sí las dispararía.
 */
export default async function EventDetailLayout(
  props: LayoutProps<"/studio/events/[id]">,
) {
  const { children, stats, registrations, multidate, params } = props;
  const { id } = await params;
  // Fetcher ya cacheado (tag `event-${id}`), compartido con el detalle público.
  const event = await fetchEventDetailById(id);

  if (event?.eventType === "multi-date") {
    return <div className="space-y-6">{multidate}</div>;
  }

  return (
    <div className="space-y-6">
      {children}
      {/* SLOT A arriba (estadísticas) y SLOT B abajo a ancho completo (la tabla de
          registros necesita el espacio para búsqueda, paginación y acciones). */}
      <div>{stats}</div>
      <div>{registrations}</div>
    </div>
  );
}
