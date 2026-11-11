import { test } from "node:test"
import assert from "node:assert/strict"
import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { joinDecision, resolveOccurrenceKey, spotsLeft } from "./activityJoin"

const NOW = new Date("2026-11-10T15:00:00Z") // martes 10 de noviembre, 10:00 en Bogotá
const sundays: ActivitySchedule = { rules: [{ kind: "weekly", weekdays: [0], start: "06:00" }], skipDates: [], requiresReservation: false }
const always: ActivitySchedule = { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false }

test("sin fecha pedida: toma la próxima salida", () => {
  assert.deepEqual(resolveOccurrenceKey(sundays, null, NOW), { ok: true, key: "2026-11-15" })
})
test("fecha pedida válida: se acepta; que no sea una salida o ya pasó: se rechaza", () => {
  assert.deepEqual(resolveOccurrenceKey(sundays, "2026-11-22", NOW), { ok: true, key: "2026-11-22" })
  assert.equal(resolveOccurrenceKey(sundays, "2026-11-17", NOW).ok, false) // martes: no hay salida
  assert.equal(resolveOccurrenceKey(sundays, "2026-11-08", NOW).ok, false) // domingo pasado
  assert.equal(resolveOccurrenceKey(sundays, "no-es-fecha", NOW).ok, false)
  assert.equal(resolveOccurrenceKey(sundays, "2027-06-06", NOW).ok, false) // muy lejos
})
test("hoy todavía cuenta si la salida no ha terminado", () => {
  const sunday = new Date("2026-11-15T10:00:00Z") // domingo 5 a. m. en Bogotá, antes de las 6
  assert.deepEqual(resolveOccurrenceKey(sundays, "2026-11-15", sunday), { ok: true, key: "2026-11-15" })
})
test("sin fecha fija: una sola inscripción abierta", () => {
  assert.deepEqual(resolveOccurrenceKey(always, null, NOW), { ok: true, key: "open" })
  assert.deepEqual(resolveOccurrenceKey(always, "2026-11-22", NOW), { ok: true, key: "open" })
})
test("sin salidas próximas: error claro", () => {
  const over: ActivitySchedule = { ...sundays, validUntil: "2026-11-01" }
  assert.equal(resolveOccurrenceKey(over, null, NOW).ok, false)
})

test("cupo: libre, lleno, cerrado y sin tope", () => {
  assert.deepEqual(joinDecision({ capacity: 3, closed: false }, 2), { ok: true })
  assert.deepEqual(joinDecision({ capacity: 3, closed: false }, 3), { ok: false, reason: "full" })
  assert.deepEqual(joinDecision({ capacity: null, closed: false }, 9999), { ok: true })
  assert.deepEqual(joinDecision({ capacity: 3, closed: true }, 0), { ok: false, reason: "closed" })
})
test("cupos restantes", () => {
  assert.equal(spotsLeft({ capacity: 10, closed: false }, 6), 4)
  assert.equal(spotsLeft({ capacity: 10, closed: false }, 12), 0)
  assert.equal(spotsLeft({ capacity: null, closed: false }, 5), null)
})
