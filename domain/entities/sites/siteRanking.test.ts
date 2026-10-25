import { test } from "node:test"
import assert from "node:assert/strict"
import { COMPLETE_LISTING_BONUS, SITE_SCORE_MAX_EVENTS, SITE_SCORE_WEIGHTS, siteScore } from "./siteRanking"

test("sin interacciones el puntaje es 0, y la ficha completa suma el bono", () => {
  assert.equal(siteScore({ likes: 0, shares: 0, eventCount: 0 }, false), 0)
  assert.equal(siteScore(undefined, undefined), 0)
  assert.equal(siteScore({}, true), COMPLETE_LISTING_BONUS)
})

test("pondera me gusta, compartidos y eventos", () => {
  assert.equal(siteScore({ likes: 2, shares: 1, eventCount: 3 }, false), 2 * 3 + 5 + 3 * 4)
})

test("ignora valores inválidos (negativos, NaN, texto)", () => {
  assert.equal(siteScore({ likes: -5, shares: Number.NaN, eventCount: "x" as unknown as number }, false), 0)
})

test("un sitio completo sin interacciones supera a uno incompleto con 1 me gusta, pero no a uno con 4", () => {
  assert.ok(siteScore({}, true) > siteScore({ likes: 1 }, false))
  assert.ok(siteScore({}, true) < siteScore({ likes: 4 }, false))
})

test("solo cuentan hasta 5 eventos para el puntaje (tope de 20 puntos)", () => {
  assert.equal(SITE_SCORE_MAX_EVENTS, 5)
  assert.equal(siteScore({ eventCount: 5 }, false), 5 * SITE_SCORE_WEIGHTS.event)
  assert.equal(siteScore({ eventCount: 6 }, false), 5 * SITE_SCORE_WEIGHTS.event, "el sexto no suma")
  assert.equal(siteScore({ eventCount: 500 }, false), 20)
  assert.equal(siteScore({ eventCount: 4 }, false), 16, "bajo el tope suma normal")
})
