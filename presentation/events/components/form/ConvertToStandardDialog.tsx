"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, CalendarDays, AlertTriangle } from "lucide-react";
import { getEventSessionsAction } from "@/app/actions/events/get-event-sessions.action";
import type { EventSession } from "@/domain/entities/events/EventSession";
import { cn } from "@/app/lib/utils/cn";

interface ConvertToStandardDialogProps {
  eventId: string;
  /** null = sin sesión (0 sesiones) — el nuevo evento estándar no tendrá fecha pre-cargada. */
  onConfirm: (selectedSessionId: string | null) => void;
  onCancel: () => void;
}

/** Diálogo para seleccionar qué sesión conservar al convertir multi-fecha → estándar. */
export function ConvertToStandardDialog({
  eventId,
  onConfirm,
  onCancel,
}: ConvertToStandardDialogProps) {
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getEventSessionsAction(eventId).then((result) => {
      setLoading(false);
      if (result.success) {
        setSessions(result.sessions);
        if (result.sessions.length > 0) {
          setSelected(result.sessions[0].id);
        }
      } else {
        setError(result.error);
      }
    });
  }, [eventId]);

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), "d MMM yyyy · HH:mm", { locale: es });
    } catch {
      return String(date);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-card overflow-hidden">
        {/* Header — mensaje contextual según número de sesiones */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF8E7]">
            <AlertTriangle className="size-5 text-[#E09F00]" />
          </span>
          <div>
            <p className="text-base font-bold text-[#09090B]">
              Convertir a evento de una sola fecha
            </p>
            <p className="mt-1.5 text-sm text-[#71717A] leading-relaxed">
              {!loading && sessions.length === 0
                ? "Este evento todavía no tiene sesiones. Al convertirlo, deberás completar manualmente la fecha y lugar del evento estándar."
                : sessions.length === 1
                  ? "Se usará la fecha de tu única sesión como fecha principal del evento estándar."
                  : "Este evento tiene varias fechas. Solo podrás conservar una como principal. Elige cuál mantener:"}
            </p>
          </div>
        </div>

        {/* Sesiones */}
        <div className="px-6 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-[#71717A]">
              <Loader2 className="size-4 animate-spin" />
              Cargando fechas…
            </div>
          ) : error ? (
            <p className="text-sm text-[#E63946] py-2">{error}</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-[#71717A] py-1">
              Los campos de fecha, lugar y configuración de registro quedarán pendientes de completar después de la conversión.
            </p>
          ) : sessions.length === 1 ? (
            // Una sola sesión: se mostrará auto-seleccionada, sin necesidad de elegir.
            <div className="flex items-center gap-3 rounded-xl border border-[#E63946] bg-[#FDF2F4] px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E63946] text-white">
                <CalendarDays className="size-4" />
              </span>
              <div className="min-w-0">
                {sessions[0].title && (
                  <p className="text-sm font-semibold text-[#09090B] truncate">{sessions[0].title}</p>
                )}
                <p className="text-xs text-[#71717A]">{formatDate(sessions[0].startDate)}</p>
                {sessions[0].location?.venue && (
                  <p className="text-xs text-[#A1A1AA] truncate">{sessions[0].location.venue}</p>
                )}
              </div>
            </div>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(session.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      selected === session.id
                        ? "border-[#E63946] bg-[#FDF2F4]"
                        : "border-[#E4E4E7] bg-white hover:bg-[#FAFAFC]",
                    )}
                  >
                    <span className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      selected === session.id ? "bg-[#E63946] text-white" : "bg-[#F4F4F5] text-[#71717A]",
                    )}>
                      <CalendarDays className="size-4" />
                    </span>
                    <div className="min-w-0">
                      {session.title && (
                        <p className="text-sm font-semibold text-[#09090B] truncate">
                          {session.title}
                        </p>
                      )}
                      <p className="text-xs text-[#71717A]">
                        {formatDate(session.startDate)}
                      </p>
                      {session.location?.venue && (
                        <p className="text-xs text-[#A1A1AA] truncate">{session.location.venue}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {sessions.length > 1 && (
            <p className="mt-3 text-xs text-[#71717A]">
              Las demás fechas dejarán de formar parte del evento al guardar.
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <button
            type="button"
            disabled={loading || (sessions.length > 1 && !selected)}
            onClick={() => {
              if (sessions.length === 0) {
                onConfirm(null);
              } else if (sessions.length === 1) {
                onConfirm(sessions[0].id);
              } else if (selected) {
                onConfirm(selected);
              }
            }}
            className="w-full rounded-xl bg-[#E63946] hover:bg-[#9B0A26] px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-primary-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convertir a evento estándar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm font-medium text-[#09090B] hover:bg-[#FAFAFC] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
