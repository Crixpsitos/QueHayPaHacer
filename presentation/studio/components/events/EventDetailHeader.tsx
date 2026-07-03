import Link from "next/link";
import { ArrowLeft, CalendarDays, Eye, Pencil } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { RegistrationType } from "@/domain/entities/studio/Studio";
import { REGISTRATION_TYPE_LABEL } from "../../lib/registrationType";

interface EventDetailHeaderProps {
  eventId: string;
  name: string;
  status: string;
  date: string; // ISO
  registrationType: RegistrationType;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(iso));

export function EventDetailHeader({
  eventId,
  name,
  status,
  date,
  registrationType,
}: EventDetailHeaderProps) {
  const published = status.toLowerCase() === "published";

  return (
    <div>
      <Link
        href="/studio/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis eventos
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
              )}
            >
              {published ? "Publicado" : "Borrador"}
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Registro: {REGISTRATION_TYPE_LABEL[registrationType]}
            </span>
          </div>

          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {formatDate(date)}
          </p>
        </div>

        {/* Acciones del evento */}
        <div className="flex shrink-0 items-center gap-2">
          {published && (
            <Link
              href={`/events/${eventId}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              Ver evento
            </Link>
          )}
          <Link
            href={`/events/${eventId}/edit`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Pencil className="h-4 w-4" />
            Editar evento
          </Link>
        </div>
      </div>
    </div>
  );
}
