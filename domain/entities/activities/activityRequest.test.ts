import { test } from "node:test"
import assert from "node:assert/strict"
import { REQUEST_TTL_MS, isRequestCta, requestDocId, requestState, upcomingDepartures } from "./activityRequest"
import type { ActivitySchedule } from "./value-objects/ActivitySchedule"

const NOW = new Date("2026-11-13T15:00:00Z") // viernes 10 a. m. en Bogotá
const weekly = (days: (0 | 1 | 2 | 3 | 4 | 5 | 6)[], start = "09:00", end?: string): ActivitySchedule => ({ rules: [{ kind: "weekly", weekdays: days, start, ...(end ? { end } : {}) }], skipDates: [], requiresReservation: false })

test("sin fecha fija (siempre o con cita): una sola salida «open»", () => {
  assert.deepEqual(upcomingDepartures({ rules: [{ kind: "always" }], skipDates: [], requiresReservation: false }, NOW), [{ key: "open", date: null }])
})
test("con fechas: las próximas 4 salidas, de hoy en adelante", () => {
  const d = upcomingDepartures(weekly([0, 6], "16:00"), NOW) // sábados y domingos
  assert.deepEqual(d.map((x) => x.key), ["2026-11-14", "2026-11-15", "2026-11-21", "2026-11-22"])
})
test("la salida de hoy solo si no terminó", () => {
  assert.equal(upcomingDepartures(weekly([5], "06:00", "08:00"), NOW)[0].key, "2026-11-20") // viernes de 6 a 8 a. m.: ya pasó
  assert.equal(upcomingDepartures(weekly([5], "16:00", "18:00"), NOW)[0].key, "2026-11-13") // viernes de 4 a 6 p. m.: falta
})
test("una solicitud vence a las 24 h exactas (se calcula, no se borra)", () => {
  const t0 = NOW.getTime()
  assert.equal(requestState(t0, t0 + REQUEST_TTL_MS), "active")
  assert.equal(requestState(t0, t0 + REQUEST_TTL_MS + 1), "expired")
})
test("solo los botones de reservar o preguntar piden registro", () => {
  for (const k of ["whatsapp", "phone", "reserveLink", "buyLink"]) assert.equal(isRequestCta(k), true)
  for (const k of ["website", "instagram", "whatsappGroup", null]) assert.equal(isRequestCta(k), false)
  assert.equal(requestDocId("2026-11-14", "u1"), "2026-11-14_u1")
})
