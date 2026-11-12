import { test } from "node:test"
import assert from "node:assert/strict"
import { pickFeatured } from "./featured"

const NOW = new Date("2026-11-12T15:00:00Z")
const h = (n: number) => NOW.getTime() + n * 3_600_000
const c = (id: string, hasPhoto: boolean, nextAt: number | null, host = id) => ({ id, host, hasPhoto, nextAt })

test("sin actividades no hay destacado", () => assert.equal(pickFeatured([], NOW, "2026-11-12"), null))
test("prefiere lo que sale pronto y tiene foto", () => {
  const items = [c("sinfoto", false, h(5)), c("lejos", true, h(24 * 20)), c("ideal", true, h(30))]
  assert.equal(pickFeatured(items, NOW, "2026-11-12"), "ideal")
})
test("sin foto cercana: lo que sale pronto; sin nada cercano: con foto; si no, cualquiera", () => {
  assert.equal(pickFeatured([c("a", false, h(5)), c("b", true, h(24 * 30))], NOW, "d"), "a")
  assert.equal(pickFeatured([c("a", false, null), c("b", true, h(24 * 30))], NOW, "d"), "b")
  assert.equal(pickFeatured([c("a", false, null)], NOW, "d"), "a")
})
test("es estable en el día y rota entre días", () => {
  const items = Array.from({ length: 6 }, (_, i) => c(`x${i}`, true, h(10 + i)))
  assert.equal(pickFeatured(items, NOW, "2026-11-12"), pickFeatured([...items].reverse(), NOW, "2026-11-12"))
  const seen = new Set(["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"].map((d) => pickFeatured(items, NOW, d)))
  assert.ok(seen.size > 1)
})
