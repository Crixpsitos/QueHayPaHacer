import { test } from "node:test"
import assert from "node:assert/strict"
import { complaintView, hostIdentityGate, parseHostIdentity, RECONFIRM_DAYS, type HostIdentityInput, type HostIdentityRecord } from "./HostIdentity"

const person = () => ({ kind: "person", name: "  Camila  Rodríguez ", documentType: "CC", documentNumber: "1.234.567.890", address: "Calle 10 # 5-20, Ibagué", email: " Camila@Correo.com ", phones: ["300 123 4567"] })
const company = () => ({ kind: "company", name: "Cafetería La Plaza S.A.S.", documentType: "NIT", documentNumber: "900.123.456-7", representative: "Juan Pérez", address: "Carrera 3 # 12-30, Ibagué", email: "info@laplaza.co", phones: ["3001234567", "608 123 4567"] })

const ok = (raw: unknown): HostIdentityInput => {
  const r = parseHostIdentity(raw)
  assert.equal(r.ok, true, JSON.stringify(r))
  return (r as { ok: true; value: HostIdentityInput }).value
}
const err = (patch: Record<string, unknown>, base = person()) => {
  const r = parseHostIdentity({ ...base, ...patch })
  assert.equal(r.ok, false, JSON.stringify(patch))
  return (r as { ok: false; error: string }).error
}

test("persona natural: se normaliza nombre, documento, correo y teléfono", () => {
  const v = ok(person())
  assert.equal(v.name, "Camila Rodríguez")
  assert.equal(v.documentNumber, "1234567890")
  assert.equal(v.email, "camila@correo.com")
  assert.deepEqual(v.phones, ["+573001234567"])
  assert.equal(v.representative, undefined)
})

test("empresa: NIT con dígito de verificación y representante obligatorio", () => {
  const v = ok(company())
  assert.equal(v.documentNumber, "9001234567")
  assert.equal(v.representative, "Juan Pérez")
  assert.deepEqual(v.phones, ["+573001234567", "+576081234567"])
  assert.match(err({ representative: "" }, company() as never), /representante/i)
})

test("persona: nombre y apellido; tipo de documento coherente con el tipo", () => {
  assert.match(err({ name: "Camila" }), /nombre completo/i)
  assert.match(err({ documentType: "NIT" }), /documento/i)
  assert.match(err({ documentType: "CC" }, company() as never), /documento/i)
})

test("número de documento: dígitos y largo según el tipo", () => {
  assert.match(err({ documentNumber: "123" }), /documento/i)
  assert.match(err({ documentNumber: "abc12345" }), /documento/i)
  assert.equal(ok({ ...person(), documentType: "PAS", documentNumber: "AB123456" }).documentNumber, "AB123456")
})

test("dirección, correo y teléfonos obligatorios y válidos", () => {
  assert.match(err({ address: "Calle" }), /dirección/i)
  assert.match(err({ email: "no-es-correo" }), /correo/i)
  assert.match(err({ phones: [] }), /teléfono/i)
  assert.match(err({ phones: ["123"] }), /teléfono/i)
  assert.match(err({ phones: ["3001234567", "3001234568", "3001234569", "3001234560"] }), /teléfono/i)
})

test("rechaza etiquetas HTML y basura", () => {
  assert.match(err({ name: "<b>Camila</b> Rodríguez" }), /etiquetas|nombre/i)
  for (const x of [null, undefined, "x", 3, []]) assert.equal(parseHostIdentity(x).ok, false)
  assert.match(err({ kind: "otro" }), /tipo/i)
})

const record = (confirmedAt: Date): HostIdentityRecord => ({ ...ok(person()), uid: "u1", confirmedAt, updatedAt: confirmedAt, legalVersion: "2026-11-05", dataAuthorization: true })
const NOW = new Date("2026-11-10T00:00:00Z")
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000)

test("gate: sin registro o con registro vencido (12 meses) no se puede publicar", () => {
  assert.equal(RECONFIRM_DAYS, 365)
  assert.deepEqual(hostIdentityGate(null, NOW), { ok: false, reason: "missing", message: "Para publicar debes registrar tus datos de identificación." })
  const g = hostIdentityGate(record(daysAgo(366)), NOW)
  assert.equal(g.ok, false)
  assert.equal(g.ok === false && g.reason, "expired")
  assert.deepEqual(hostIdentityGate(record(daysAgo(364)), NOW), { ok: true })
})

test("la vista para quejas no incluye uid, versión legal ni fechas", () => {
  const v = complaintView(record(daysAgo(1)))
  assert.deepEqual(Object.keys(v).sort(), ["address", "documentNumber", "documentType", "email", "kind", "name", "phones"])
})
