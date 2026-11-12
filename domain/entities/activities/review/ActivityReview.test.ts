import { test } from "node:test"
import assert from "node:assert/strict"
import { applyReviewToRating, canReview, containsContactInfo, publicAuthorName, ratingSummary, validateReviewInput, REVIEW_BODY_MAX, type ReviewInput } from "./ActivityReview"
import type { ActivityRating } from "../Activity"

const NOW = new Date("2026-11-11T15:00:00Z")
const ok: ReviewInput = { rating: 5, title: "Muy buena", body: "Salimos temprano y el guía conocía todo el camino.", visitedAt: "2026-10", photos: 2, video: 0 }
const empty = (): ActivityRating => ({ count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] })

test("una reseña completa es válida", () => assert.equal(validateReviewInput(ok, NOW), null))

test("rating entero de 1 a 5", () => {
  for (const r of [0, 6, 3.5, NaN]) assert.notEqual(validateReviewInput({ ...ok, rating: r }, NOW), null, String(r))
})

test("texto: vacío o de 10 a 1500; título hasta 80", () => {
  assert.equal(validateReviewInput({ ...ok, body: "" }, NOW), null)
  assert.notEqual(validateReviewInput({ ...ok, body: "corto" }, NOW), null)
  assert.notEqual(validateReviewInput({ ...ok, body: "a".repeat(REVIEW_BODY_MAX + 1) }, NOW), null)
  assert.notEqual(validateReviewInput({ ...ok, title: "t".repeat(81) }, NOW), null)
})

test("rechaza enlaces, correos y teléfonos (en el texto y en el título)", () => {
  for (const t of ["escríbeme a juan@correo.com para más", "mira www.misitio.com y verás", "https://wa.me/573001234567 hablemos", "llámame al 300 123 4567 cuando quieras", "mi whatsapp +57 300-123-4567 gracias", "visita tienda.co ahora mismo"]) {
    assert.equal(containsContactInfo(t), true, t)
    assert.notEqual(validateReviewInput({ ...ok, body: t }, NOW), null, t)
  }
  assert.notEqual(validateReviewInput({ ...ok, title: "llama 3001234567" }, NOW), null)
})

test("no confunde precios, horas ni cantidades con teléfonos", () => {
  for (const t of ["Pagamos $40.000 por persona y valió la pena", "Salimos a las 6:30 y volvimos a las 4:00 p. m.", "Éramos 12 personas, el 15 de noviembre", "Fueron 4.800 metros de altura, 2026 fue un buen año"]) assert.equal(containsContactInfo(t), false, t)
})

test("fecha de visita: no futura y máximo 24 meses atrás", () => {
  assert.equal(validateReviewInput({ ...ok, visitedAt: "2026-11" }, NOW), null) // este mes
  assert.notEqual(validateReviewInput({ ...ok, visitedAt: "2026-12" }, NOW), null)
  assert.equal(validateReviewInput({ ...ok, visitedAt: "2024-11" }, NOW), null) // justo 24 meses
  assert.notEqual(validateReviewInput({ ...ok, visitedAt: "2024-10" }, NOW), null)
  assert.notEqual(validateReviewInput({ ...ok, visitedAt: "ayer" }, NOW), null)
})

test("medios: hasta 3 fotos y 1 video", () => {
  assert.notEqual(validateReviewInput({ ...ok, photos: 4 }, NOW), null)
  assert.notEqual(validateReviewInput({ ...ok, video: 2 }, NOW), null)
})

test("agregados: crear, editar de 5 a 2, borrar y remover dejan los números correctos", () => {
  let r = applyReviewToRating(empty(), { type: "add", rating: 5 })
  r = applyReviewToRating(r, { type: "add", rating: 4 })
  assert.deepEqual([r.count, r.sum, r.avg], [2, 9, 4.5])
  assert.deepEqual(r.dist, [0, 0, 0, 1, 1])
  r = applyReviewToRating(r, { type: "edit", from: 5, to: 2 })
  assert.deepEqual([r.count, r.sum, r.avg], [2, 6, 3])
  assert.deepEqual(r.dist, [0, 1, 0, 1, 0])
  r = applyReviewToRating(r, { type: "remove", rating: 4 })
  assert.deepEqual([r.count, r.sum, r.avg], [1, 2, 2])
  r = applyReviewToRating(r, { type: "remove", rating: 2 })
  assert.deepEqual(r, empty())
})

test("quitar de más no deja números negativos", () => assert.deepEqual(applyReviewToRating(empty(), { type: "remove", rating: 3 }), empty()))
test("no muta el original", () => { const a = empty(); applyReviewToRating(a, { type: "add", rating: 5 }); assert.deepEqual(a, empty()) })

test("ratingSummary: promedio a 1 decimal y porcentajes", () => {
  const s = ratingSummary({ count: 4, sum: 17, avg: 4.25, dist: [0, 0, 1, 1, 2] })
  assert.equal(s.average, "4,3")
  assert.deepEqual(s.percent, [0, 0, 25, 25, 50])
  assert.equal(ratingSummary(empty()).average, null)
})

test("nombre público: primer nombre + inicial; sin apellido, solo el nombre; nunca vacío", () => {
  assert.equal(publicAuthorName("Ana María Pérez Gómez"), "Ana P.")
  assert.equal(publicAuthorName("Juan"), "Juan")
  assert.equal(publicAuthorName("  "), "Anónimo")
  assert.equal(publicAuthorName("ana@correo.com"), "Anónimo")
})

test("quién no puede reseñar: quien publicó la actividad y el dueño del sitio", () => {
  assert.notEqual(canReview({ ownerUid: "u1", siteOwnerUid: "u2" }, "u1"), null)
  assert.notEqual(canReview({ ownerUid: "u1", siteOwnerUid: "u2" }, "u2"), null)
  assert.equal(canReview({ ownerUid: "u1", siteOwnerUid: null }, "u3"), null)
})
