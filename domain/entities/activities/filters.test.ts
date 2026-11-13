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

import { priceFromCop } from "./value-objects/Price"
const NOW = new Date("2026-11-10T15:00:00Z") // martes 10; el fixture sale los domingos

test("cuándo: el domingo aparece en 'este fin de semana' y en 'esta semana', no en 'hoy' (martes)", () => {
  const a = makeActivity()
  assert.equal(matchesFilters(a, { when: "este-fin-de-semana" }, NOW), true)
  assert.equal(matchesFilters(a, { when: "esta-semana" }, NOW), true)
  assert.equal(matchesFilters(a, { when: "hoy" }, NOW), false)
})
test("presupuesto y con quién", () => {
  const a = makeActivity({ priceOptions: [{ label: "x", amountCop: 40000, unit: "persona", includes: [] }], companions: ["pareja", "amigos"] })
  assert.equal(priceFromCop(a.priceOptions), 40000)
  assert.equal(matchesFilters(a, { budget: "hasta-50000" }), true)
  assert.equal(matchesFilters(a, { budget: "gratis" }), false)
  assert.equal(matchesFilters(a, { companion: "pareja" }), true)
  assert.equal(matchesFilters(a, { companion: "familia" }), false)
})
test("parseFilters: cuando, presupuesto y con", () => {
  assert.deepEqual(parseFilters({ cuando: "hoy", presupuesto: "gratis", con: "familia" }), { when: "hoy", budget: "gratis", companion: "familia" })
  assert.deepEqual(parseFilters({ cuando: "ayer", presupuesto: "caro", con: "extraterrestres" }), {})
})

test("filtro «Promos hoy»: solo actividades que una promoción vigente de su carta eligió, y de categoría que admite promociones", () => {
  const now = new Date("2026-11-11T20:00:00Z")
  const ids = ["a1"]
  const mk = (id: string, category: string) => makeActivity({ id, category } as never)
  assert.equal(matchesFilters(mk("a1", "comida-y-bebida"), { promo: true, promoActivityIds: ids }, now), true)
  assert.equal(matchesFilters(mk("a2", "comida-y-bebida"), { promo: true, promoActivityIds: ids }, now), false)
  assert.equal(matchesFilters(mk("a1", "voluntariado-y-comunidad"), { promo: true, promoActivityIds: ids }, now), false)
  assert.equal(matchesFilters(mk("a1", "comida-y-bebida"), { promo: true }, now), false)
  assert.equal(matchesFilters(mk("a2", "comida-y-bebida"), {}, now), true)
})
