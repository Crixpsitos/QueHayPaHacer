import type { ReactNode } from "react";

/**
 * Detalle de evento con Parallel Routes:
 *  - `children` → encabezado del evento
 *  - `stats`    → SLOT A (estadísticas)
 *  - `registrations` → SLOT B (registros, según tipo)
 */
export default function EventDetailLayout({
  children,
  stats,
  registrations,
}: {
  children: ReactNode;
  stats: ReactNode;
  registrations: ReactNode;
}) {
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
