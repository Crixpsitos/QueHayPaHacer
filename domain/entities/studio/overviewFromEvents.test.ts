import test from "node:test"
import assert from "node:assert/strict"
import { overviewFromEvents, type OverviewEventRow } from "./overviewFromEvents"

const b = { startOfPreviousMonth: new Date("2026-10-01T05:00:00Z"), startOfCurrentMonth: new Date("2026-11-01T05:00:00Z"), startOfNextMonth: new Date("2026-12-01T05:00:00Z"), now: new Date("2026-11-13T12:00:00Z") }
const row = (id: string, p: Partial<OverviewEventRow> = {}): OverviewEventRow => ({ id, title: id, status: "published", createdAt: new Date("2026-11-05T12:00:00Z"), endDate: new Date("2026-11-20T12:00:00Z"), registrationType: "internal", views: 0, registrations: 0, likes: 0, shares: 0, score: 0, ...p })
const old = new Date("2026-10-10T12:00:00Z")

test("KPIs: mes actual vs anterior por createdAt; inscripciones sin eventos sin registro; fuera de ventana no cuenta", () => {
  const o = overviewFromEvents([
    row("a", { views: 10, likes: 3, registrations: 4 }),
    row("b", { createdAt: old, views: 5, likes: 1, registrations: 2 }),
    row("c", { registrationType: "none", views: 7, registrations: 9 }),
    row("d", { createdAt: new Date("2026-08-01T00:00:00Z"), views: 99 }),
  ], b)
  assert.equal(o.kpis.totalViews, 17)
  assert.equal(o.kpis.previousMonthViews, 5)
  assert.equal(o.kpis.totalRegistrations, 4)
  assert.equal(o.kpis.previousMonthRegistrations, 2)
  assert.equal(o.kpis.totalLikes, 3)
  assert.equal(Math.round(o.kpis.viewsChangePct), 240)
})

test("activos: publicados que no terminaron (cualquier mes de creación)", () => {
  const o = overviewFromEvents([row("a"), row("b", { endDate: new Date("2026-11-01T00:00:00Z") }), row("c", { status: "draft" }), row("d", { createdAt: new Date("2025-01-01T00:00:00Z") })], b)
  assert.equal(o.kpis.activeEvents, 2)
})

test("conversión: top 10 por vistas y luego sin externos; desempate por id", () => {
  const o = overviewFromEvents([row("x", { views: 5 }), row("a", { views: 5 }), row("e", { views: 50, registrationType: "external" }), row("z", { status: "draft", views: 99 })], b)
  assert.deepEqual(o.viewsVsRegistrations.map((p) => p.eventId), ["a", "x"])
})

test("top 5 y interactividad 6 por score; interactividad solo publicados del rango", () => {
  const rows = Array.from({ length: 8 }, (_, i) => row(`e${i}`, { score: i }))
  rows.push(row("dr", { status: "draft", score: 100 }))
  const o = overviewFromEvents(rows, b)
  assert.equal(o.topEvents.length, 5)
  assert.equal(o.topEvents[0].eventId, "dr")
  assert.equal(o.interactivity.length, 6)
  assert.equal(o.interactivity[0].eventName, "e7")
})
