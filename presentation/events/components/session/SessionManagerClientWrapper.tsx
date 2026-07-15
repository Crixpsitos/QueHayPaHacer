"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
} from "framer-motion";
import type { EventSession } from "@/domain/entities/events/EventSession";
import type { EventViewModel } from "../../view-models/EventViewModel";
import { SessionManager } from "./SessionManager";
import { SessionForm } from "./SessionForm";
import { deleteEventSessionAction } from "@/app/actions/events/delete-event-session.action";
import { setSessionStatusAction } from "@/app/actions/events/set-session-status.action";
import { notify } from "@/presentation/shared/lib/notify";

interface SessionManagerClientWrapperProps {
  event: EventViewModel;
  initialSessions: EventSession[];
}

export function SessionManagerClientWrapper({
  event,
  initialSessions,
}: SessionManagerClientWrapperProps) {
  const [sessions, setSessions] = useState<EventSession[]>(
    [...initialSessions].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    ),
  );
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // El estado "sucio" del formulario vive dentro de SessionForm; lo reflejamos
  // aquí vía ref para poder confirmar antes de cerrar sin re-render por tecla.
  const dirtyRef = useRef(false);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const handleAdd = useCallback(() => {
    dirtyRef.current = false;
    setEditingSession(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((session: EventSession) => {
    dirtyRef.current = false;
    setEditingSession(session);
    setIsFormOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (
      dirtyRef.current &&
      !window.confirm("¿Seguro que quieres salir? Tienes cambios sin guardar.")
    ) {
      return;
    }
    dirtyRef.current = false;
    setEditingSession(null);
    setIsFormOpen(false);
  }, []);

  const handleDelete = useCallback(
    (sessionId: string) => {
      if (!confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;
      startTransition(async () => {
        const result = await deleteEventSessionAction(event.id, sessionId);
        if (result.success) {
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          notify.success("Sesión eliminada.");
        } else {
          notify.error(result.error ?? "Error al eliminar la sesión.");
        }
      });
    },
    [event.id],
  );

  const handleToggleStatus = useCallback(
    (session: EventSession) => {
      const next = session.status === "published" ? "draft" : "published";
      startTransition(async () => {
        const result = await setSessionStatusAction(event.id, session.id, next);
        if (result.success) {
          setSessions((prev) =>
            prev.map((s) => (s.id === result.session.id ? result.session : s)),
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
    },
    [event.id],
  );

  const handleSaved = useCallback((savedSession: EventSession) => {
    dirtyRef.current = false;
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSession.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedSession;
        return next;
      }
      return [...prev, savedSession];
    });
    setIsFormOpen(false);
    setEditingSession(null);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <SessionManager
        event={event}
        sessions={sessions}
        isPending={isPending}
        onAddSession={handleAdd}
        onEditSession={handleEdit}
        onDeleteSession={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modal del formulario de sesión (pantalla completa, app-shell) */}
      <AnimatePresence>
        {isFormOpen && (
          <m.div
            key="session-modal"
            role="dialog"
            aria-modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
          >
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mx-auto flex h-full w-full max-w-5xl flex-col"
            >
              {/* Header */}
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

              {/* Cuerpo (fill + scroll interno lo maneja SessionForm) */}
              <div className="min-h-0 flex-1">
                <SessionForm
                  event={event}
                  session={editingSession}
                  allSessions={sessions}
                  onSaved={handleSaved}
                  onCancel={handleClose}
                  onDirtyChange={handleDirtyChange}
                />
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
