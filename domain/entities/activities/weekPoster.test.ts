import { test } from "node:test"
import assert from "node:assert/strict"
import { planWeekPoster, anytimeIdsOf } from "./weekPoster"
import type { WeekDay } from "./weekPlan"

const day = (date: string, blocks: { id: string; startMin: number | null }[]): WeekDay => ({ date, blocks: blocks.map((b) => ({ id: b.id, title: `T-${b.id}`, startMin: b.startMin, endMin: b.startMin === null ? null : b.startMin + 60, conflictsWith: [] })) })
const dates = ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18"]
const opts = { today: "2026-11-12", price: () => "Gratis" }
const week = (per: number): WeekDay[] => dates.map((d, i) => day(d, Array.from({ length: i < 2 ? per : 0 }, (_, k) => ({ id: `${i}-${k}`, startMin: 600 + k * 120 }))))

test("hasta 4 planes: cómodo, una fila cada uno, sin «más»", () => {
  const p = planWeekPoster(week(2), opts)
  assert.equal(p.tier, "comfortable"); assert.equal(p.rows.length, 4); assert.equal(p.more, 0)
  assert.equal(p.rows[0].day, "Hoy"); assert.equal(p.rows[2].day, "Vie 13")
})
test("5 planes: compacto; más de 5: denso con «+N»", () => {
  const five = dates.map((d, i) => day(d, i === 0 ? Array.from({ length: 5 }, (_, k) => ({ id: `a${k}`, startMin: 600 + k * 90 })) : []))
  const c = planWeekPoster(five, opts)
  assert.equal(c.tier, "compact"); assert.equal(c.rows.length, 5); assert.equal(c.more, 0)
  const d = planWeekPoster(week(6), opts) // 12
  assert.equal(d.tier, "dense"); assert.equal(d.rows.length, 5); assert.equal(d.more, 7)
})
test("lo que se repite sin hora también es un plan: una sola fila al final, «Cuando quieras»", () => {
  const w = dates.map((d, i) => day(d, [{ id: "cine", startMin: null }, ...(i === 0 ? [{ id: "trote", startMin: 1050 }] : [])]))
  assert.deepEqual(anytimeIdsOf(w), ["cine"])
  const p = planWeekPoster(w, opts)
  assert.equal(p.rows.length, 2); assert.equal(p.rows[0].time, "5:30 p. m."); assert.equal(p.rows[1].anytime, true); assert.equal(p.rows[1].title, "T-cine")
  assert.equal(planWeekPoster(w, { ...opts, image: (id) => `/i/${id}` }).rows[1].imageUrl, "/i/cine")
})
test("rango de fechas legible", () => assert.equal(planWeekPoster(week(1), opts).rangeLabel, "12 al 18 de noviembre"))
