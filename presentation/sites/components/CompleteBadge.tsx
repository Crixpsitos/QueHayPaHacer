import { ClipboardCheck } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { getSiteCompleteness } from "@/domain/entities/sites/siteCompleteness";
import { completenessFromDetail } from "../lib/completeness";
import type { SiteDetail } from "../view-models/SiteFormViewModel";

/** "Ficha completa": solo se muestra al 100 % del medidor. Mismo estilo que TrustBadge. */
export function CompleteBadge({ site, className }: { site: SiteDetail; className?: string }) {
  if (!getSiteCompleteness(completenessFromDetail(site)).complete) return null;
  return (
    <span
      title="El autor completó todos los datos de la ficha"
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-300",
        className,
      )}
    >
      <ClipboardCheck className="size-3 shrink-0" aria-hidden />
      Ficha completa
    </span>
  );
}
