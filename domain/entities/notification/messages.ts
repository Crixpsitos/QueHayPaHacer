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

export function activityModerationNotification(i: { title: string; slug: string; approved: boolean; reason?: string }): NewNotification {
  return i.approved
    ? { type: "activity_moderation", title: `Aprobaron tu actividad "${i.title}"`, body: "Ya aparece en Qué Hay Pa Hacer.", href: `/actividades/${i.slug}` }
    : { type: "activity_moderation", title: `No aprobaron tu actividad "${i.title}"`, body: i.reason?.trim() || undefined, href: "/actividades/mis" };
}

export function activityTransferredNotification(i: { title: string; siteName: string }): NewNotification {
  return {
    type: "activity_transferred",
    title: `Tu actividad "${i.title}" cambió de responsable`,
    body: i.siteName ? `Se aprobó un reclamo del sitio "${i.siteName}": la actividad pasó a su nuevo responsable.` : "Se aprobó un reclamo del sitio: la actividad pasó a su nuevo responsable.",
    href: "/actividades/mis",
  };
}

export function activityJoinNotification(i: { title: string; activityId: string; who: string; dateLabel: string | null }): NewNotification {
  return { type: "activity_join", title: `${i.who} se unió a "${i.title}"`, body: i.dateLabel ? `Salida: ${i.dateLabel}.` : undefined, href: `/actividades/${i.activityId}/inscritos` };
}

export function activityJoinConfirmedNotification(i: { title: string; slug: string; dateLabel: string | null; pending?: boolean }): NewNotification {
  if (i.pending) return { type: "activity_join_confirmed", title: `Cupo reservado: "${i.title}"`, body: `${i.dateLabel ? `Salida: ${i.dateLabel}. ` : ""}Quien organiza te escribirá por WhatsApp para coordinar el pago.`, href: `/actividades/${i.slug}` };
  return { type: "activity_join_confirmed", title: `Estás dentro: "${i.title}"`, body: i.dateLabel ? `Salida: ${i.dateLabel}.` : "Te esperan. Si no puedes ir, cancela desde la actividad.", href: `/actividades/${i.slug}` };
}

export function reviewReceivedNotification(i: { title: string; slug: string; rating: number; who: string }): NewNotification {
  return { type: "review_received", title: `${i.who} reseñó "${i.title}"`, body: `${"★".repeat(i.rating)}${"☆".repeat(5 - i.rating)}`, href: `/actividades/${i.slug}#resenas` };
}

/** Aviso a las dos partes tras resolver un cuestionamiento. Explica el resultado; el motivo del cuestionamiento solo lo ve quien lo envió. */
export function reviewFlagResolvedNotification(i: { title: string; slug: string; outcome: "upheld" | "removed"; audience: "host" | "reviewer" }): NewNotification {
  const href = `/actividades/${i.slug}#resenas`;
  if (i.outcome === "upheld") {
    return i.audience === "host"
      ? { type: "review_flag_resolved", title: `Revisamos una reseña de "${i.title}"`, body: "La reseña es válida y se mantiene con la marca «Verificada por QHPA».", href }
      : { type: "review_flag_resolved", title: "Tu reseña fue verificada", body: `Revisamos tu reseña de "${i.title}" y se mantiene publicada como «Verificada por QHPA».`, href };
  }
  return i.audience === "host"
    ? { type: "review_flag_resolved", title: `Retiramos una reseña de "${i.title}"`, body: "Tras revisarla, la reseña incumplía las reglas y se retiró.", href }
    : { type: "review_flag_resolved", title: "Retiramos tu reseña", body: `Tras revisarla, tu reseña de "${i.title}" incumplía las reglas. Si crees que fue un error, puedes apelar una vez desde tu cuenta.`, href: "/mis-planes" };
}

export function activitySanctionNotification(i: { kind: "warning" | "restriction" | "suspension"; role: "reviewer" | "host"; days: number }): NewNotification {
  const what = i.role === "reviewer" ? "reseñar" : "cuestionar reseñas";
  if (i.kind === "warning") return { type: "activity_sanction", title: "Advertencia sobre tus reseñas", body: i.role === "reviewer" ? "Una reseña tuya incumplía las reglas. La próxima vez habrá restricciones." : "Cuestionaste una reseña válida. Úsalo solo cuando incumpla las reglas.", href: "/terminos#resenas" };
  if (i.kind === "restriction") return { type: "activity_sanction", title: `Restricción: no puedes ${what} por ${i.days} días`, body: "Por reincidir en incumplir las reglas de reseñas.", href: "/terminos#resenas" };
  return { type: "activity_sanction", title: "Tu cuenta fue suspendida en reseñas y actividades", body: "QHPA revisará tu caso. Puedes escribirnos desde Contáctanos.", href: "/contactanos" };
}
