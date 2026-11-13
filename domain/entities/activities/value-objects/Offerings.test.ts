import { test } from "node:test"
import assert from "node:assert/strict"
import { SPACES_MAX, normalizeSpaces, validateSpaces, type Space } from "./Offerings"

const sp = (over: Partial<Space> = {}): Space => ({ name: "Sala de lectura", description: "Con mesa grande", capacity: 12, priceCop: 40000, unit: "hora", rules: "No comida", ...over })

test("espacios: máximo 10, capacidad 1–1000, unidad válida, precio entero", () => {
  assert.equal(validateSpaces([sp()]), null)
  assert.notEqual(validateSpaces(Array.from({ length: SPACES_MAX + 1 }, () => sp())), null)
  assert.notEqual(validateSpaces([sp({ capacity: 0 })]), null)
  assert.notEqual(validateSpaces([sp({ capacity: 1001 })]), null)
  assert.notEqual(validateSpaces([sp({ unit: "mes" as never })]), null)
  assert.notEqual(validateSpaces([sp({ rules: "r".repeat(301) })]), null)
})
test("normalizar espacios: recorta textos y descarta filas sin nombre", () => {
  assert.deepEqual(normalizeSpaces([{ ...sp(), name: " Sala " }, { ...sp(), name: "" }]).map((x) => x.name), ["Sala"])
})
