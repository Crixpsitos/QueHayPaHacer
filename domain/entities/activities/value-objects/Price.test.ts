import { test } from "node:test"
import assert from "node:assert/strict"
import { formatCop, priceFromCop, validateExtras, validatePriceOptions, type Extra, type PriceOption } from "./Price"

const opt = (p: Partial<PriceOption> = {}): PriceOption => ({ label: "Salida completa", amountCop: 40000, unit: "persona", includes: ["Almuerzo"], ...p })
const extra = (p: Partial<Extra> = {}): Extra => ({ label: "Con agua", amountCop: 3000, unit: "persona", ...p })

test("una opción válida pasa y 0 es gratis", () => {
  assert.equal(validatePriceOptions([opt()]), null)
  assert.equal(validatePriceOptions([opt({ amountCop: 0, includes: [] })]), null)
})

test("exige entre 1 y 8 opciones", () => {
  assert.match(validatePriceOptions([])!, /al menos una/i)
  assert.match(validatePriceOptions(Array.from({ length: 9 }, () => opt()))!, /máximo 8/i)
})

test("monto: entero, no negativo y con tope", () => {
  assert.match(validatePriceOptions([opt({ amountCop: -1 })])!, /precio/i)
  assert.match(validatePriceOptions([opt({ amountCop: 10.5 })])!, /precio/i)
  assert.match(validatePriceOptions([opt({ amountCop: 100_000_001 })])!, /precio/i)
})

test("nombre, unidad, includes y nota", () => {
  assert.match(validatePriceOptions([opt({ label: "  " })])!, /nombre/i)
  assert.match(validatePriceOptions([opt({ label: "x".repeat(41) })])!, /nombre/i)
  assert.match(validatePriceOptions([opt({ unit: "kilo" as "hora" })])!, /unidad/i)
  assert.match(validatePriceOptions([opt({ includes: Array.from({ length: 7 }, () => "a") })])!, /incluye/i)
  assert.match(validatePriceOptions([opt({ includes: ["x".repeat(41)] })])!, /incluye/i)
  assert.match(validatePriceOptions([opt({ note: "x".repeat(121) })])!, /nota/i)
})

test("extras: 0 a 10, sin 'hora' como unidad", () => {
  assert.equal(validateExtras([]), null)
  assert.equal(validateExtras([extra()]), null)
  assert.match(validateExtras(Array.from({ length: 11 }, () => extra()))!, /máximo 10/i)
  assert.match(validateExtras([extra({ unit: "hora" as "persona" })])!, /unidad/i)
  assert.match(validateExtras([extra({ amountCop: -5 })])!, /precio/i)
})

test("priceFromCop es el mínimo y los extras no cuentan", () => {
  assert.equal(priceFromCop([opt({ amountCop: 40000 }), opt({ amountCop: 25000 }), opt({ amountCop: 60000 })]), 25000)
  assert.equal(priceFromCop([opt({ amountCop: 0 }), opt({ amountCop: 10000 })]), 0)
  assert.equal(priceFromCop([]), 0)
})

test("formatCop pone puntos de miles", () => {
  assert.equal(formatCop(0), "$0")
  assert.equal(formatCop(900), "$900")
  assert.equal(formatCop(40000), "$40.000")
  assert.equal(formatCop(1250000), "$1.250.000")
})
