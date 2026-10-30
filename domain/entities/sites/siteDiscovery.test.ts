import assert from "node:assert/strict"
import test from "node:test"

import { pickDiscoverIds } from "./siteDiscovery"

test("excluye los ids que ya están en populares", () => {
  const out = pickDiscoverIds(["a", "b", "c", "d"], 4, ["a", "b"])
  assert.deepEqual([...out].sort(), ["c", "d"])
})

test("si todo está excluido devuelve vacío (la sección se oculta)", () => {
  assert.deepEqual(pickDiscoverIds(["a", "b"], 4, ["a", "b"]), [])
})

test("respeta el límite y no repite", () => {
  const out = pickDiscoverIds(["a", "b", "c", "d", "e"], 3)
  assert.equal(out.length, 3)
  assert.equal(new Set(out).size, 3)
})

test("mezcla con el azar inyectado (determinista)", () => {
  assert.deepEqual(pickDiscoverIds(["a", "b", "c"], 3, [], () => 0), ["b", "c", "a"])
})

test("no modifica la lista de entrada", () => {
  const ids = ["a", "b", "c"]
  pickDiscoverIds(ids, 2, [], () => 0)
  assert.deepEqual(ids, ["a", "b", "c"])
})
