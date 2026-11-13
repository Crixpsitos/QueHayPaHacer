import { test } from "node:test"
import assert from "node:assert/strict"
import { isPlanKind, parsePlanKey, planKey, planSlotError } from "./planItem"

const TODAY = "2026-11-12"

test("clave del plan: ida y vuelta, y rechaza lo que no es evento ni sitio", () => {
  assert.equal(planKey("site", "abc_1"), "site_abc_1")
  assert.deepEqual(parsePlanKey("event_xyz"), { kind: "event", refId: "xyz" })
  assert.deepEqual(parsePlanKey("site_abc_1"), { kind: "site", refId: "abc_1" })
  assert.equal(parsePlanKey("activity_x"), null)
  assert.equal(parsePlanKey("site_"), null)
  assert.equal(parsePlanKey("nada"), null)
  assert.equal(isPlanKind("event"), true)
  assert.equal(isPlanKind("activity"), false)
})
test("sin día todavía: válido; la hora sola no", () => {
  assert.equal(planSlotError({ date: null, time: null }, TODAY), null)
  assert.match(planSlotError({ date: null, time: "15:00" }, TODAY) ?? "", /día/)
})
test("el día va de hoy a hoy + 6", () => {
  assert.equal(planSlotError({ date: "2026-11-12", time: null }, TODAY), null)
  assert.equal(planSlotError({ date: "2026-11-18", time: "09:30" }, TODAY), null)
  assert.match(planSlotError({ date: "2026-11-19", time: null }, TODAY) ?? "", /esta semana/)
  assert.match(planSlotError({ date: "2026-11-11", time: null }, TODAY) ?? "", /esta semana/)
  assert.match(planSlotError({ date: "mañana", time: null }, TODAY) ?? "", /no es válido/)
})
test("la hora debe ser HH:MM", () => {
  assert.match(planSlotError({ date: TODAY, time: "25:00" }, TODAY) ?? "", /hora/)
  assert.match(planSlotError({ date: TODAY, time: "3pm" }, TODAY) ?? "", /hora/)
})
