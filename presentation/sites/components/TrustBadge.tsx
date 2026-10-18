import { BadgeCheck, UserCheck, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { getListingTrust, type TrustTone } from "../lib/listingTrust";
import type { SiteDetail } from "../view-models/SiteFormViewModel";

const ICON: Record<string, LucideIcon> = { Comunitario: Users, Reclamado: UserCheck, Verificado: BadgeCheck };

// Fondos claros + texto oscuro del mismo tono: contraste AA.
const TONE: Record<TrustTone, string> = {
  neutral: "bg-[#F4F4F5] text-[#3F3F46] ring-[#D4D4D8]",
  warning: "bg-amber-50 text-amber-900 ring-amber-300",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-300",
};

type TrustInput = Pick<SiteDetail, "kind" | "verification" | "publishedAs">;

/** Insignia de confianza. `withKind` añade "Atractivo público" cuando aplica. */
export function TrustBadge({ site, withKind = false, className }: { site: TrustInput; withKind?: boolean; className?: string }) {
  const t = getListingTrust(site);
  const Icon = ICON[t.label];
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span
        title={t.description}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
          TONE[t.tone],
        )}
      >
        <Icon className="size-3 shrink-0" aria-hidden />
        {t.label}
        <span className="sr-only">. {t.description}</span>
      </span>
      {withKind && t.kindLabel && (
        <span className="whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-900 ring-1 ring-inset ring-sky-300">
          {t.kindLabel}
        </span>
      )}
    </span>
  );
}
