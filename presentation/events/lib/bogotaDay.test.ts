import { test } from "node:test"
import assert from "node:assert/strict"
import { bogotaDayRange, bogotaDayLabel, overlapsWindow } from "./bogotaDay"

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

test("overlapsWindow: una sesión cuenta si cruza la ventana, no si ya terminó o empieza después", () => {
  const from = new Date("2026-11-08T15:00:00Z")
  const to = new Date("2026-11-09T04:59:59.999Z")
  assert.equal(overlapsWindow(new Date("2026-11-08T20:00:00Z"), new Date("2026-11-08T23:00:00Z"), from, to), true)
  assert.equal(overlapsWindow(new Date("2026-11-08T10:00:00Z"), new Date("2026-11-08T14:00:00Z"), from, to), false) // ya terminó
  assert.equal(overlapsWindow(new Date("2026-11-09T05:00:00Z"), new Date("2026-11-09T08:00:00Z"), from, to), false) // mañana
  assert.equal(overlapsWindow(new Date("2026-11-01T00:00:00Z"), new Date("2026-11-30T00:00:00Z"), from, to), true) // abarca hoy
})
