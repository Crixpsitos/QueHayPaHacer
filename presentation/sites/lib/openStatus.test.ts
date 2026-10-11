import assert from "node:assert/strict"
import test from "node:test"

import { getSiteOpenStatus } from "./openStatus"

const day = { open: "08:00", close: "20:00", closed: false }
const closed = { open: "", close: "", closed: true }
const schedule = {
  monday: day, tuesday: day, wednesday: day, thursday: day,
  friday: { open: "20:00", close: "02:00", closed: false },
  saturday: day, sunday: closed,
}

test("usa hora de Bogotá, no UTC", () => {
  // 2026-10-13T02:00Z = lunes 21:00 en Bogotá (martes en UTC)
  const s = getSiteOpenStatus(schedule, new Date("2026-10-13T02:00:00Z"))
  assert.equal(s.todayKey, "monday")
  assert.equal(s.isOpen, false)
  // 2026-10-12T14:00Z = lunes 09:00 en Bogotá
  assert.equal(getSiteOpenStatus(schedule, new Date("2026-10-12T14:00:00Z")).isOpen, true)
})

test("cierre pasada la medianoche", () => {
  // viernes 23:30 Bogotá
  assert.equal(getSiteOpenStatus(schedule, new Date("2026-10-17T04:30:00Z")).isOpen, true)
})

test("día cerrado y sin horario", () => {
  const sunday = getSiteOpenStatus(schedule, new Date("2026-10-11T15:00:00Z"))
  assert.equal(sunday.label, "Cerrado hoy")
  assert.equal(getSiteOpenStatus(undefined).label, null)
})

test("tras el cierre muestra la apertura de mañana", () => {
  // 2026-10-11T03:40Z = sábado 22:40 en Bogotá; domingo cerrado
  assert.equal(getSiteOpenStatus(schedule, new Date("2026-10-11T03:40:00Z")).label, "Cerrado")
  // 2026-10-13T02:00Z = lunes 21:00 → martes 08:00
  assert.equal(getSiteOpenStatus(schedule, new Date("2026-10-13T02:00:00Z")).label, "Cerrado · Abre mañana 08:00")
  // lunes 06:00 (antes de abrir) → hoy
  assert.equal(getSiteOpenStatus(schedule, new Date("2026-10-12T11:00:00Z")).label, "Cerrado · Abre 08:00")
})
