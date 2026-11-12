import { test } from "node:test"
import assert from "node:assert/strict"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { nextDepartureLabel } from "./nextDeparture"

const weekly = (start = "06:00", end?: string): ActivitySchedule => ({ rules: [{ kind: "weekly", weekdays: [0], start, ...(end ? { end } : {}) }], skipDates: [], requiresReservation: false })

test("próxima salida con fecha larga, hora y cuántos días faltan", () => {
  // martes 10 nov, 10:00 en Bogotá → el domingo 15 faltan 5 días
  const r = nextDepartureLabel(weekly(), new Date("2026-11-10T15:00:00Z"))
  assert.deepEqual(r, { dateLabel: "Domingo 15 de noviembre", timeLabel: "6:00 a. m.", relative: "En 5 días" })
})

test("hoy y mañana", () => {
  // domingo 15 a las 5:00 a. m. Bogotá → la salida de las 6:00 es hoy
  assert.equal(nextDepartureLabel(weekly(), new Date("2026-11-15T10:00:00Z"))?.relative, "Hoy")
  // sábado 14 → mañana
  assert.equal(nextDepartureLabel(weekly(), new Date("2026-11-14T15:00:00Z"))?.relative, "Mañana")
})

test("ya empezada sin hora de fin pasa a la semana siguiente; en curso con fin sigue siendo hoy", () => {
  assert.equal(nextDepartureLabel(weekly(), new Date("2026-11-15T13:00:00Z"))?.dateLabel, "Domingo 22 de noviembre") // 8:00 a. m.
  assert.equal(nextDepartureLabel(weekly("06:00", "14:00"), new Date("2026-11-15T13:00:00Z"))?.relative, "Hoy")
})

test("sin hora (todos los días) no muestra hora; solo con cita no tiene próxima salida", () => {
  const always: ActivitySchedule = { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false }
  assert.equal(nextDepartureLabel(always, new Date("2026-11-10T15:00:00Z"))?.timeLabel, null)
  const cita: ActivitySchedule = { rules: [{ kind: "byAppointment" }], skipDates: [], requiresReservation: true }
  assert.equal(nextDepartureLabel(cita, new Date("2026-11-10T15:00:00Z")), null)
})

test("meses de la fecha larga en español", () => {
  const dec: ActivitySchedule = { rules: [{ kind: "dates", dates: ["2026-12-05"], start: "21:30" }], skipDates: [], requiresReservation: false }
  assert.deepEqual(nextDepartureLabel(dec, new Date("2026-11-10T15:00:00Z")), { dateLabel: "Sábado 5 de diciembre", timeLabel: "9:30 p. m.", relative: "En 25 días" })
})
