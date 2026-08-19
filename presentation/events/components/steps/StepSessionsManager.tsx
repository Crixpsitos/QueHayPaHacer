"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { FormEventDto } from "@/application/dto/events/EventDto";
import type { EventSession } from "@/domain/entities/events/EventSession";
import { deleteEventSessionAction } from "@/app/actions/events/delete-event-session.action";
import { setSessionStatusAction } from "@/app/actions/events/set-session-status.action";
import { SessionCard } from "../session/SessionCard";
import { SessionForm } from "../session/SessionForm";
import { Button } from "@/app/components/ui/button";
import { CalendarDaysIcon, PlusIcon, XIcon } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";

interface StepSessionsManagerProps {
  form: UseFormReturn<FormEventDto>;
  onSaveDraft: () => Promise<void>;
  /** Notifica al padre el número de sesiones actuales (para el checklist de publicación). */
  onSessionsChange?: (count: number) => void;
}

function sortByDate(sessions: EventSession[]) {
  return [...sessions].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export function StepSessionsManager({
  form,
  onSaveDraft,
  onSessionsChange,
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
    try {
      const res = await fetch(`/api/events/${id}/sessions`);
      if (res.ok) setSessions(sortByDate((await res.json()) as EventSession[]));
    } catch {
      // Sin sesiones cargadas: la lista queda vacía y el usuario puede reintentar.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eventId) loadSessions(eventId);
  }, [eventId, loadSessions]);

  // Notificar al padre cuando cambia el número de sesiones.
  useEffect(() => {
    onSessionsChange?.(sessions.length);
  }, [sessions.length, onSessionsChange]);

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
      <div className="space-y-5">
        {/* Barra de acción: contador + botón "Nueva sesión" */}
        <div className="flex items-center gap-3">
          {sessions.length > 0 && (
            <>
              <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-xs font-semibold text-[#71717A]">
                {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"}
              </span>
              {sessions.length >= 2 && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  ✓ Listo para publicar
                </span>
              )}
            </>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={isPending || isLoading}
            size="sm"
            className="shrink-0 gap-1.5 bg-[#E63946] text-white hover:bg-[#9B0A26] shadow-primary-glow"
          >
            <PlusIcon className="size-4" />
            Nueva sesión
          </Button>
        </div>

        {/* Lista de sesiones / empty state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-[#71717A]">
            <span className="animate-pulse">Cargando sesiones…</span>
          </div>
        ) : sessions.length === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            className="group flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E4E4E7] bg-[#FAFAFC] px-6 py-14 text-center transition-all hover:border-[#E63946]/40 hover:bg-[#FDF2F4]/40"
          >
            <span className="flex size-12 items-center justify-center rounded-xl border border-[#F4F4F5] bg-white shadow-sm group-hover:border-[#E63946]/20 transition-colors">
              <CalendarDaysIcon className="size-5 text-[#A1A1AA] group-hover:text-[#E63946] transition-colors" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#09090B]">
                Crea tu primera sesión
              </p>
              <p className="text-xs text-[#71717A]">
                Necesitas al menos 2 sesiones activas para publicar el evento.
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#09090B] shadow-sm group-hover:border-[#E63946]/30 transition-colors">
              <PlusIcon className="size-3.5" />
              Crear primera sesión
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                sessionIndex={index}
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

        {/* Aviso mínimo de sesiones cuando hay exactamente 1 */}
        {sessions.length === 1 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-[#FFF8E7] px-4 py-3">
            <span className="text-sm text-[#E09F00]">⚠</span>
            <p className="text-xs text-amber-800">
              Agrega una sesión más. Un evento multi-fecha requiere mínimo 2 sesiones para publicarse.
            </p>
          </div>
        )}
      </div>

      {/* Modal wizard de sesión */}
      {isFormOpen && eventId && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex flex-col bg-white"
        >
          <div className="mx-auto flex h-full w-full max-w-screen-2xl flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-[#F4F4F5] px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-[#09090B]">
                  {editingSession ? "Editar sesión" : "Nueva sesión"}
                </h2>
                <p className="text-xs text-[#71717A]">
                  {editingSession
                    ? "Actualiza la configuración de esta sesión."
                    : "Configura los detalles de esta fecha."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex size-8 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#71717A] transition-colors hover:bg-[#FAFAFC] hover:text-[#09090B]"
                aria-label="Cerrar"
              >
                <XIcon className="size-4" />
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
