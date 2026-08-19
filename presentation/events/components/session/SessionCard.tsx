"use client";

import type { EventSession } from "@/domain/entities/events/EventSession";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  MapPinIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";
import Image from "next/image";
import { isSessionComplete } from "@/presentation/events/lib/isSessionComplete";

interface SessionCardProps {
  session: EventSession;
  sessionIndex: number;
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
  sessionIndex,
  parentCoverUrl,
  allSessions,
  hasOverlap,
  onEdit,
  onDelete,
  onToggleStatus,
}: SessionCardProps) {
  const coverUrl = resolveCoverUrl(session, parentCoverUrl, allSessions);

  const startFormatted = session.startDate
    ? format(new Date(session.startDate), "d MMM yyyy · HH:mm", { locale: es })
    : null;
  const endFormatted = session.endDate
    ? format(new Date(session.endDate), "HH:mm", { locale: es })
    : "";

  const cityName = session.location?.city?.name ?? "";
  const venueName = session.location?.venue ?? "";

  const isComplete = isSessionComplete(session);
  const hasTitle = !!(session.title?.trim());

  const statusConfig: Record<EventSession["status"], { label: string; cls: string }> = {
    draft:     { label: "Borrador",   cls: "bg-[#F4F4F5] text-[#71717A]" },
    published: { label: "Publicada",  cls: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "Cancelada",  cls: "bg-red-50 text-[#E63946]" },
    ended:     { label: "Finalizada", cls: "bg-[#FFF8E7] text-[#E09F00]" },
  };
  const { label: statusLabel, cls: statusCls } = statusConfig[session.status];

  return (
    <div
      className={`group flex gap-4 rounded-2xl border bg-white p-4 transition-shadow hover:shadow-card ${
        hasOverlap
          ? "border-amber-200 bg-amber-50/30"
          : "border-[#F4F4F5]"
      }`}
    >
      {/* Thumbnail + número */}
      <div className="relative h-20 w-24 shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#F4F4F5]">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={session.title ?? "Sesión"}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <CalendarIcon className="size-5 text-[#A1A1AA]" />
            </div>
          )}
        </div>
        {/* Badge de número */}
        <span className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-[#09090B] text-[10px] font-bold text-white ring-2 ring-white">
          {sessionIndex + 1}
        </span>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`truncate text-sm font-semibold ${hasTitle ? "text-[#09090B]" : "text-[#A1A1AA] italic"}`}>
            {hasTitle ? session.title : "Sin título"}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {isComplete ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <CheckIcon className="size-2.5" /> Completa
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-[#FFF8E7] px-2 py-0.5 text-[10px] font-semibold text-[#E09F00]">
                Pendiente
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCls}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {startFormatted ? (
          <div className="flex items-center gap-1 text-xs text-[#71717A]">
            <CalendarIcon className="size-3.5 shrink-0 text-[#E63946]" />
            <span>{startFormatted}{endFormatted && ` — ${endFormatted}`}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
            <CalendarIcon className="size-3.5 shrink-0" />
            <span>Sin fecha</span>
          </div>
        )}

        {(venueName || cityName) ? (
          <div className="flex items-center gap-1 text-xs text-[#71717A]">
            <MapPinIcon className="size-3.5 shrink-0 text-[#E63946]" />
            <span className="truncate">{[venueName, cityName].filter(Boolean).join(", ")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span>Sin ubicación</span>
          </div>
        )}

        {hasOverlap && (
          <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangleIcon className="size-3.5" />
            Solapamiento con otra sesión
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col justify-center gap-2">
        {session.status === "draft" && (
          <button
            type="button"
            onClick={() => onToggleStatus(session)}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <SendIcon className="size-3" />
            Publicar
          </button>
        )}
        {session.status === "published" && (
          <button
            type="button"
            onClick={() => onToggleStatus(session)}
            className="flex items-center gap-1 rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-[11px] font-medium text-[#71717A] transition-colors hover:border-[#09090B] hover:text-[#09090B]"
          >
            <Undo2Icon className="size-3" />
            Borrador
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="flex items-center gap-1 rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-[11px] font-semibold text-[#09090B] transition-colors hover:bg-[#FAFAFC]"
        >
          <PencilIcon className="size-3" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="flex items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-[11px] font-medium text-[#A1A1AA] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-[#E63946]"
        >
          <Trash2Icon className="size-3" />
          Eliminar
        </button>
      </div>
    </div>
  );
}
