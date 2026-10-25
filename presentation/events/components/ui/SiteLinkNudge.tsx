"use client";

import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { getUserSitesForPickerAction } from "@/app/actions/sites/get-user-sites-for-picker.action";

/**
 * Empujón en la revisión del evento: si la persona tiene sitios propios elegibles y no vinculó este evento a
 * ninguno, le recuerda que hacerlo ayuda a promocionar su sitio. Sin sitios elegibles no muestra nada.
 * `getUserSitesForPickerAction` ya devuelve solo sus sitios publicados como dueño y aprobados (y va cacheada).
 */
export function SiteLinkNudge({ linked, onGoToLocation }: { linked: boolean; onGoToLocation: () => void }) {
  const [hasSites, setHasSites] = useState(false);

  useEffect(() => {
    if (linked) return;
    let cancelled = false;
    getUserSitesForPickerAction()
      .then((sites) => !cancelled && setHasSites(sites.length > 0))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [linked]);

  if (linked || !hasSites) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
      <p className="flex max-w-md items-start gap-2 text-sm text-[#52525B]">
        <Store className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          <span className="font-semibold text-[#09090B]">¿Sabías que los eventos vinculados a tu sitio te ayudan a promocionarlo?</span>{" "}
          Vincúlalo en el paso de ubicación.
        </span>
      </p>
      <button
        type="button"
        onClick={onGoToLocation}
        className="inline-flex min-h-10 items-center rounded-full border border-primary/40 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        Ir a ubicación
      </button>
    </div>
  );
}
