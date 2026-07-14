"use client";

import type { EventSession } from "@/domain/entities/events/EventSession";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";
import Image from "next/image";

interface SessionCardProps {
  session: EventSession;
  parentCoverUrl?: string;
  allSessions: EventSession[];
  hasOverlap: boolean;
  onEdit: (session: EventSession) => void;
  onDelete: (sessionId: string) => void;
  onToggleStatus: (session: EventSession) => void;
}

function resolveCoverUrl(
  session: EventSession,
  parentCoverUrl?: string,
  allSessions?: EventSession[],
): string | undefined {
  if (session.coverSource === "parent") return parentCoverUrl;
  if (session.coverSource === "own") return session.mainImage?.url;
  if (typeof session.coverSource === "object" && "sessionId" in session.coverSource) {
    const { sessionId } = session.coverSource;
    const ref = allSessions?.find((s) => s.id === sessionId);
    return ref?.mainImage?.url;
  }
  return undefined;
}

export function SessionCard({
  session,
  parentCoverUrl,
  allSessions,
  hasOverlap,
  onEdit,
  onDelete,
  onToggleStatus,
}: SessionCardProps) {
  const coverUrl = resolveCoverUrl(session, parentCoverUrl, allSessions);

  const startFormatted = session.startDate
    ? format(new Date(session.startDate), "d MMM yyyy, HH:mm", { locale: es })
    : "Sin fecha";
  const endFormatted = session.endDate
    ? format(new Date(session.endDate), "HH:mm", { locale: es })
    : "";

  const cityName = session.location?.city?.name ?? "";
  const venueName = session.location?.venue ?? "";

  const statusColors: Record<EventSession["status"], string> = {
    draft: "bg-gray-100 text-gray-600",
    published: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    ended: "bg-amber-100 text-amber-700",
  };

  const statusLabels: Record<EventSession["status"], string> = {
    draft: "Borrador",
    published: "Publicada",
    cancelled: "Cancelada",
    ended: "Finalizada",
  };

  return (
    <div
      className={`flex gap-4 rounded-xl border p-4 transition-shadow hover:shadow-sm ${
        hasOverlap ? "border-amber-400 bg-amber-50/40" : "border-gray-200 bg-white"
      }`}
    >
      {/* Cover thumbnail */}
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {coverUrl ? (
          <Image src={coverUrl} alt={session.title ?? "Sesión"} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-gray-900">
            {session.title ?? "Sesión sin título"}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[session.status]}`}
          >
            {statusLabels[session.status]}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          <span>
            {startFormatted}
            {endFormatted && ` — ${endFormatted}`}
          </span>
        </div>

        {(cityName || venueName) && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{[venueName, cityName].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {hasOverlap && (
          <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangleIcon className="h-3.5 w-3.5" />
            Solapamiento de horario con otra sesión
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-2">
        {session.status === "draft" && (
          <button
            type="button"
            onClick={() => onToggleStatus(session)}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
          >
            <SendIcon className="h-3.5 w-3.5" />
            Publicar
          </button>
        )}
        {session.status === "published" && (
          <button
            type="button"
            onClick={() => onToggleStatus(session)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
          >
            <Undo2Icon className="h-3.5 w-3.5" />
            A borrador
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-black hover:text-black"
        >
          <PencilIcon className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
