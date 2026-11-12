import { test } from "node:test"
import assert from "node:assert/strict"
import { planWeekPoster, anytimeIdsOf } from "./weekPoster"
import type { WeekDay } from "./weekPlan"

const day = (date: string, blocks: { id: string; startMin: number | null }[]): WeekDay => ({ date, blocks: blocks.map((b) => ({ id: b.id, title: `T-${b.id}`, startMin: b.startMin, endMin: b.startMin === null ? null : b.startMin + 60, conflictsWith: [] })) })
const dates = ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18"]
const opts = { today: "2026-11-12", price: () => "Gratis" }
const week = (per: number): WeekDay[] => dates.map((d, i) => day(d, Array.from({ length: i < 2 ? per : 0 }, (_, k) => ({ id: `${i}-${k}`, startMin: 600 + k * 120 }))))

test("hasta 5 planes: cómodo, una fila cada uno, sin «más»", () => {
  const p = planWeekPoster(week(2), opts)
  assert.equal(p.tier, "comfortable"); assert.equal(p.rows.length, 4); assert.equal(p.more, 0)
  assert.equal(p.rows[0].day, "Hoy"); assert.equal(p.rows[0].showDay, true); assert.equal(p.rows[1].showDay, false); assert.equal(p.rows[2].day, "Vie")
})
test("6 a 8 planes: compacto; más de 8: denso con «+N»", () => {
  assert.equal(planWeekPoster(week(4), opts).tier, "compact") // 8
  const d = planWeekPoster(week(6), opts) // 12
  assert.equal(d.tier, "dense"); assert.equal(d.rows.length, 6); assert.equal(d.more, 6)
})
test("lo que se repite sin hora va aparte, una sola vez, y no cuenta como fila", () => {
  const w = dates.map((d, i) => day(d, [{ id: "cine", startMin: null }, ...(i === 0 ? [{ id: "trote", startMin: 1050 }] : [])]))
  assert.deepEqual(anytimeIdsOf(w), ["cine"])
  const p = planWeekPoster(w, opts)
  assert.equal(p.rows.length, 1); assert.deepEqual(p.anytime, ["T-cine"]); assert.equal(p.rows[0].time, "5:30 p. m.")
})
test("rango de fechas legible", () => assert.equal(planWeekPoster(week(1), opts).rangeLabel, "12 al 18 de noviembre"))
