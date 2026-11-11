import { test } from "node:test"
import assert from "node:assert/strict"
import { emptyIdentity, identityError, identityToRaw, type IdentityForm } from "./identityForm"
import { parseHostIdentity } from "@/domain/entities/activities/HostIdentity"

const person = (p: Partial<IdentityForm> = {}): IdentityForm => ({ ...emptyIdentity(), name: "Camila Rodríguez", documentType: "CC", documentNumber: "1.234.567.890", address: "Calle 10 # 5-20, Ibagué", email: "camila@correo.com", phones: ["300 123 4567"], ...p })

test("el formulario vacío tiene un teléfono vacío y es de persona", () => {
  const f = emptyIdentity()
  assert.deepEqual([f.kind, f.phones], ["person", [""]])
  assert.notEqual(identityError(f), null)
})

test("persona completa pasa y se convierte en la entrada del servidor", () => {
  assert.equal(identityError(person()), null)
  const r = parseHostIdentity(identityToRaw(person()))
  assert.equal(r.ok, true)
})

test("los teléfonos vacíos se descartan y no cuentan", () => {
  const raw = identityToRaw(person({ phones: ["300 123 4567", "", "  "] })) as { phones: string[] }
  assert.deepEqual(raw.phones, ["300 123 4567"])
  assert.match(identityError(person({ phones: ["", ""] }))!, /teléfono/i)
})

test("empresa: usa NIT y pide representante; persona no manda representante", () => {
  const co = person({ kind: "company", name: "Cafetería La Plaza S.A.S.", documentType: "NIT", documentNumber: "900.123.456-7", representative: "Juan Pérez" })
  assert.equal(identityError(co), null)
  assert.equal((identityToRaw(person({ representative: "Quien sea" })) as { representative?: string }).representative, undefined)
  assert.match(identityError({ ...co, representative: "" })!, /representante/i)
})

test("mensajes de error en español para correo y documento", () => {
  assert.match(identityError(person({ email: "no-es-correo" }))!, /correo/i)
  assert.match(identityError(person({ documentNumber: "12" }))!, /documento/i)
})

import { withKind } from "./identityForm"
test("withKind: empresa fija NIT; volver a persona quita NIT y representante", () => {
  const co = withKind({ ...person(), representative: "x" }, "company")
  assert.deepEqual([co.documentType, co.representative], ["NIT", "x"])
  const back = withKind(co, "person")
  assert.deepEqual([back.documentType, back.representative], ["CC", ""])
})
