"use client";

import { useEffect, useState, useTransition, lazy, Suspense } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, CalendarCheck, Loader2, Users, X, PartyPopper } from "lucide-react";
import { EASE_OUT, SuccessCheck } from "@/app/components/motion/primitives";
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
  const still = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  // Error de acción: un solo temblor suave, anunciado a lectores de pantalla.
  const errorMsg = actionError && (
    <motion.p
      key={actionError}
      role="alert"
      className="text-center text-sm text-red-600"
      animate={still ? undefined : { x: [0, -6, 6, -4, 4, 0] }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      {actionError}
    </motion.p>
  );

  // Confirmación: reemplaza el contenido del modal (aria-live para anunciarla).
  const successPanel = (heading: string, body: string) => (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center" role="status" aria-live="polite">
      <SuccessCheck size={64} />
      <div className="space-y-1.5">
        <p className="font-heading text-xl font-bold text-gray-900">{heading}</p>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-600">{body}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2 pt-1">
        <Button asChild>
          <Link href="/mis-inscripciones">Ver mis inscripciones</Link>
        </Button>
        <Button variant="ghost" className="text-gray-500" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );

  const confirmLabel = isPending ? (
    <>
      <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      Procesando…
    </>
  ) : (
    "Registrarse"
  );

  // ── Modal shell ───────────────────────────────────────────────────────────
  const shell = (children: React.ReactNode, wide = false) => (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Inscripción al evento"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={onClose}
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={still ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C]"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        {children}
      </motion.div>
    </motion.div>
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
    if (done) {
      return shell(
        successPanel("Quedaste inscrito", "Estate pendiente a tus medios de contacto por si el organizador se comunica contigo."),
      );
    }
    return shell(
      <>
        {capacityBanner}
        <div className="px-6 pt-6 pb-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <CalendarCheck className="size-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Confirmar inscripción</p>
              <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{title}</p>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-gray-600">
            ¿Estás seguro que deseas inscribirte en este evento?
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Precio</span>
              <span className="font-semibold text-gray-900 tabular-nums">{price}</span>
            </div>
            {capacityRow}
          </div>
        </div>
        <div className="px-6 pb-6 pt-4 flex flex-col gap-2">
          {errorMsg}
          <Button className="w-full" disabled={isPending} onClick={() => handleConfirm()}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" className="w-full text-gray-500" disabled={isPending} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 3: form — dynamic registration form
  // ──────────────────────────────────────────────────────────────────────────
  const formSchema = event.registrationEventForm ?? { fields: [] };

  if (done) {
    return shell(
      successPanel("Quedaste inscrito", "Recibimos tu formulario. Estate pendiente a tus medios de contacto por si el organizador se comunica contigo."),
    );
  }

  return shell(
    <>
      {capacityBanner}
      <div className="px-6 pt-6 pb-2 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <CalendarCheck className="size-5 text-gray-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Formulario de inscripción</p>
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
        {errorMsg}
        <Suspense fallback={<div className="py-8 text-center text-sm text-gray-400">Cargando formulario...</div>}>
          <RenderRegistrationForm
            schema={formSchema as { fields: import("@/presentation/events/lib/schemas/dynamicSchema").FormField[] }}
            isPreview={false}
            onSubmit={(data) => handleConfirm(data as Record<string, unknown>)}
          />
        </Suspense>
      </div>
    </>,
    true,
  );
}
