/**
 * Preferencias de avisos por correo y push (`users/{uid}/notificationPrefs/main`). Por defecto TODO apagado salvo lo
 * transaccional de la propia inscripción (confirmación, «mañana sale», último cupo). Marketing y push exigen una
 * casilla de autorización aparte, con fecha y versión legal. Los usuarios existentes NO se apuntan solos.
 */
export interface NotificationPrefs {
  email: { transactional: boolean; forYou: boolean; weekly: boolean }
  push: { enabled: boolean }
  consent: { at: Date; version: string } | null
  unsubscribedAt: Date | null
}
export type PrefChannel = "email" | "push"
export type PrefKind = "transactional" | "forYou" | "weekly"

export const defaultPrefs = (): NotificationPrefs => ({ email: { transactional: true, forYou: false, weekly: false }, push: { enabled: false }, consent: null, unsubscribedAt: null })

/** ¿Se puede enviar este tipo de aviso por este canal? Sin permiso no hay envío. */
export function canSend(p: NotificationPrefs, channel: PrefChannel, kind: PrefKind): boolean {
  if (channel === "push") return p.consent !== null && p.push.enabled
  if (kind === "transactional") return p.email.transactional
  return p.consent !== null && p.unsubscribedAt === null && p.email[kind]
}

export interface PrefsInput { email?: Partial<NotificationPrefs["email"]>; push?: Partial<NotificationPrefs["push"]> }

/** Aplica lo que la persona eligió. Encender marketing o push pide la casilla; apagar siempre se puede. */
export function applyPrefsInput(p: NotificationPrefs, input: PrefsInput, o: { authorized: boolean; version: string; now: Date }): { ok: true; prefs: NotificationPrefs } | { ok: false; error: string } {
  const email = { ...p.email, ...input.email }
  const push = { ...p.push, ...input.push }
  const turnsOn = (email.forYou && !p.email.forYou) || (email.weekly && !p.email.weekly) || (push.enabled && !p.push.enabled)
  const needsConsent = turnsOn || ((email.forYou || email.weekly || push.enabled) && (p.consent === null || p.unsubscribedAt !== null))
  if (needsConsent && !o.authorized) return { ok: false, error: "Marca la casilla de autorización para recibir avisos." }
  const consent = needsConsent ? { at: o.now, version: o.version } : p.consent
  const reactivated = email.transactional || email.forYou || email.weekly
  return { ok: true, prefs: { email, push, consent, unsubscribedAt: needsConsent || reactivated ? null : p.unsubscribedAt } }
}

/** Baja con un clic desde el correo: apaga TODO el correo y deja la fecha. El push es otro permiso y no se toca. */
export const unsubscribeEmail = (p: NotificationPrefs, now: Date): NotificationPrefs => ({ ...p, email: { transactional: false, forYou: false, weekly: false }, unsubscribedAt: now })
