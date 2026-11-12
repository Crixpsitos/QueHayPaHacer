import { test } from "node:test"
import assert from "node:assert/strict"
import { editOutcome } from "./editOutcome"

test("evento que sigue publicado: se avisa que se guardó y no se redirige", () => {
  assert.deepEqual(editOutcome("published"), { message: "Cambios guardados.", goTo: null })
})

test("evento que vuelve a revisión: se avisa que no será visible y se lleva a Mis eventos", () => {
  const out = editOutcome("pending")
  assert.equal(out.goTo, "my-events")
  assert.match(out.message, /validación/)
  assert.match(out.message, /no será visible/)
})

test("sin estado conocido (respuesta antigua) se trata como guardado normal", () => {
  assert.deepEqual(editOutcome(undefined), { message: "Cambios guardados.", goTo: null })
})
