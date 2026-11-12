import { test } from "node:test"
import assert from "node:assert/strict"
import { dailyActivityPicks } from "./dailyPicks"

const items = Array.from({ length: 20 }, (_, i) => ({ id: `a${i}`, host: `h${i % 4}` })) // 4 anfitriones, 5 actividades cada uno

test("misma entrada = mismo resultado (dos cargas el mismo día)", () => {
  assert.deepEqual(dailyActivityPicks(items, "2026-11-10"), dailyActivityPicks(items, "2026-11-10"))
})
test("otro día = otro conjunto u orden", () => {
  assert.notDeepEqual(dailyActivityPicks(items, "2026-11-10"), dailyActivityPicks(items, "2026-11-11"))
})
test("máximo 8 y como mucho 2 por anfitrión", () => {
  const picks = dailyActivityPicks(items, "2026-11-10")
  assert.equal(picks.length, 8)
  const per = new Map<string, number>()
  for (const id of picks) { const h = items.find((x) => x.id === id)!.host; per.set(h, (per.get(h) ?? 0) + 1) }
  assert.ok([...per.values()].every((n) => n <= 2))
})
test("pocas actividades: salen todas; ninguna: vacío; no repite", () => {
  assert.deepEqual(dailyActivityPicks([{ id: "x", host: "h" }], "2026-11-10"), ["x"])
  assert.deepEqual(dailyActivityPicks([], "2026-11-10"), [])
  const picks = dailyActivityPicks(items, "2026-11-10", { limit: 20, maxPerHost: 20 })
  assert.equal(new Set(picks).size, picks.length)
})
test("no depende del orden de entrada", () => {
  assert.deepEqual(dailyActivityPicks(items, "2026-11-10"), dailyActivityPicks([...items].reverse(), "2026-11-10"))
})
