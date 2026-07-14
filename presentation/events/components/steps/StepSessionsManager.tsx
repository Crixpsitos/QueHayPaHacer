"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { FormEventDto } from "@/application/dto/events/EventDto";
import type { EventSession } from "@/domain/entities/events/EventSession";
import { getEventSessionsAction } from "@/app/actions/events/get-event-sessions.action";
import { deleteEventSessionAction } from "@/app/actions/events/delete-event-session.action";
import { setSessionStatusAction } from "@/app/actions/events/set-session-status.action";
import { SessionCard } from "../session/SessionCard";
import { SessionForm } from "../session/SessionForm";
import { Button } from "@/app/components/ui/button";
import { PlusIcon } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";

interface StepSessionsManagerProps {
  form: UseFormReturn<FormEventDto>;
  onSaveDraft: () => Promise<void>;
}

function sortByDate(sessions: EventSession[]) {
  return [...sessions].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export function StepSessionsManager({
  form,
  onSaveDraft,
}: StepSessionsManagerProps) {
  const eventId = useWatch({ control: form.control, name: "id" }) as
    | string
    | undefined;
  const mainImage = useWatch({ control: form.control, name: "mainImage" }) as
    | { url?: string }
    | undefined;

  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadSessions = useCallback(async (id: string) => {
    setIsLoading(true);
    const result = await getEventSessionsAction(id);
    if (result.success) setSessions(sortByDate(result.sessions));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (eventId) loadSessions(eventId);
  }, [eventId, loadSessions]);

  const handleAdd = async () => {
    // Siempre persiste el encabezado (título, clasificación, descripción…) antes de
    // abrir el modal: sin esto, lo editado tras crear el draft (p.ej. categoryInfo) se pierde.
    try {
      await onSaveDraft();
    } catch {
      notify.error("Guarda el borrador primero para poder agregar sesiones.");
      return;
    }
    setEditingSession(null);
    setIsFormOpen(true);
  };

  const handleEdit = (session: EventSession) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setEditingSession(null);
    setIsFormOpen(false);
  };

  const handleSaved = (savedSession: EventSession, _hasOverlap?: boolean) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSession.id);
      const next =
        idx >= 0
          ? prev.map((s, i) => (i === idx ? savedSession : s))
          : [...prev, savedSession];
      return sortByDate(next);
    });
    setIsFormOpen(false);
    setEditingSession(null);
  };

  const handleToggleStatus = (session: EventSession) => {
    if (!eventId) return;
    const next = session.status === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await setSessionStatusAction(eventId, session.id, next);
      if (result.success) {
        setSessions((prev) =>
          sortByDate(
            prev.map((s) => (s.id === result.session.id ? result.session : s)),
          ),
        );
        notify.success(
          next === "published"
            ? result.hasOverlap
              ? "Sesión publicada. ⚠️ Solapamiento con otra sesión."
              : "Sesión publicada."
            : "Sesión movida a borrador.",
        );
      } else {
        notify.error(result.error ?? "No se pudo cambiar el estado.");
      }
    });
  };

  const handleDelete = (sessionId: string) => {
    if (!eventId) return;
    if (!confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer."))
      return;
    startTransition(async () => {
      const result = await deleteEventSessionAction(eventId, sessionId);
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        notify.success("Sesión eliminada.");
      } else {
        notify.error(result.error ?? "Error al eliminar la sesión.");
      }
    });
  };

  // Evento sin ID todavía → pide guardar primero
  if (!eventId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 py-14 text-center">
        <p className="text-sm font-medium text-gray-700">
          Guarda el borrador primero
        </p>
        <p className="text-xs text-gray-400">
          Para agregar sesiones necesitas guardar los datos del encabezado.
        </p>
        <Button
          type="button"
          onClick={onSaveDraft}
          className="bg-black text-white hover:bg-gray-800"
        >
          Guardar borrador
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Encabezado del paso */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-black">Sesiones</h2>
            <p className="text-sm text-gray-500">
              Agrega cada fecha y lugar en que se realizará tu evento.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={isPending || isLoading}
            className="shrink-0 bg-black text-white hover:bg-gray-800"
          >
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Nueva sesión
          </Button>
        </div>

        {/* Lista de sesiones */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-400">
            Cargando sesiones...
          </div>
        ) : sessions.length === 0 ? (
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-14 text-center transition-colors hover:border-gray-400 hover:bg-gray-50"
            onClick={handleAdd}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <PlusIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Agrega tu primera sesión
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Cada sesión tiene su propia fecha, lugar y configuración.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                parentCoverUrl={mainImage?.url}
                allSessions={sessions}
                hasOverlap={false}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal del formulario de sesión */}
      {isFormOpen && eventId && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex flex-col bg-white"
        >
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingSession ? "Editar sesión" : "Nueva sesión"}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <SessionForm
                event={{ id: eventId, title: form.getValues("title") ?? "", mainImage: mainImage as { url: string } | undefined }}
                session={editingSession}
                allSessions={sessions}
                onSaved={handleSaved}
                onCancel={handleClose}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
