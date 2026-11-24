import { test } from "node:test"
import assert from "node:assert/strict"
import { eventSlots, type SessionIn } from "./sessionSlots"

const s = (id: string, start: string, status = "published", extra: Partial<SessionIn> = {}): SessionIn => ({ id, status, startDate: new Date(start), endDate: new Date(Date.parse(start) + 2 * 3_600_000), venue: "Brewing", address: "Calle 60", price: "$15.000", free: false, tiers: "", ...extra })
const NOW = Date.parse("2026-11-12T20:00:00Z")

test("devuelve las funciones por venir en orden, numeradas sobre todas las publicadas", () => {
  const slots = eventSlots([s("c", "2026-11-21T01:00:00Z"), s("a", "2026-11-05T01:00:00Z"), s("b", "2026-11-14T02:00:00Z"), s("x", "2026-11-16T02:00:00Z", "cancelled")], NOW)
  assert.deepEqual(slots.map((x) => x.sessionId), ["b", "c"])
  assert.deepEqual(slots.map((x) => x.label), ["Función 2 de 3", "Función 3 de 3"])
  assert.equal(slots[0].place, "Brewing · Calle 60")
})

test("una función en curso todavía cuenta; sin publicadas no hay nada", () => {
  assert.equal(eventSlots([s("a", "2026-11-12T19:00:00Z")], NOW).length, 1)
  assert.deepEqual(eventSlots([s("a", "2026-11-14T02:00:00Z", "draft")], NOW), [])
})

test("usa el slug de la función en la ruta y el id si no tiene", () => {
  assert.deepEqual(eventSlots([s("a", "2026-11-14T02:00:00Z", "published", { slug: "noche-1" }), s("b", "2026-11-15T02:00:00Z")], NOW).map((x) => x.ref), ["noche-1", "b"])
})
