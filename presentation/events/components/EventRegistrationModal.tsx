"use client";

import { useState, useTransition, lazy, Suspense } from "react";
import { AlertTriangle, CalendarCheck, ExternalLink, Users, X, PartyPopper } from "lucide-react";
import { Button } from "@/app/components/ui/button/button";
import { Separator } from "@/app/components/ui/separator";
import type { EventViewModel } from "../view-models/EventViewModel";

// Lazy — only loaded when registrationType === "form"
const RenderRegistrationForm = lazy(() =>
  import("./form/RenderRegistrationForm").then((m) => ({ default: m.RenderRegistrationForm }))
);

interface EventRegistrationModalProps {
  event: EventViewModel;
  price: string;
  isFree: boolean;
  capacity?: number;
  registrations?: number;
  isOverCapacity: boolean; // true only for internal/form when registrations >= capacity
  onConfirm: (formData?: Record<string, unknown>) => Promise<{ success?: boolean; error?: string; authRequired?: boolean; alreadyRegistered?: boolean } | void>;
  onClose: () => void;
}

export function EventRegistrationModal({
  event,
  price,
  isFree,
  capacity,
  registrations,
  isOverCapacity,
  onConfirm,
  onClose,
}: EventRegistrationModalProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConfirm = (formData?: Record<string, unknown>) => {
    setActionError(null);
    startTransition(async () => {
      const result = await onConfirm(formData);
      if (!result || result.success || result.alreadyRegistered) {
        setDone(true);
      } else if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const { registrationType, title } = event;

  // ── Over-capacity banner (free events only, never for external/none) ───────
  const capacityBanner = isOverCapacity ? (
    <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="size-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-900">Aforo al límite</p>
        <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
          Este evento ha alcanzado su capacidad máxima. Aún puedes registrarte,
          pero es posible que no encuentres un lugar disponible. El acceso queda
          a criterio del organizador en el lugar.
        </p>
      </div>
    </div>
  ) : null;

  // ── Capacity row ─────────────────────────────────────────────────────────
  const capacityRow = capacity != null && capacity > 0 ? (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 flex items-center gap-1.5">
        <Users className="size-3.5" />
        Inscritos
      </span>
      <span className={`font-semibold ${isOverCapacity ? "text-amber-600" : "text-gray-900"}`}>
        {(registrations ?? 0).toLocaleString("es-CO")} / {capacity.toLocaleString("es-CO")}
      </span>
    </div>
  ) : null;

  // ── Modal shell ───────────────────────────────────────────────────────────
  const shell = (children: React.ReactNode, wide = false) => (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 1: none — informational only
  // ──────────────────────────────────────────────────────────────────────────
  if (registrationType === "none") {
    return shell(
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <PartyPopper className="size-7 text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-bold text-gray-900">Entrada libre</p>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Este evento no requiere inscripción previa. Cualquier persona puede
            asistir directamente en el lugar acordado en la fecha indicada.
          </p>
        </div>
        <Button variant="outline" className="mt-2 w-full max-w-xs" onClick={onClose}>
          Entendido
        </Button>
      </div>
    );
  }

  // external is handled directly in EventDetailClient (window.open) — never reaches here

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 2: internal — simple confirmation dialog
  // ──────────────────────────────────────────────────────────────────────────
  if (registrationType === "internal") {
    return shell(
      <>
        {capacityBanner}
        <div className="px-6 pt-6 pb-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <CalendarCheck className="size-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Confirmar inscripción</p>
              <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{title}</p>
            </div>
          </div>
          <Separator />
          {!done && (
            <p className="text-sm text-gray-600">
              ¿Estás seguro que deseas inscribirte en este evento?
            </p>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Precio</span>
              <span className="font-semibold text-gray-900">{price}</span>
            </div>
            {capacityRow}
          </div>
          {done && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 font-medium text-center leading-relaxed">
              🎉 ¡Registro exitoso! Estate pendiente a tus medios de contacto
              en caso de que el organizador se comunique contigo.
            </div>
          )}
        </div>
        {!done ? (
          <div className="px-6 pb-6 pt-4 flex flex-col gap-2">
            {actionError && (
              <p className="text-sm text-red-600 text-center">{actionError}</p>
            )}
            <Button className="w-full" disabled={isPending} onClick={() => handleConfirm()}>
              {isPending ? "Procesando..." : "Registrarse"}
            </Button>
            <Button variant="ghost" className="w-full text-gray-500" disabled={isPending} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-2">
            <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
          </div>
        )}
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 3: form — dynamic registration form
  // ──────────────────────────────────────────────────────────────────────────
  const formSchema = event.registrationEventForm ?? { fields: [] };

  return shell(
    <>
      {capacityBanner}
      <div className="px-6 pt-6 pb-2 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <CalendarCheck className="size-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Formulario de inscripción</p>
            <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{title}</p>
          </div>
        </div>
        {(capacityRow || !isFree) && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              {!isFree && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Precio</span>
                  <span className="font-semibold text-gray-900">{price}</span>
                </div>
              )}
              {capacityRow}
            </div>
          </>
        )}
      </div>
      <div className="overflow-y-auto px-6 pb-6 pt-2 flex-1">
        {done ? (
          <>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800 font-medium text-center mb-4 leading-relaxed">
              🎉 ¡Formulario enviado con éxito! Estate pendiente a tus medios
              de contacto en caso de que el organizador se comunique contigo.
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
          </>
        ) : (
          <Suspense fallback={<div className="py-8 text-center text-sm text-gray-400">Cargando formulario...</div>}>
            <RenderRegistrationForm
              schema={formSchema as { fields: import("@/presentation/events/lib/schemas/dynamicSchema").FormField[] }}
              isPreview={false}
              onSubmit={(data) => handleConfirm(data as Record<string, unknown>)}
            />
          </Suspense>
        )}
      </div>
    </>,
    true,
  );
}
