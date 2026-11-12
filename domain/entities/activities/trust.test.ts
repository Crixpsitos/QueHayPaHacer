import { test } from "node:test"
import assert from "node:assert/strict"
import { isTrustedHost, needsReReview, TRUST_MIN_APPROVED } from "./trust"
import { makeActivity, makeImage } from "./activity.fixture"

const NOW = Date.parse("2026-11-10T12:00:00Z")

test("3 aprobadas y sin sanciones es de confianza", () => {
  assert.equal(TRUST_MIN_APPROVED, 3)
  assert.equal(isTrustedHost({ approvedCount: 3, activeSanctions: 0, suspendedUntil: null }, NOW), true)
  assert.equal(isTrustedHost({ approvedCount: 2, activeSanctions: 0, suspendedUntil: null }, NOW), false)
})

test("una sanción vigente o una suspensión activa quitan la confianza", () => {
  assert.equal(isTrustedHost({ approvedCount: 9, activeSanctions: 1, suspendedUntil: null }, NOW), false)
  assert.equal(isTrustedHost({ approvedCount: 9, activeSanctions: 0, suspendedUntil: NOW + 1000 }, NOW), false)
  assert.equal(isTrustedHost({ approvedCount: 9, activeSanctions: 0, suspendedUntil: NOW - 1000 }, NOW), true)
})

test("sin confianza: cambiar título, descripción o fotos reabre revisión", () => {
  const prev = makeActivity()
  assert.equal(needsReReview(prev, makeActivity({ title: "Otro título" }), false), true)
  assert.equal(needsReReview(prev, makeActivity({ description: "Una descripción completamente distinta para esta salida." }), false), true)
  const nueva = makeImage("m2", true)
  assert.equal(needsReReview(prev, makeActivity({ media: [nueva] }), false), true)
})

test("cambios de horario, precio o espacios en blanco no reabren revisión", () => {
  const prev = makeActivity()
  assert.equal(needsReReview(prev, makeActivity({ title: "  Senderismo los domingos  ", priceOptions: [] }), false), false)
  assert.equal(needsReReview(prev, makeActivity(), false), false)
})

test("una cuenta de confianza nunca reabre revisión", () => {
  assert.equal(needsReReview(makeActivity(), makeActivity({ title: "Otro" }), true), false)
})
