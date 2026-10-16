import { test } from "node:test"
import assert from "node:assert/strict"
import { hasRecommendations, normalizeRecommendations, SITE_TIP_OPTIONS, TIP_NOTE_MAX } from "./SiteRecommendations"

test("sin dato o basura queda vacío", () => {
  assert.deepEqual(normalizeRecommendations(undefined), { tips: [] })
  assert.deepEqual(normalizeRecommendations("x"), { tips: [] })
  assert.deepEqual(normalizeRecommendations({ tips: "kids", note: 5 }), { tips: [] })
})

test("descarta ids desconocidos y duplicados", () => {
  assert.deepEqual(normalizeRecommendations({ tips: ["kids", "nope", "kids", 3, "parking"] }), { tips: ["parking", "kids"] })
})

test("recorta y limpia la nota", () => {
  assert.deepEqual(normalizeRecommendations({ tips: [], note: "  Entrada por la 5  " }), { tips: [], note: "Entrada por la 5" })
  assert.deepEqual(normalizeRecommendations({ tips: [], note: "   " }), { tips: [] })
  assert.equal(normalizeRecommendations({ tips: [], note: "x".repeat(500) }).note?.length, TIP_NOTE_MAX)
})

test("el catálogo tiene 10 opciones únicas y hasRecommendations distingue vacío", () => {
  assert.equal(new Set(SITE_TIP_OPTIONS.map((t) => t.id)).size, 10)
  assert.equal(hasRecommendations(undefined), false)
  assert.equal(hasRecommendations({ tips: [] }), false)
  assert.equal(hasRecommendations({ tips: ["kids"] }), true)
  assert.equal(hasRecommendations({ tips: [], note: "hola" }), true)
})
