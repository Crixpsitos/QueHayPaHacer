import { Info } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { getListingTrust } from "../lib/listingTrust";
import type { SiteDetail } from "../view-models/SiteFormViewModel";

/** Aviso fijo (no colapsable) en el detalle: la ficha puede estar desactualizada. */
export function ConfirmBeforeGoingNotice({
  site,
  className,
}: {
  site: Pick<SiteDetail, "kind" | "verification" | "publishedAs">;
  className?: string;
}) {
  const t = getListingTrust(site);
  if (!t.showConfirmNotice) return null;
  return (
    <div role="note" className={cn("flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3", className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
      <p className="text-sm leading-relaxed text-sky-950">
        <span className="font-semibold">{site.verification === "claimed" ? "Publicada por quien dice ser el dueño, sin revisión de QHPA." : "Información comunitaria."}</span> Confirma acceso, costos, horarios y condiciones con
        el administrador antes de ir.
        {t.kindLabel && " Verifica también las condiciones de acceso y de seguridad del lugar antes de visitarlo."}
      </p>
    </div>
  );
}
