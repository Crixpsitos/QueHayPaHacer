import test from "node:test"
import assert from "node:assert/strict"
import { filterRows } from "./rowFilter"

const rows = [{ name: "Ana Pérez", email: "ana@x.co", phone: "+57 300-123 4567" }, { name: "Luis", email: null, phone: "3109998877" }]
test("nombre sin tildes, correo y teléfono parcial", () => {
  assert.equal(filterRows(rows, "perez").length, 1)
  assert.equal(filterRows(rows, "ana@").length, 1)
  assert.equal(filterRows(rows, "123 45").length, 1)
  assert.equal(filterRows(rows, "+57 310").length, 1)
  assert.equal(filterRows(rows, "99").length, 0) // menos de 3 dígitos no filtra por teléfono
  assert.equal(filterRows(rows, "  ").length, 2)
})
