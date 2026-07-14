import Link from "next/link";
import { Plus } from "lucide-react";
import type { StudioEventListItem } from "../../view-models/StudioEventsViewModel";
import { CursorPagination } from "./CursorPagination";
import { EventsLimitSelect } from "./EventsLimitSelect";
import { EventsSearchInput } from "./EventsSearchInput";
import { EventsTable } from "./EventsTable";

interface EventsListProps {
  events: StudioEventListItem[];
  limit: number;
  limitOptions: number[];
  /** Valor actual del query param `q` de búsqueda. */
  query: string;
  /** ISO de `createdAt` del cursor para "Siguiente". `null` si no hay más páginas. */
  nextCursor: string | null;
  /** ISO de `createdAt` del cursor para "Anterior". `null` si ya estás en la primera página. */
  prevCursor: string | null;
}

export function EventsList({
  events,
  limit,
  limitOptions,
  query,
  nextCursor,
  prevCursor,
}: EventsListProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis eventos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona tus eventos y entra a cada uno para ver estadísticas y registros.
          </p>
        </div>
        <Link
          href="/events/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Crear evento
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <EventsSearchInput query={query} />
        <EventsLimitSelect limit={limit} options={limitOptions} />
      </div>

      {query && (
        <p className="-mt-2 text-xs text-slate-500">
          Mostrando resultados para{" "}
          <span className="font-medium text-slate-700">«{query}»</span>
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <EventsTable events={events} query={query} />
        </div>

        {events.length > 0 && (
          <div className="border-t border-gray-200 px-3 py-2.5">
            <CursorPagination
              basePath="/studio/events"
              query={query}
              nextCursor={nextCursor}
              prevCursor={prevCursor}
              extraParams={{ limit: String(limit) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
