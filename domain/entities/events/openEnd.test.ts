import { test } from "node:test"
import assert from "node:assert/strict"
import { endOfBogotaDay, isOpenEnded, resolveEnd } from "./openEnd"

test("el fin por defecto es 11:59:59.999 pm de Bogotá del día de inicio", () => {
  // 9 pm Bogotá del sábado 28-nov = 02:00Z del 29
  assert.equal(endOfBogotaDay("2026-11-29T02:00:00Z").toISOString(), "2026-11-29T04:59:59.999Z")
  // 8 am Bogotá del 28 = 13:00Z
  assert.equal(endOfBogotaDay(new Date("2026-11-28T13:00:00Z")).toISOString(), "2026-11-29T04:59:59.999Z")
})

test("resolveEnd respeta el fin elegido y completa si falta", () => {
  assert.equal(resolveEnd("2026-11-28T13:00:00Z", "2026-11-28T15:00:00Z").toISOString(), "2026-11-28T15:00:00.000Z")
  assert.equal(resolveEnd("2026-11-28T13:00:00Z", null).toISOString(), "2026-11-29T04:59:59.999Z")
  assert.equal(resolveEnd("2026-11-28T13:00:00Z", undefined).toISOString(), "2026-11-29T04:59:59.999Z")
})

test("isOpenEnded reconoce solo el fin por defecto", () => {
  assert.equal(isOpenEnded("2026-11-28T13:00:00Z", "2026-11-29T04:59:59.999Z"), true)
  assert.equal(isOpenEnded("2026-11-28T13:00:00Z", "2026-11-28T15:00:00Z"), false)
})

test("«Todo el día» del formulario (11:59 pm en punto) también cuenta como sin fin", () => {
  assert.equal(isOpenEnded("2026-11-28T13:00:00Z", "2026-11-29T04:59:00.000Z"), true)
  assert.equal(isOpenEnded("2026-11-28T13:00:00Z", "2026-11-29T04:00:00.000Z"), false)
})
