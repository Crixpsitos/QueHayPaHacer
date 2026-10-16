import { SUGGESTION_FIELD_LABELS, type SuggestionField } from "@/domain/entities/siteSuggestion/SiteSuggestion";
import type { NewNotification } from "./Notification";

/** Textos compartidos entre la action y los scripts de operación (misma redacción en ambos). */

export function suggestionResolvedNotification(i: {
  siteName: string;
  field: string;
  accepted: boolean;
  note?: string;
}): NewNotification {
  const label = SUGGESTION_FIELD_LABELS[i.field as SuggestionField] ?? "Tu sugerencia";
  return {
    type: "suggestion_resolved",
    title: i.accepted ? `Aceptaron tu sugerencia en "${i.siteName}"` : `No aceptaron tu sugerencia en "${i.siteName}"`,
    body: [label, i.note?.trim()].filter(Boolean).join(" · "),
    href: "/donde-ir",
  };
}

export function claimResolvedNotification(i: { siteName: string; approved: boolean; reason?: string }): NewNotification {
  return i.approved
    ? {
        type: "claim_resolved",
        title: `Aprobaron tu reclamo de "${i.siteName}"`,
        body: "Ahora la ficha figura como verificada y a tu nombre.",
        href: "/sites",
      }
    : {
        type: "claim_resolved",
        title: `No aprobaron tu reclamo de "${i.siteName}"`,
        body: i.reason?.trim() || undefined,
        href: "/donde-ir",
      };
}
