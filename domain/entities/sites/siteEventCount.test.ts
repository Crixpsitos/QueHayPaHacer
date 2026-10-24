import { test } from "node:test"
import assert from "node:assert/strict"
import { countSiteEvents, EVENT_COUNT_WINDOW_DAYS } from "./siteEventCount"

const NOW = new Date("2026-10-24T12:00:00Z")
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * 86_400_000)
const ev = (status: string, endDays: number | null, startDays?: number) => ({
  status,
  endDate: endDays === null ? null : daysFromNow(endDays),
  startDate: startDays === undefined ? undefined : daysFromNow(startDays),
})

test("cuenta próximos, en curso y recientes", () => {
  assert.equal(countSiteEvents([ev("published", 10), ev("published", 0), ev("published", -30)], NOW), 3)
})

test("la ventana es de 90 días tras terminar", () => {
  assert.equal(EVENT_COUNT_WINDOW_DAYS, 90)
  assert.equal(countSiteEvents([ev("published", -89), ev("published", -90)], NOW), 2, "justo en el borde aún cuenta")
  assert.equal(countSiteEvents([ev("published", -91)], NOW), 0)
})

test("solo cuentan los publicados: no borradores, pendientes, rechazados, cancelados ni terminados", () => {
  const statuses = ["draft", "pending", "rejected", "cancelled", "ended"]
  assert.equal(countSiteEvents(statuses.map((s) => ev(s, 5)), NOW), 0)
  assert.equal(countSiteEvents([...statuses.map((s) => ev(s, 5)), ev("published", 5)], NOW), 1)
})

test("sin endDate usa startDate; sin ninguna fecha se cuenta", () => {
  assert.equal(countSiteEvents([ev("published", null, -200)], NOW), 0)
  assert.equal(countSiteEvents([ev("published", null, -10)], NOW), 1)
  assert.equal(countSiteEvents([ev("published", null)], NOW), 1)
})

test("acepta fechas como texto ISO y lista vacía", () => {
  assert.equal(countSiteEvents([{ status: "published", endDate: "2026-11-01T00:00:00Z" }], NOW), 1)
  assert.equal(countSiteEvents([], NOW), 0)
})
