import { test } from "node:test"
import assert from "node:assert/strict"
import { chooseHomeBlock, HOME_MIN_TODAY } from "./homeBlock"

const mk = (n: number, host = (i: number) => `h${i}`) => Array.from({ length: n }, (_, i) => ({ id: `a${i}`, host: host(i) }))

test("con suficientes actividades hoy, el bloque es de hoy", () => {
  const r = chooseHomeBlock(mk(HOME_MIN_TODAY), mk(10), "2026-11-11")
  assert.equal(r.mode, "today")
  assert.equal(r.ids.length, HOME_MIN_TODAY)
})
test("con pocas hoy (1 o 2) cambia a 'esta semana'", () => {
  const r = chooseHomeBlock(mk(2), mk(6), "2026-11-11")
  assert.equal(r.mode, "week")
  assert.equal(r.ids.length, 6)
})
test("sin nada hoy ni esta semana: vacío (el bloque no se dibuja)", () => {
  assert.deepEqual(chooseHomeBlock([], [], "2026-11-11"), { mode: "week", ids: [] })
})
test("mantiene el orden de entrada (por hora) y respeta máximo 8 y 2 por anfitrión", () => {
  const r = chooseHomeBlock(mk(20, (i) => `h${i % 3}`), [], "2026-11-11")
  assert.ok(r.ids.length <= 8)
  const sorted = [...r.ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
  assert.deepEqual(r.ids, sorted)
})
