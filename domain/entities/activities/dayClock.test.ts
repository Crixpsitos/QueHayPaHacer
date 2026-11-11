import { test } from "node:test"
import assert from "node:assert/strict"
import { CLOCK_FIRST_HOUR, CLOCK_LAST_HOUR, hourlyCounts, isActiveAt, hhmmToMinutes, clampClockHour } from "./dayClock"

test("hhmmToMinutes", () => {
  assert.equal(hhmmToMinutes("06:30"), 390)
  assert.equal(hhmmToMinutes(null), null)
  assert.equal(hhmmToMinutes("basura"), null)
})

test("hourlyCounts: una barra por hora 6–22; cuenta por hora de inicio; sin hora no cuenta", () => {
  const c = hourlyCounts([{ hhmm: "06:00" }, { hhmm: "06:45" }, { hhmm: "17:30" }, { hhmm: null }, { hhmm: "23:30" }])
  assert.equal(c.length, CLOCK_LAST_HOUR - CLOCK_FIRST_HOUR + 1)
  assert.equal(c[0], 2)
  assert.equal(c[17 - CLOCK_FIRST_HOUR], 1)
  assert.equal(c.reduce((a, b) => a + b, 0), 3) // 23:30 queda fuera de la escala (se agrupa en la última barra)
})

test("isActiveAt: desde que empieza hasta que termina (1 h si no se sabe cuánto dura)", () => {
  const start = 17 * 60 + 30
  assert.equal(isActiveAt(start, 120, 17 * 60), false)
  assert.equal(isActiveAt(start, 120, 17 * 60 + 30), true)
  assert.equal(isActiveAt(start, 120, 19 * 60 + 29), true)
  assert.equal(isActiveAt(start, 120, 19 * 60 + 30), false)
  assert.equal(isActiveAt(start, null, 18 * 60 + 29), true)
  assert.equal(isActiveAt(start, null, 18 * 60 + 30), false)
})

test("clampClockHour deja la hora dentro de la escala", () => {
  assert.equal(clampClockHour(3), CLOCK_FIRST_HOUR)
  assert.equal(clampClockHour(23), CLOCK_LAST_HOUR)
  assert.equal(clampClockHour(12), 12)
})
