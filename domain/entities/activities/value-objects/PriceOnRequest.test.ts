import { test } from "node:test"
import assert from "node:assert/strict"
import { allOnRequest, priceFromCop, validatePriceOptions, type PriceOption } from "./Price"
import { matchesFilters } from "../filters"
import { makeActivity } from "../activity.fixture"

const consult: PriceOption = { label: "Boleta (depende del día y del formato)", amountCop: 0, unit: "consultar", includes: [] }
const paid: PriceOption = { label: "Entrada", amountCop: 15000, unit: "persona", includes: [] }

test("«a consultar» es válida solo sin valor", () => {
  assert.equal(validatePriceOptions([consult]), null)
  assert.notEqual(validatePriceOptions([{ ...consult, amountCop: 5000 }]), null)
})
test("el precio «desde» ignora las opciones a consultar; si todas lo son, no hay precio", () => {
  assert.equal(priceFromCop([consult, paid]), 15000)
  assert.equal(priceFromCop([consult]), 0)
  assert.equal(allOnRequest([consult]), true)
  assert.equal(allOnRequest([consult, paid]), false)
})
test("una actividad con todo «a consultar» NO aparece como gratis en el filtro de presupuesto", () => {
  const a = makeActivity({ priceOptions: [consult] })
  assert.equal(matchesFilters(a, { budget: "gratis" }), false)
  assert.equal(matchesFilters(a, {}), true)
  assert.equal(matchesFilters(makeActivity({ priceOptions: [{ ...paid, amountCop: 0 }] }), { budget: "gratis" }), true)
})
