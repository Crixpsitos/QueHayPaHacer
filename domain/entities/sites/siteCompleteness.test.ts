import { test } from "node:test"
import assert from "node:assert/strict"
import { COMPLETENESS_RULES, getSiteCompleteness, type CompletenessInput } from "./siteCompleteness"

const empty: CompletenessInput = { hasCover: false, description: "", schedule: { mon: { closed: true } }, address: "" }
const full: CompletenessInput = {
  hasCover: true,
  description: "x".repeat(80),
  schedule: { mon: { closed: false } },
  address: "Calle 1",
  openingPolicy: { holidays: { policy: "same" }, rain: { policy: "open" } },
  socialMedia: { instagram: "https://instagram.com/a" },
  recommendations: { tips: ["kids"] },
}

test("ficha vacía: 0 % y todas las pistas pendientes", () => {
  const c = getSiteCompleteness(empty)
  assert.equal(c.percent, 0)
  assert.equal(c.complete, false)
  assert.equal(c.pending.length, COMPLETENESS_RULES.length)
})

test("ficha completa: 100 %", () => {
  const c = getSiteCompleteness(full)
  assert.equal(c.percent, 100)
  assert.equal(c.complete, true)
  assert.deepEqual(c.pending, [])
})

test("descripción de 79 caracteres no cuenta; reserva sin redes sí", () => {
  const c = getSiteCompleteness({ ...full, description: "x".repeat(79), socialMedia: {}, bookingUrl: "https://wa.me/57" })
  assert.deepEqual(c.pending.map((r) => r.id), ["description"])
})

test("el total sale de la lista de reglas (extensible)", () => {
  const extra = [...COMPLETENESS_RULES, { id: "x", label: "X", hint: "x", done: () => false }]
  const c = getSiteCompleteness(full, extra)
  assert.equal(c.total, COMPLETENESS_RULES.length + 1)
  assert.equal(c.complete, false)
  assert.equal(getSiteCompleteness(full, []).percent, 0)
})
