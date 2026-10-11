import type { Events } from "@/domain/entities/events/Events";
import type { User } from "@/domain/entities/user/User";

type EventModerationFields = Pick<
  Events,
  | "status"
  | "moderationStatus"
  | "moderationMode"
  | "rejectionReason"
  | "submittedAt"
  | "reviewedAt"
  | "reviewedBy"
  | "publishedAt"
>;

export function moderationFieldsForSubmission(
  author: User,
  submittedAt = new Date(),
): EventModerationFields {
  if (author.creatorVerified) {
    return {
      status: "published",
      moderationStatus: "pending_audit",
      moderationMode: "post_publication",
      rejectionReason: null,
      submittedAt,
      reviewedAt: null,
      reviewedBy: null,
      publishedAt: submittedAt,
    };
  }

  return {
    status: "pending",
    moderationStatus: "pending",
    moderationMode: "pre_publication",
    rejectionReason: null,
    submittedAt,
    reviewedAt: null,
    reviewedBy: null,
    publishedAt: undefined,
  };
}

/**
 * Campos que solo escribe el servidor (autoría, tipo, estado/moderación,
 * promoción, analytics, metadata, createdAt). El payload del cliente nunca los
 * pisa: se toman del evento ya guardado. Sin esto, `toDomain` (analytics
 * undefined, createdAt = now) reseteaba score y fecha de creación en cada save.
 */
/**
 * Ruta que escribe el optimizador (Cloud Function) para un upload `deoptimized-…`:
 * `<dir>/optimized_<base sin "deoptimized-" ni extensión>.webp`.
 */
export function optimizedPathFor(uploadPath: string): string {
  const slash = uploadPath.lastIndexOf("/");
  const dir = uploadPath.slice(0, slash + 1);
  const file = uploadPath.slice(slash + 1);
  const dot = file.indexOf(".");
  const base = (dot === -1 ? file : file.slice(0, dot)).replace(/^deoptimized[-_]?/i, "");
  return `${dir}optimized_${base}.webp`;
}

/**
 * El cliente puede reenviar la imagen principal en `processing` después de que la
 * Cloud Function ya la dejó `ready` (carrera autosave vs. optimizador). Si es la
 * misma imagen, se conserva la versión optimizada del servidor.
 */
function reconcileMainImage(existing: Events["mainImage"], incoming: Events["mainImage"]): Events["mainImage"] {
  if (
    existing?.status === "ready" &&
    incoming?.status === "processing" &&
    incoming.path &&
    existing.path === optimizedPathFor(incoming.path)
  ) {
    return existing;
  }
  return incoming;
}

export function withServerOwnedFields(existing: Events, incoming: Events): Events {
  return {
    ...incoming,
    mainImage: reconcileMainImage(existing.mainImage, incoming.mainImage),
    id: existing.id,
    slug: existing.slug || incoming.slug,
    author: existing.author,
    eventType: existing.eventType,
    status: existing.status,
    moderationStatus: existing.moderationStatus,
    moderationMode: existing.moderationMode,
    rejectionReason: existing.rejectionReason,
    submittedAt: existing.submittedAt,
    reviewedAt: existing.reviewedAt,
    reviewedBy: existing.reviewedBy,
    publishedAt: existing.publishedAt,
    promotion: existing.promotion,
    analytics: existing.analytics,
    metadata: existing.metadata,
    createdAt: existing.createdAt,
  };
}

type PlanGatedFields = Partial<Pick<Events, "requiresAttendance" | "registrationType" | "registrationEventForm">>;

/**
 * Capacidades Premium del evento, validadas en servidor (la UI solo las oculta):
 * control de asistencia y formulario personalizado. Sin Premium, la inscripción
 * con formulario baja a inscripción interna (sigue abierta para todos).
 */
export function enforcePlanFeatures<T extends PlanGatedFields>(event: T, author: Pick<User, "plan"> | null | undefined): T {
  if (author?.plan === "premium") return event;
  const out: T = { ...event, requiresAttendance: false };
  if (out.registrationType === "form") {
    out.registrationType = "internal";
    delete out.registrationEventForm;
  }
  return out;
}
