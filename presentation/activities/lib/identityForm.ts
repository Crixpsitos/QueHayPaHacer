import { parseHostIdentity, type HostKind } from "@/domain/entities/activities/HostIdentity"

/** Formulario del registro de oferentes (Ley 1480 art. 53), tal como lo escribe la persona. El servidor repite la validación. */
export interface IdentityForm {
  kind: HostKind
  name: string
  documentType: "CC" | "CE" | "PAS" | "NIT"
  documentNumber: string
  representative: string
  address: string
  email: string
  phones: string[]
}

export const emptyIdentity = (): IdentityForm => ({ kind: "person", name: "", documentType: "CC", documentNumber: "", representative: "", address: "", email: "", phones: [""] })

/** Cambiar entre persona y empresa ajusta el tipo de documento (NIT solo para empresa). */
export const withKind = (f: IdentityForm, kind: HostKind): IdentityForm => ({ ...f, kind, documentType: kind === "company" ? "NIT" : f.documentType === "NIT" ? "CC" : f.documentType, representative: kind === "company" ? f.representative : "" })

export const identityToRaw = (f: IdentityForm): unknown => ({
  kind: f.kind,
  name: f.name,
  documentType: f.documentType,
  documentNumber: f.documentNumber,
  ...(f.kind === "company" ? { representative: f.representative } : {}),
  address: f.address,
  email: f.email,
  phones: f.phones.filter((p) => p.trim()),
})

export function identityError(f: IdentityForm): string | null {
  const r = parseHostIdentity(identityToRaw(f))
  return r.ok ? null : r.error
}
