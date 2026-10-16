/**
 * Notificaciones de la campanita. Subcolección `users/{uid}/notifications` (solo Admin SDK).
 * Cada una es un aviso corto con un enlace; no hay preferencias ni envío por correo/push.
 */
export const NOTIFICATION_TYPES = [
  "invitation_received",
  "invitation_accepted",
  "team_role_changed",
  "suggestion_received",
  "suggestion_resolved",
  "claim_resolved",
  "event_moderation",
  "site_moderation",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TITLE_MAX = 120;
export const NOTIFICATION_BODY_MAX = 240;
/** Cuántas se muestran en la campanita (las más recientes). */
export const NOTIFICATIONS_LIMIT = 30;
/** Firestore TTL: borra el documento pasado este plazo (requiere activar la política TTL sobre `expireAt`). */
export const NOTIFICATION_TTL_DAYS = 90;

export interface NewNotification {
  type: NotificationType;
  title: string;
  body?: string;
  /** Ruta interna (empieza por "/"). */
  href?: string;
}

/** Notificación tal como la ve su destinatario. Fecha en ms. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  read: boolean;
  createdAt: number;
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Recorta textos y descarta enlaces externos: el contenido puede incluir nombres escritos por otros usuarios. */
export function sanitizeNotification(n: NewNotification): NewNotification {
  const href = n.href && /^\/(?!\/)/.test(n.href) ? n.href : undefined;
  return {
    type: n.type,
    title: clip(n.title.trim(), NOTIFICATION_TITLE_MAX),
    ...(n.body?.trim() ? { body: clip(n.body.trim(), NOTIFICATION_BODY_MAX) } : {}),
    ...(href ? { href } : {}),
  };
}
