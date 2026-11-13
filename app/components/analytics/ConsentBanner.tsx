"use client";

import Link from "@/app/components/ui/navigation/IntentLink"
import { usePathname } from "next/navigation";
import { useConsent } from "@/app/lib/analytics/useConsent";
import { isTrackablePath } from "@/app/lib/analytics/events";

// Aceptar y Rechazar pesan lo mismo a propósito (mismo tamaño, mismo estilo): rechazar no debe costar más que aceptar.
const BUTTON =
  "h-11 flex-1 rounded-full border border-[#09090B] bg-white px-5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#F4F4F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946]";

/** Aviso de cookies de medición. No bloquea la página ni roba el foco; no aparece en rutas privadas (ahí no se mide). */
export function ConsentBanner() {
  const { state, accept, reject } = useConsent();
  const pathname = usePathname();
  if (state !== "pending" || !isTrackablePath(pathname)) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-desc"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 rounded-2xl border border-[#E4E4E7] bg-white p-4 text-[#09090B] shadow-xl sm:inset-x-auto sm:left-4 sm:max-w-sm"
    >
      <h2 id="consent-title" className="font-heading text-base font-semibold leading-tight">
        ¿Nos ayudas a mejorar?
      </h2>
      <p id="consent-desc" className="mt-1 text-sm leading-snug text-[#52525B]">
        Medimos las visitas con Google Analytics. Si aceptas, usa cookies para saber de dónde llegas; si rechazas, solo
        contamos visitas, sin cookies.{" "}
        <Link href="/privacidad" className="font-medium text-[#09090B] underline underline-offset-2">
          Política de privacidad
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={reject} className={BUTTON}>
          Rechazar
        </button>
        <button type="button" onClick={accept} className={BUTTON}>
          Aceptar
        </button>
      </div>
    </section>
  );
}
