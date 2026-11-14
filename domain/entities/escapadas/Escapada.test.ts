import { test } from "node:test"
import assert from "node:assert/strict"
import { farLabel } from "./Escapada"

test("etiqueta de distancia", () => {
  assert.deepEqual([40, 60, 90, 150].map(farLabel), ["A 40 min", "A 1 h", "A 1 h 30", "A 2 h 30"])
})
