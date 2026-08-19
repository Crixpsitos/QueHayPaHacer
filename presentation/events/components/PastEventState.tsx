import Link from "next/link";
import { CalendarX2 } from "lucide-react";

interface PastEventStateProps {
  /** "event" para evento estándar o multi-date completamente vencido;
   *  "session" para sesión individual vencida. */
  variant?: "event" | "session";
  /** Href al evento padre — solo relevante para `variant="session"`.
   *  Activa el CTA "Ver próximas sesiones" en lugar de "Explorar eventos". */
  parentEventHref?: string;
}

/**
 * Estado visual para eventos o sesiones ya finalizados.
 * Reemplaza la sección de registro — nunca convive con el CTA de inscripción.
 */
export function PastEventState({
  variant = "event",
  parentEventHref,
}: PastEventStateProps) {
  const isSession = variant === "session";

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-[#E4E4E7] bg-[#FAFAFC] px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F4F5]">
        <CalendarX2 className="h-10 w-10 text-[#A1A1AA]" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <p className="text-lg font-bold text-[#09090B]">
          {isSession ? "Esta sesión ya pasó" : "Este evento ya pasó"}
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-[#71717A]">
          {isSession
            ? "Esta sesión finalizó y ya no es posible registrarse en ella."
            : "Este evento finalizó y ya no es posible registrarse."}
          {!isSession && (
            <> ¡Pero hay muchos eventos más por descubrir!</>
          )}
        </p>
      </div>

      {isSession && parentEventHref ? (
        <Link
          href={parentEventHref}
          className="inline-flex items-center gap-2 rounded-xl bg-[#09090B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18181b]"
        >
          Ver próximas sesiones
        </Link>
      ) : (
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 rounded-xl bg-[#09090B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18181b]"
        >
          Explorar eventos
        </Link>
      )}
    </div>
  );
}
