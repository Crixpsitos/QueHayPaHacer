import { test } from "node:test"
import assert from "node:assert/strict"
import { OFFERINGS_MAX, SPACES_MAX, normalizeOfferings, normalizeSpaces, validateOfferings, validateSpaces, type Offering, type Space } from "./Offerings"

const o = (over: Partial<Offering> = {}): Offering => ({ name: "Helado de mora", description: "Dos bolas", priceCop: 6000, available: true, group: "Helados", ...over })
const sp = (over: Partial<Space> = {}): Space => ({ name: "Sala de lectura", description: "Con mesa grande", capacity: 12, priceCop: 40000, unit: "hora", rules: "No comida", ...over })

test("menú válido; vacío es válido (es opcional)", () => { assert.equal(validateOfferings([o()]), null); assert.equal(validateOfferings([]), null) })
test("menú: máximo 30, nombre 1–60, descripción ≤200, precio entero ≥0", () => {
  assert.notEqual(validateOfferings(Array.from({ length: OFFERINGS_MAX + 1 }, () => o())), null)
  assert.notEqual(validateOfferings([o({ name: " " })]), null)
  assert.notEqual(validateOfferings([o({ name: "n".repeat(61) })]), null)
  assert.notEqual(validateOfferings([o({ description: "d".repeat(201) })]), null)
  assert.notEqual(validateOfferings([o({ priceCop: -1 })]), null)
  assert.notEqual(validateOfferings([o({ priceCop: 10.5 })]), null)
  assert.notEqual(validateOfferings([o({ group: "g".repeat(41) })]), null)
})
test("menú: sin enlaces ni HTML (lo único clicable es el botón)", () => {
  assert.notEqual(validateOfferings([o({ description: "pide en www.tienda.com" })]), null)
  assert.notEqual(validateOfferings([o({ name: "<b>Helado</b>" })]), null)
})
test("espacios: máximo 10, capacidad 1–1000, unidad válida, precio entero", () => {
  assert.equal(validateSpaces([sp()]), null)
  assert.notEqual(validateSpaces(Array.from({ length: SPACES_MAX + 1 }, () => sp())), null)
  assert.notEqual(validateSpaces([sp({ capacity: 0 })]), null)
  assert.notEqual(validateSpaces([sp({ capacity: 1001 })]), null)
  assert.notEqual(validateSpaces([sp({ unit: "mes" as never })]), null)
  assert.notEqual(validateSpaces([sp({ rules: "r".repeat(301) })]), null)
})
test("normalizar: recorta textos, descarta filas sin nombre y respeta el tope", () => {
  assert.deepEqual(normalizeOfferings([{ ...o(), name: "  Café  " }, { ...o(), name: "   " }]).map((x) => x.name), ["Café"])
  assert.deepEqual(normalizeSpaces([{ ...sp(), name: " Sala " }, { ...sp(), name: "" }]).map((x) => x.name), ["Sala"])
})
