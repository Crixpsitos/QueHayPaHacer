import { test } from "node:test"
import assert from "node:assert/strict"
import { firstOccurrenceIn, parseWhen, whenRange } from "./when"
import type { ActivitySchedule } from "./value-objects/ActivitySchedule"

const at = (iso: string) => new Date(iso) // instantes UTC; Bogotá = UTC-5
const sundays6: ActivitySchedule = { rules: [{ kind: "weekly", weekdays: [0], start: "06:00", end: "10:00" }], skipDates: [], requiresReservation: false }

test("rangos: hoy, fin de semana (viernes a domingo, desde hoy) y próximos 7 días", () => {
  const tue = at("2026-11-10T15:00:00Z") // martes 10
  assert.deepEqual(whenRange("hoy", tue), { from: "2026-11-10", to: "2026-11-10" })
  assert.deepEqual(whenRange("este-fin-de-semana", tue), { from: "2026-11-13", to: "2026-11-15" })
  assert.deepEqual(whenRange("esta-semana", tue), { from: "2026-11-10", to: "2026-11-16" })
  assert.deepEqual(whenRange("este-fin-de-semana", at("2026-11-14T15:00:00Z")), { from: "2026-11-14", to: "2026-11-15" }) // sábado
  assert.deepEqual(whenRange("este-fin-de-semana", at("2026-11-15T15:00:00Z")), { from: "2026-11-15", to: "2026-11-15" }) // domingo
})
test("medianoche en Bogotá: a las 23:30 del sábado todavía es sábado", () => {
  assert.equal(whenRange("hoy", at("2026-11-15T04:30:00Z")).from, "2026-11-14")
})
test("parseWhen solo acepta valores conocidos", () => {
  assert.equal(parseWhen("hoy"), "hoy")
  assert.equal(parseWhen("manana"), undefined)
  assert.equal(parseWhen(["hoy"]), undefined)
})
test("el domingo de 6 a 10 a. m. aparece hoy a las 7, no después de terminar, y no el lunes", () => {
  const sun7 = at("2026-11-15T12:00:00Z") // domingo 7:00 en Bogotá
  assert.equal(firstOccurrenceIn(sundays6, whenRange("hoy", sun7), sun7)?.date, "2026-11-15")
  const sun11 = at("2026-11-15T16:00:00Z") // ya terminó
  assert.equal(firstOccurrenceIn(sundays6, whenRange("hoy", sun11), sun11), null)
  const mon = at("2026-11-16T15:00:00Z")
  assert.equal(firstOccurrenceIn(sundays6, whenRange("hoy", mon), mon), null)
})
test("fechas saltadas (skipDates) se excluyen", () => {
  const s = { ...sundays6, skipDates: ["2026-11-15"] }
  const tue = at("2026-11-10T15:00:00Z")
  assert.equal(firstOccurrenceIn(s, whenRange("este-fin-de-semana", tue), tue), null)
})
test("sin fecha fija ('todos los días') aparece hoy; 'con cita' no", () => {
  const now = at("2026-11-10T15:00:00Z")
  const always: ActivitySchedule = { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false }
  const appt: ActivitySchedule = { rules: [{ kind: "byAppointment" }], skipDates: [], requiresReservation: true }
  assert.ok(firstOccurrenceIn(always, whenRange("hoy", now), now))
  assert.equal(firstOccurrenceIn(appt, whenRange("hoy", now), now), null)
})
