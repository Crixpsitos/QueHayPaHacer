import assert from "node:assert/strict"
import { test } from "node:test"
import { safeParse } from "valibot"
import { step6Schema } from "./EventDto"

const base = { registrationType: "external" as const, price: { isFree: true, amount: 0, currency: "COP" } }

test("registro externo: acepta el enlace sin https:// y lo guarda completo", () => {
  const r = safeParse(step6Schema, { ...base, externalUrl: "ejemplo.com/registro" })
  assert.equal(r.success, true, JSON.stringify(r.success ? "" : r.issues.map((i) => i.message)))
  assert.equal(r.success && r.output.externalUrl, "https://ejemplo.com/registro")
})

test("registro externo: rechaza enlaces inválidos o peligrosos", () => {
  for (const bad of ["javascript:alert(1)", "no es un enlace", "localhost"]) {
    assert.equal(safeParse(step6Schema, { ...base, externalUrl: bad }).success, false, bad)
  }
})
