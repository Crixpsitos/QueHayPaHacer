"use client";

import type { EventSession } from "@/domain/entities/events/EventSession";
import type { EventViewModel } from "../../view-models/EventViewModel";
import { SessionCard } from "./SessionCard";
import { PlusIcon } from "lucide-react";
import { m } from "framer-motion";
import { Button } from "@/app/components/ui/button";

interface SessionManagerProps {
  event: Pick<EventViewModel, "id" | "title"> & { mainImage?: { url: string } };
  sessions: EventSession[];
  isPending?: boolean;
  onAddSession: () => void;
  onEditSession: (session: EventSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onToggleStatus: (session: EventSession) => void;
}

function detectOverlaps(sessions: EventSession[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i];
      const b = sessions[j];
      const aStart = new Date(a.startDate).getTime();
      const aEnd = new Date(a.endDate).getTime();
      const bStart = new Date(b.startDate).getTime();
      const bEnd = new Date(b.endDate).getTime();
      if (aStart < bEnd && aEnd > bStart) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  return overlapping;
}

export function SessionManager({
  event,
  sessions,
  isPending = false,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onToggleStatus,
}: SessionManagerProps) {
  const overlappingIds = detectOverlaps(sessions);
  const parentCoverUrl = event.mainImage?.url;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{event.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las sesiones de tu evento multi-fecha. Cada sesión tiene su
            propia fecha, lugar y configuración.
          </p>
        </div>
        <Button
          type="button"
          onClick={onAddSession}
          disabled={isPending}
          className="shrink-0 bg-black text-white hover:bg-gray-800"
        >
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Agregar sesión
        </Button>
      </div>

      {/* Overlap warning banner */}
      {overlappingIds.size > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
          <span className="mt-0.5 text-base">⚠️</span>
          <div>
            <p className="font-medium">Hay sesiones con horarios que se solapan</p>
            <p className="mt-0.5 text-xs text-amber-600">
              Puedes guardar el borrador, pero deberás resolver el solapamiento antes de publicar.
            </p>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm font-medium text-gray-600">No hay sesiones aún</p>
          <p className="mt-1 text-xs text-gray-400">
            Agrega la primera sesión para empezar a construir tu evento multi-fecha.
          </p>
          <Button
            type="button"
            onClick={onAddSession}
            className="mt-4 bg-black text-white hover:bg-gray-800"
          >
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Agregar sesión
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session, i) => (
            <m.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut", delay: i * 0.04 }}
            >
              <SessionCard
                session={session}
                sessionIndex={i}
                parentCoverUrl={parentCoverUrl}
                allSessions={sessions}
                hasOverlap={overlappingIds.has(session.id)}
                onEdit={onEditSession}
                onDelete={onDeleteSession}
                onToggleStatus={onToggleStatus}
              />
            </m.div>
          ))}
        </div>
      )}
    </div>
  );
}
