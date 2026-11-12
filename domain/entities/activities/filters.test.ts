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

test("filtro «Promos hoy»: solo con una promoción que aplica ahora; vencida o pausada no cuenta", () => {
  const now = new Date("2026-11-11T21:00:00Z") // miércoles 4 p. m. Bogotá
  const promo = { id: "p", title: "Tardes felices", description: "", rule: { kind: "twoForOne" as const }, weekdays: [3], start: "15:00", end: "18:00", validFrom: "2026-11-01", validUntil: "2026-12-01", termsNote: "", paused: false }
  const base = { category: "comida-y-bebida" as const, kind: "site" as const, siteId: "s", schedule: { rules: [{ kind: "always" as const }], skipDates: [], requiresReservation: false }, priceOptions: [], companions: [] }
  assert.equal(matchesFilters({ ...base, promotions: [promo] }, { promo: true }, now), true)
  assert.equal(matchesFilters({ ...base, promotions: [] }, { promo: true }, now), false)
  assert.equal(matchesFilters({ ...base, promotions: [{ ...promo, validUntil: "2026-11-10" }] }, { promo: true }, now), false)
  assert.equal(matchesFilters({ ...base, promotions: [{ ...promo, paused: true }] }, { promo: true }, now), false)
  assert.equal(matchesFilters({ ...base, promotions: [promo] }, {}, now), true)
})
