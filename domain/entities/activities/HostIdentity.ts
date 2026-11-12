import { colombianNumber } from "./value-objects/Cta"

/**
 * Registro de oferentes (Estatuto del Consumidor, Ley 1480 de 2011, art. 53): quien publica una actividad deja
 * sus datos de identificación; QHPA los guarda en privado, los muestra a quien necesite presentar una queja y los
 * entrega a la autoridad. Colección `hostIdentities/{uid}` (solo Admin SDK). Nunca va al HTML público.
 */
export type HostKind = "person" | "company"
export type PersonDocType = "CC" | "CE" | "PAS"

export interface HostIdentityInput {
  kind: HostKind
  /** Nombre completo (persona) o razón social (empresa). */
  name: string
  documentType: PersonDocType | "NIT"
  documentNumber: string
  /** Solo empresa. */
  representative?: string
  address: string
  email: string
  /** Normalizados a "+57…". */
  phones: string[]
}

export interface HostIdentityRecord extends HostIdentityInput {
  uid: string
  confirmedAt: Date
  updatedAt: Date
  /** LEGAL_VERSION aceptada al registrar. */
  legalVersion: string
  dataAuthorization: true
}

export const RECONFIRM_DAYS = 365
export type ParseHostResult = { ok: true; value: HostIdentityInput } | { ok: false; error: string }

const fail = (error: string): ParseHostResult => ({ ok: false, error })
const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\s+/g, " ").replace(/[\u0000-\u001f\u007f]/g, "").trim() : "")
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/

export function parseHostIdentity(raw: unknown): ParseHostResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("Datos de identificación inválidos.")
  const r = raw as Record<string, unknown>
  if (r.kind !== "person" && r.kind !== "company") return fail("Elige el tipo de oferente: persona o empresa.")
  const kind: HostKind = r.kind

  const name = clean(r.name)
  const representative = clean(r.representative)
  const address = clean(r.address)
  const email = clean(r.email).toLowerCase()
  if ([name, representative, address].some((s) => /[<>]/.test(s))) return fail("Los datos no pueden contener etiquetas ni código.")
  if (name.length < 3 || name.length > 120) return fail(kind === "person" ? "Escribe tu nombre completo." : "Escribe la razón social.")
  if (kind === "person" && name.split(" ").length < 2) return fail("Escribe tu nombre completo (nombre y apellido).")

  const documentType = clean(r.documentType)
  const rawNumber = clean(r.documentNumber)
  let documentNumber: string
  if (kind === "company") {
    if (documentType !== "NIT") return fail("El tipo de documento no corresponde: una empresa se identifica con NIT.")
    documentNumber = rawNumber.replace(/\D/g, "")
    if (documentNumber.length < 9 || documentNumber.length > 10) return fail("El NIT no es válido (9 o 10 dígitos, con el dígito de verificación).")
    if (representative.length < 3 || representative.length > 120) return fail("Escribe el nombre del representante legal.")
  } else if (documentType === "CC" || documentType === "CE") {
    documentNumber = rawNumber.replace(/\D/g, "")
    if (documentNumber.length < 5 || documentNumber.length > 12 || /\D/.test(rawNumber.replace(/[.\s-]/g, ""))) return fail("El número de documento no es válido.")
  } else if (documentType === "PAS") {
    documentNumber = rawNumber.replace(/[\s-]/g, "").toUpperCase()
    if (!/^[A-Z0-9]{5,15}$/.test(documentNumber)) return fail("El número de documento no es válido.")
  } else {
    return fail("Elige un tipo de documento válido.")
  }

  if (address.length < 8 || address.length > 200) return fail("Escribe una dirección completa (calle o carrera, número y ciudad).")
  if (email.length > 120 || !EMAIL_RE.test(email)) return fail("Escribe un correo electrónico válido.")
  const rawPhones = Array.isArray(r.phones) ? r.phones : []
  if (rawPhones.length < 1 || rawPhones.length > 3) return fail("Escribe entre 1 y 3 teléfonos.")
  const phones: string[] = []
  for (const p of rawPhones) {
    const n = typeof p === "string" ? colombianNumber(p) : null
    if (!n) return fail("Uno de los teléfonos no es válido (10 dígitos).")
    phones.push(`+57${n}`)
  }
  return {
    ok: true,
    value: { kind, name, documentType: documentType as HostIdentityInput["documentType"], documentNumber, ...(kind === "company" ? { representative } : {}), address, email, phones: [...new Set(phones)] },
  }
}

export type HostGate = { ok: true } | { ok: false; reason: "missing" | "expired"; message: string }

/** ¿Puede esta cuenta publicar? Sin registro, o con registro de más de 12 meses sin reconfirmar, no. */
export function hostIdentityGate(record: Pick<HostIdentityRecord, "confirmedAt"> | null, now: Date): HostGate {
  if (!record) return { ok: false, reason: "missing", message: "Para publicar debes registrar tus datos de identificación." }
  if (now.getTime() - record.confirmedAt.getTime() > RECONFIRM_DAYS * 86_400_000) return { ok: false, reason: "expired", message: "Pasó más de un año: reconfirma tus datos de identificación para seguir publicando." }
  return { ok: true }
}

export type ComplaintView = Pick<HostIdentityRecord, "kind" | "name" | "documentType" | "documentNumber" | "representative" | "address" | "email" | "phones">

/** Lo mínimo que ve quien necesita presentar una queja: nunca uid, fechas ni versión legal. */
export function complaintView(r: HostIdentityRecord): ComplaintView {
  const { kind, name, documentType, documentNumber, representative, address, email, phones } = r
  return { kind, name, documentType, documentNumber, ...(representative ? { representative } : {}), address, email, phones }
}
