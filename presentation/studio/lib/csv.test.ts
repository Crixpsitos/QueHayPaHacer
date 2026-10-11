import { test } from "node:test"
import assert from "node:assert/strict"
import { escapeCell } from "./csv"

test("escapeCell neutraliza fórmulas y escapa comillas", () => {
  assert.equal(escapeCell("=HYPERLINK(\"x\")"), `"'=HYPERLINK(""x"")"`)
  assert.equal(escapeCell("+57 300"), "'+57 300")
  assert.equal(escapeCell("@cmd"), "'@cmd")
  assert.equal(escapeCell("Ana, Pérez"), '"Ana, Pérez"')
  assert.equal(escapeCell("normal"), "normal")
})
