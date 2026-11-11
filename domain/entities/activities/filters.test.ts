import { test } from "node:test"
import assert from "node:assert/strict"
import { matchesFilters, parseFilters } from "./filters"
import { makeActivity } from "./activity.fixture"

test("sin filtros todo coincide", () => {
  assert.equal(matchesFilters(makeActivity(), {}), true)
})

test("categoría, tipo y sitio", () => {
  const a = makeActivity({ category: "aire-libre", kind: "site", siteId: "s1" })
  assert.equal(matchesFilters(a, { category: "aire-libre" }), true)
  assert.equal(matchesFilters(a, { category: "en-familia" }), false)
  assert.equal(matchesFilters(a, { kind: "site" }), true)
  assert.equal(matchesFilters(a, { kind: "global" }), false)
  assert.equal(matchesFilters(a, { siteId: "s1" }), true)
  assert.equal(matchesFilters(a, { siteId: "s2" }), false)
  assert.equal(matchesFilters(a, { category: "aire-libre", kind: "site", siteId: "s1" }), true)
})

test("parseFilters descarta valores desconocidos y limpia la entrada de la URL", () => {
  assert.deepEqual(parseFilters({ categoria: "aire-libre", tipo: "sitio", sitio: "nebraska" }), { category: "aire-libre", kind: "site", siteSlug: "nebraska" })
  assert.deepEqual(parseFilters({ categoria: "no-existe", tipo: "raro", sitio: "x".repeat(200) }), {})
  assert.deepEqual(parseFilters({ tipo: "global" }), { kind: "global" })
  assert.deepEqual(parseFilters({ categoria: ["aire-libre", "otros"] }), {}) // parámetro repetido: se ignora
  assert.deepEqual(parseFilters({}), {})
})
