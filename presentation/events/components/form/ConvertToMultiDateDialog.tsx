"use client";

import { CalendarDays } from "lucide-react";

interface ConvertToMultiDateDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmación para convertir un evento estándar a multi-fecha. */
export function ConvertToMultiDateDialog({
  onConfirm,
  onCancel,
}: ConvertToMultiDateDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FDF2F4]">
            <CalendarDays className="size-5 text-[#E63946]" />
          </span>
          <div>
            <p className="text-base font-bold text-[#09090B]">
              Convertir a evento de varias fechas
            </p>
            <p className="mt-1.5 text-sm text-[#71717A] leading-relaxed">
              Este evento pasará a utilizar sesiones independientes. Conservaremos
              automáticamente la información compatible, pero algunos datos como
              fecha y lugar deberán configurarse en cada sesión.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-[#E63946] hover:bg-[#9B0A26] px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-primary-glow"
          >
            Convertir a varias fechas
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
