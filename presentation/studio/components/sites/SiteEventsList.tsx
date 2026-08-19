import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ChevronRight, Eye, ImageIcon, Users } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { SiteEventItem } from "../../view-models/StudioSitesViewModel";
import { EventsSearchInput } from "../events/EventsSearchInput";
import { EventsLimitSelect } from "../events/EventsLimitSelect";
import { CursorPagination } from "../events/CursorPagination";

interface SiteEventsListProps {
  /** Id del sitio, para construir los hrefs de paginación. */
  siteId: string;
  /** Eventos de la página actual (search + cursor server-side, `getEventsBySite`). */
  events: SiteEventItem[];
  /** Valor actual del query param `q`. */
  query: string;
  /** Tamaño de página actual (query param `limit`). */
  limit: number;
  /** Opciones del selector "Mostrar N". */
  limitOptions: number[];
  /** ISO del cursor para "Siguiente". `null` si no hay más páginas. */
  nextCursor: string | null;
  /** ISO del cursor para "Anterior". `null` si es la primera página. */
  prevCursor: string | null;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

const formatNumber = (n: number) => n.toLocaleString("es-CO");

export function SiteEventsList({
  siteId,
  events,
  query,
  limit,
  limitOptions,
  nextCursor,
  prevCursor,
}: SiteEventsListProps) {
  return (
    <div className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold text-slate-900">
          Itinerario de eventos{" "}
          <span className="font-normal text-slate-400">({events.length})</span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Pulsa un evento para ver sus estadísticas y registros.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <EventsSearchInput query={query} placeholder="Buscar evento…" />
        <EventsLimitSelect limit={limit} options={limitOptions} />
      </div>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {query ? "Sin resultados." : "Aún no hay eventos asociados a este sitio."}
        </p>
      ) : (
        <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
          {events.map((event) => {
            const published = event.status.toLowerCase() === "published";
            return (
              <li key={event.eventId}>
                <Link
                  href={`/studio/events/${event.eventId}`}
                  className="group flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
                    {event.image ? (
                      <Image src={event.image} alt={event.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                        {event.name}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {published ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                    {/* Previsualización rápida de analíticas */}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1" suppressHydrationWarning>
                        <CalendarDays className="h-3 w-3" />
                        {event.date ? formatDate(event.date) : "Sin fecha"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span className="tabular-nums">{formatNumber(event.views)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="tabular-nums">{formatNumber(event.registrations)}</span>
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-indigo-500" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(nextCursor || prevCursor) && (
        <div className="pt-1">
          <CursorPagination
            basePath={`/studio/sites/${siteId}`}
            query={query}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            extraParams={{ limit: String(limit) }}
          />
        </div>
      )}
    </div>
  );
}
