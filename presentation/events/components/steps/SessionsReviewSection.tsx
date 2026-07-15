"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/app/components/ui/button";
import {
  CalendarIcon,
  MapPinIcon,
  Pencil,
  TicketIcon,
  DollarSign,
} from "lucide-react";
import type { EventSession } from "@/domain/entities/events/EventSession";

const STATUS_LABELS: Record<EventSession["status"], string> = {
  draft: "Borrador",
  published: "Publicada",
  cancelled: "Cancelada",
  ended: "Finalizada",
};

const STATUS_COLORS: Record<EventSession["status"], string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  ended: "bg-amber-100 text-amber-700",
};

const REGISTRATION_LABELS: Record<string, string> = {
  none: "Sin registro",
  internal: "Interno",
  external: "Externo",
  form: "Formulario",
};

function formatPrice(price: EventSession["price"]): string {
  if (!price || price.isFree) return "Gratis";
  return `${price.amount?.toLocaleString("es-CO")} ${price.currency ?? "COP"}`;
}

function SessionPreviewCard({ session }: { session: EventSession }) {
  const start = session.startDate
    ? format(new Date(session.startDate), "d MMM yyyy, HH:mm", { locale: es })
    : "Sin fecha";
  const end = session.endDate
    ? format(new Date(session.endDate), "HH:mm", { locale: es })
    : "";
  const place = [session.location?.venue, session.location?.city?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900">
          {session.title || "Sesión sin título"}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[session.status]}`}
        >
          {STATUS_LABELS[session.status]}
        </span>
      </div>

      <div className="grid gap-1.5 text-sm text-gray-600 sm:grid-cols-2">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>
            {start}
            {end && ` — ${end}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{place || "Sin lugar"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TicketIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>
            {REGISTRATION_LABELS[session.registrationType] ?? "Sin registro"}
            {session.capacity ? ` · ${session.capacity} cupos` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>{formatPrice(session.price)}</span>
        </div>
      </div>
    </div>
  );
}

interface SessionsReviewSectionProps {
  eventId?: string;
  onEdit: () => void;
}

export function SessionsReviewSection({
  eventId,
  onEdit,
}: SessionsReviewSectionProps) {
  const [sessions, setSessions] = useState<EventSession[]>([]);
  // Init en true si hay eventId → evita setState síncrono dentro del effect.
  const [isLoading, setIsLoading] = useState(Boolean(eventId));

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    fetch(`/api/events/${eventId}/sessions`)
      .then((res) => (res.ok ? (res.json() as Promise<EventSession[]>) : []))
      .then((result) => {
        if (!active) return;
        setSessions(
          [...result].sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          ),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium text-gray-900">
          Sesiones {sessions.length > 0 && `(${sessions.length})`}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 text-gray-600 hover:text-black"
        >
          <Pencil className="mr-1 h-3 w-3" />
          Editar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando sesiones...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-400">
          Aún no agregaste sesiones. Vuelve al paso de Sesiones para crearlas.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionPreviewCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
