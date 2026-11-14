import { test } from "node:test"
import assert from "node:assert/strict"
import { inRange, momentMode, momentRanges, monthBuckets, overlapsRange, upcomingByDay } from "./moments"

// jueves 12-nov-2026, 3 pm en Bogotá
const NOW = new Date("2026-11-12T20:00:00Z")
const at = (iso: string, h = 19) => Date.parse(`${iso}T00:00:00Z`) + (h + 5) * 3_600_000 // hora de Bogotá (UTC-5)
const ev = (id: string, day: string, endDay = day) => ({ id, startsAt: at(day), endsAt: at(endDay, 22) })

test("rangos de las pestañas desde un jueves", () => {
  const r = momentRanges(NOW)
  assert.deepEqual(r.hoy, { from: "2026-11-12", to: "2026-11-12" })
  assert.deepEqual(r.manana, { from: "2026-11-13", to: "2026-11-13" })
  assert.deepEqual(r.finde, { from: "2026-11-13", to: "2026-11-15" })
  assert.deepEqual(r.semana, { from: "2026-11-12", to: "2026-11-18" })
})

test("un evento de varios días cuenta en cada día; uno a las 11 pm de Bogotá no se corre al día siguiente", () => {
  const fest = ev("fest", "2026-11-14", "2026-11-15")
  assert.ok(overlapsRange(fest, { from: "2026-11-15", to: "2026-11-15" }))
  assert.ok(!overlapsRange(fest, { from: "2026-11-16", to: "2026-11-16" }))
  const late = { id: "late", startsAt: Date.parse("2026-11-13T04:30:00Z"), endsAt: Date.parse("2026-11-13T07:00:00Z") } // 11:30 pm del 12 en Bogotá
  assert.ok(overlapsRange(late, { from: "2026-11-12", to: "2026-11-12" }))
})

test("inRange ordena por hora de inicio", () => {
  const a = { id: "a", startsAt: at("2026-11-12", 21), endsAt: at("2026-11-12", 23) }
  const b = { id: "b", startsAt: at("2026-11-12", 18), endsAt: at("2026-11-12", 20) }
  assert.deepEqual(inRange([a, b], { from: "2026-11-12", to: "2026-11-12" }).map((x) => x.id), ["b", "a"])
})

test("lo que viene: empieza mañana, salta días vacíos y corta en 3 días", () => {
  const items = [ev("hoy", "2026-11-12"), ev("v", "2026-11-13"), ev("s1", "2026-11-14"), ev("s2", "2026-11-14"), ev("l", "2026-11-17"), ev("m", "2026-11-20")]
  const days = upcomingByDay(items, NOW, 3)
  assert.deepEqual(days.map((d) => d.date), ["2026-11-13", "2026-11-14", "2026-11-17"])
  assert.equal(days[1].items.length, 2)
})

test("meses siguientes: cuenta desde después del último día mostrado", () => {
  const items = [ev("a", "2026-11-17"), ev("b", "2026-11-25"), ev("c", "2026-12-05"), ev("d", "2026-12-06"), ev("e", "2027-01-10")]
  assert.deepEqual(monthBuckets(items, NOW, "2026-11-17"), [
    { month: "2026-11", count: 1 },
    { month: "2026-12", count: 2 },
    { month: "2027-01", count: 1 },
  ])
})

test("modo según cuántos eventos hay", () => {
  assert.deepEqual([0, 1, 3, 4, 9].map(momentMode), ["empty", "fill", "fill", "full", "full"])
})
