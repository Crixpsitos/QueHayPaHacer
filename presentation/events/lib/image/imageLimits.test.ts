import { test } from "node:test"
import assert from "node:assert/strict"
import { meetsMinResolution, MIN_IMAGE, RECOMMENDED_IMAGE, minResolutionText } from "./imageLimits"

test("el mínimo es 1280×720 y lo recomendado 1920×1080 (una sola fuente para evento y sesión)", () => {
  assert.deepEqual(MIN_IMAGE, { width: 1280, height: 720 })
  assert.deepEqual(RECOMMENDED_IMAGE, { width: 1920, height: 1080 })
})

test("acepta exactamente el mínimo y lo recomendado; rechaza por debajo en cualquier lado", () => {
  assert.equal(meetsMinResolution(1280, 720), true)
  assert.equal(meetsMinResolution(1920, 1080), true)
  assert.equal(meetsMinResolution(1279, 720), false)
  assert.equal(meetsMinResolution(1280, 719), false)
  assert.equal(meetsMinResolution(1600, 600), false)
})

test("textos con los mismos números", () => {
  assert.equal(minResolutionText(), "1280×720 px")
})
