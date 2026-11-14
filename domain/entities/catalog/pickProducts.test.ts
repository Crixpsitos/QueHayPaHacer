import { test } from "node:test"
import assert from "node:assert/strict"
import { pickProducts } from "./pickProducts"
import type { Product } from "./Product"

const p = (id: string): Product => ({ id, name: id, description: "", priceCop: 1000, unit: "unidad", section: "", photoUrl: "", tags: [], traces: "", discount: null })
const all = [p("a"), p("b"), p("c")]

test("sin elegir (o lista vacía) se muestra toda la carta", () => {
  assert.deepEqual(pickProducts(all, undefined), all)
  assert.deepEqual(pickProducts(all, []), all)
})
test("elegidos: solo esos, en el orden de la carta", () => {
  assert.deepEqual(pickProducts(all, ["c", "a"]).map((x) => x.id), ["a", "c"])
})
test("si los elegidos ya no existen, vuelve a toda la carta", () => {
  assert.deepEqual(pickProducts(all, ["z"]), all)
})
