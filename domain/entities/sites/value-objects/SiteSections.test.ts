import { test } from "node:test"
import assert from "node:assert/strict"
import { addSection, moveSection, removeSection, updateSection, normalizeSections, SECTION_TITLE_MAX, SECTION_BODY_MAX, SECTIONS_MAX, SECTIONS_TOTAL_MAX } from "./SiteSections"

test("sin dato o basura queda vacío", () => {
  assert.deepEqual(normalizeSections(undefined), [])
  assert.deepEqual(normalizeSections("x"), [])
  assert.deepEqual(normalizeSections([1, null, "a", { title: 3, body: 4 }]), [])
})

test("recorta espacios y descarta secciones sin título o sin cuerpo", () => {
  assert.deepEqual(
    normalizeSections([
      { title: "  Cómo llegar ", body: "  Ruta 48  " },
      { title: "", body: "huérfano" },
      { title: "Sin cuerpo", body: "   " },
    ]),
    [{ title: "Cómo llegar", body: "Ruta 48" }],
  )
})

test("respeta límites de título, cuerpo y cantidad", () => {
  const [s] = normalizeSections([{ title: "t".repeat(200), body: "b".repeat(9000) }])
  assert.equal(s.title.length, SECTION_TITLE_MAX)
  assert.equal(s.body.length, SECTION_BODY_MAX)
  const many = Array.from({ length: SECTIONS_MAX + 5 }, (_, i) => ({ title: `T${i}`, body: "x" }))
  assert.equal(normalizeSections(many).length, SECTIONS_MAX)
})

test("el total de caracteres no supera el tope (descarta lo que ya no cabe)", () => {
  const big = Array.from({ length: SECTIONS_MAX }, (_, i) => ({ title: `T${i}`, body: "x".repeat(SECTION_BODY_MAX) }))
  const out = normalizeSections(big)
  assert.ok(out.reduce((n, s) => n + s.title.length + s.body.length, 0) <= SECTIONS_TOTAL_MAX)
})

test("addSection agrega una vacía al final y respeta el tope", () => {
  assert.deepEqual(addSection([]), [{ title: "", body: "" }])
  const full = Array.from({ length: SECTIONS_MAX }, (_, i) => ({ title: `T${i}`, body: "x" }))
  assert.equal(addSection(full).length, SECTIONS_MAX)
})

test("updateSection cambia solo la sección indicada, sin recortar mientras se escribe", () => {
  const list = [{ title: "A", body: "1" }, { title: "B", body: "2" }]
  assert.deepEqual(updateSection(list, 1, { title: "B " }), [{ title: "A", body: "1" }, { title: "B ", body: "2" }])
  assert.deepEqual(updateSection(list, 5, { title: "x" }), list)
})

test("removeSection quita por índice", () => {
  assert.deepEqual(removeSection([{ title: "A", body: "1" }, { title: "B", body: "2" }], 0), [{ title: "B", body: "2" }])
})

test("moveSection sube y baja; en los bordes no hace nada", () => {
  const l = [{ title: "A", body: "1" }, { title: "B", body: "2" }, { title: "C", body: "3" }]
  assert.deepEqual(moveSection(l, 1, -1).map((s) => s.title), ["B", "A", "C"])
  assert.deepEqual(moveSection(l, 1, 1).map((s) => s.title), ["A", "C", "B"])
  assert.deepEqual(moveSection(l, 0, -1).map((s) => s.title), ["A", "B", "C"])
  assert.deepEqual(moveSection(l, 2, 1).map((s) => s.title), ["A", "B", "C"])
})
