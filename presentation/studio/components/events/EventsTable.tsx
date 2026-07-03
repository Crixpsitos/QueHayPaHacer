import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Eye,
  ImageIcon,
  Plus,
  SearchX,
  Users,
} from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { StudioEventListItem } from "../../view-models/StudioEventsViewModel";
import { REGISTRATION_TYPE_LABEL } from "../../lib/registrationType";

interface EventsTableProps {
  events: StudioEventListItem[];
  /** Término de búsqueda activo, para diferenciar el estado vacío. */
  query?: string;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

const formatNumber = (n: number) => n.toLocaleString("es-CO");

function StatusBadge({ status }: { status: string }) {
  const published = status.toLowerCase() === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
      )}
    >
      {published ? "Publicado" : "Borrador"}
    </span>
  );
}

export function EventsTable({ events, query }: EventsTableProps) {
  if (events.length === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Evento</th>
            <th className="hidden px-4 py-3 sm:table-cell">Fecha</th>
            <th className="hidden px-4 py-3 md:table-cell">Registro</th>
            <th className="px-4 py-3 text-right">Vistas</th>
            <th className="px-4 py-3 text-right">Registros</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr
              key={event.id}
              className={cn(
                "group border-b border-gray-100 transition-colors last:border-0 hover:bg-indigo-50/40",
                i % 2 === 1 && "bg-slate-50/40",
              )}
            >
              <td className="px-4 py-3">
                <Link href={`/studio/events/${event.id}`} className="flex items-center gap-3">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
                    {event.image ? (
                      <Image src={event.image} alt={event.name} fill sizes="44px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900 group-hover:text-indigo-700">
                      {event.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={event.status} />
                    </span>
                  </span>
                </Link>
              </td>
              <td className="hidden px-4 py-3 text-slate-500 sm:table-cell" suppressHydrationWarning>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(event.date)}
                </span>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {REGISTRATION_TYPE_LABEL[event.registrationType]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-slate-700">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  {formatNumber(event.views)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-slate-700">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {formatNumber(event.registrations)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/studio/events/${event.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  aria-label={`Abrir ${event.name}`}
                >
                  Abrir
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
  );
}

function EmptyState({ query }: { query?: string }) {
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <SearchX className="h-6 w-6 text-slate-400" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">
            Sin resultados para «{query}»
          </p>
          <p className="text-sm text-slate-400">
            Revisa la ortografía o prueba con otro término.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
        <CalendarPlus className="h-6 w-6 text-indigo-500" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700">Aún no tienes eventos</p>
        <p className="text-sm text-slate-400">
          Crea tu primer evento para empezar a recibir registros y ver estadísticas.
        </p>
      </div>
      <Link
        href="/events/create"
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Crear evento
      </Link>
    </div>
  );
}
