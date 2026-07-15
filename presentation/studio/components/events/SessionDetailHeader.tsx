import Link from "next/link";
import { ArrowLeft, CalendarDays, Pencil } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { RegistrationType } from "@/domain/entities/studio/Studio";
import { REGISTRATION_TYPE_LABEL } from "../../lib/registrationType";

interface SessionDetailHeaderProps {
  /** Evento padre: el "volver" lleva a sus fechas, no a "Mis eventos". */
  eventId: string;
  name: string;
  status: string;
  date: string; // ISO
  registrationType: RegistrationType;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));

/**
 * Encabezado del detalle de una SESIÓN. Igual al de un evento, salvo que el
 * "volver" apunta al evento padre y la etiqueta aclara que es una fecha.
 */
export function SessionDetailHeader({
  eventId,
  name,
  status,
  date,
  registrationType,
}: SessionDetailHeaderProps) {
  const published = status.toLowerCase() === "published";

  return (
    <div>
      <Link
        href={`/studio/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Fechas del evento
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {name}
            </h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                published
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {published ? "Publicada" : "Borrador"}
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Registro: {REGISTRATION_TYPE_LABEL[registrationType]}
            </span>
          </div>

          <p
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-500"
            suppressHydrationWarning
          >
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {formatDate(date)}
          </p>
        </div>

        <Link
          href={`/events/${eventId}/edit?step=sessions`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" />
          Editar fecha
        </Link>
      </div>
    </div>
  );
}
