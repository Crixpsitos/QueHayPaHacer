import { test } from "node:test"
import assert from "node:assert/strict"
import { bogotaDayRange, bogotaDayLabel } from "./bogotaDay"

test("23:30 en Bogotá sigue siendo el mismo día (UTC ya es el día siguiente)", () => {
  const { start, end } = bogotaDayRange(new Date("2026-11-09T04:30:00Z")) // 23:30 del dom 8 nov en Bogotá
  assert.equal(start.toISOString(), "2026-11-08T05:00:00.000Z")
  assert.equal(end.toISOString(), "2026-11-09T04:59:59.999Z")
})

test("00:30 en Bogotá ya es el día nuevo", () => {
  const { start } = bogotaDayRange(new Date("2026-11-09T05:30:00Z")) // 00:30 del lun 9 nov
  assert.equal(start.toISOString(), "2026-11-09T05:00:00.000Z")
})

test("etiqueta en español con día de la semana, en hora de Bogotá", () => {
  assert.equal(bogotaDayLabel(new Date("2026-11-09T04:30:00Z")), "domingo 8 de noviembre")
  assert.equal(bogotaDayLabel(new Date("2026-11-05T22:00:00Z")), "jueves 5 de noviembre")
})
