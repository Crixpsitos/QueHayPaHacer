import { test } from "node:test"
import assert from "node:assert/strict"
import { addFact, FACTS_MAX, FACT_ICON_IDS, FACT_LABEL_MAX, FACT_VALUE_MAX, normalizeFacts } from "./SiteFacts"

test("sin dato o basura queda vacío", () => {
  assert.deepEqual(normalizeFacts(undefined), [])
  assert.deepEqual(normalizeFacts("x"), [])
  assert.deepEqual(normalizeFacts([1, null, { label: 3, value: 4 }]), [])
})

test("recorta, descarta sin etiqueta o sin valor, y fija icono válido (si no, 'other')", () => {
  assert.deepEqual(
    normalizeFacts([
      { icon: "price", label: "  Entrada ", value: " $20.000 " },
      { icon: "nope", label: "Duración", value: "60 min" },
      { icon: "time", label: "", value: "x" },
      { icon: "time", label: "Sin valor", value: "  " },
    ]),
    [
      { icon: "price", label: "Entrada", value: "$20.000" },
      { icon: "other", label: "Duración", value: "60 min" },
    ],
  )
})

test("límites de largo y de cantidad", () => {
  const [f] = normalizeFacts([{ icon: "price", label: "l".repeat(99), value: "v".repeat(99) }])
  assert.equal(f.label.length, FACT_LABEL_MAX)
  assert.equal(f.value.length, FACT_VALUE_MAX)
  const many = Array.from({ length: FACTS_MAX + 3 }, (_, i) => ({ icon: "other", label: `L${i}`, value: "v" }))
  assert.equal(normalizeFacts(many).length, FACTS_MAX)
})

test("addFact agrega vacía con icono 'other' y respeta el tope; el catálogo incluye 'other'", () => {
  assert.deepEqual(addFact([]), [{ icon: "other", label: "", value: "" }])
  assert.equal(addFact(Array.from({ length: FACTS_MAX }, () => ({ icon: "other" as const, label: "a", value: "b" }))).length, FACTS_MAX)
  assert.ok(FACT_ICON_IDS.includes("other"))
})
