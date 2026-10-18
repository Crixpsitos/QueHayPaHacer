/**
 * Código de check-in por inscripción (control de asistencia con QR).
 * 12 caracteres Crockford base32 (60 bits aleatorios), sin I/L/O/U. Sin dependencias de Node:
 * la generación recibe los bytes aleatorios desde el servidor.
 */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CHECK_IN_CODE_LENGTH = 12;
const CODE_RE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{12}$/;
const PREFIX = "qhpa:1";

/** 12 bytes aleatorios (se usan 5 bits de cada uno) → código de 12 caracteres. */
export function generateCheckInCode(randomBytes: (n: number) => Uint8Array): string {
  const bytes = randomBytes(CHECK_IN_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CHECK_IN_CODE_LENGTH; i++) out += ALPHABET[bytes[i] & 31]; // 256 % 32 = 0 → sin sesgo
  return out;
}

/** `XXXXXXXXXXXX` → `XXXX-XXXX-XXXX`. */
export function formatCheckInCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

/** Mayúsculas, sin espacios ni guiones; I/L → 1, O → 0 (confusiones al dictar). */
export function normalizeCheckInCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
}

export const isValidCheckInCode = (code: string) => CODE_RE.test(code);

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** `qhpa:1:<eventId>:<sessionId|->:<CODE>` */
export function buildCheckInPayload(p: { eventId: string; sessionId?: string; code: string }): string {
  return `${PREFIX}:${p.eventId}:${p.sessionId || "-"}:${p.code}`;
}

export interface ParsedCheckIn {
  code: string;
  /** Solo si venía en un QR completo. */
  eventId?: string;
  /** `null` = el QR dice "evento sin sesión"; `undefined` = no venía (código suelto). */
  sessionId?: string | null;
}

/** Acepta el payload completo del QR o un código suelto (escrito a mano). null si es inválido. */
export function parseCheckInPayload(text: string): ParsedCheckIn | null {
  const t = text.trim();
  if (t.toLowerCase().startsWith("qhpa:")) {
    const parts = t.split(":");
    if (parts.length !== 5 || parts[0].toLowerCase() !== "qhpa" || parts[1] !== "1") return null;
    const [, , eventId, session, raw] = parts;
    const code = normalizeCheckInCode(raw);
    if (!ID_RE.test(eventId) || !(session === "-" || ID_RE.test(session)) || !isValidCheckInCode(code)) return null;
    return { eventId, sessionId: session === "-" ? null : session, code };
  }
  const code = normalizeCheckInCode(t);
  return isValidCheckInCode(code) ? { code } : null;
}
