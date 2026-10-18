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

// ── Festivos ────────────────────────────────────────────────────────────────
// 2026-10-12 es lunes y festivo (Día de la Raza). 09:00 Bogotá = 14:00Z.
const holidays = { "2026-10-12": "Día de la Raza", "2026-10-14": "Festivo de prueba" }
const mondayMorning = new Date("2026-10-12T14:00:00Z")

test("festivo sin política: usa el horario normal y avisa que hay que confirmar", () => {
  const s = getSiteOpenStatus(schedule, mondayMorning, { holidays })
  assert.equal(s.isOpen, true)
  assert.deepEqual(s.holiday, { name: "Día de la Raza", policy: null })
})

test("festivo: 'misma política' abre normal", () => {
  const s = getSiteOpenStatus(schedule, mondayMorning, { holidays, policy: { holidays: { policy: "same" } } })
  assert.equal(s.isOpen, true)
  assert.equal(s.holiday?.policy, "same")
})

test("festivo: cierra", () => {
  const s = getSiteOpenStatus(schedule, mondayMorning, { holidays, policy: { holidays: { policy: "closed" } } })
  assert.equal(s.isOpen, false)
  assert.equal(s.label, "Cerrado hoy · Festivo")
  assert.equal(s.todayHours, null)
})

test("festivo: horario especial", () => {
  const policy = { holidays: { policy: "custom" as const, open: "10:00", close: "14:00" } }
  assert.equal(getSiteOpenStatus(schedule, mondayMorning, { holidays, policy }).isOpen, false) // 09:00, aún no abre
  const noon = getSiteOpenStatus(schedule, new Date("2026-10-12T17:00:00Z"), { holidays, policy }) // 12:00
  assert.equal(noon.isOpen, true)
  assert.equal(noon.label, "Abierto · Cierra 14:00")
  assert.equal(noon.todayHours, "10:00 – 14:00")
})

test("la política de festivos no afecta a un día que no es festivo", () => {
  const sat = new Date("2026-10-10T15:00:00Z") // sábado 10:00
  assert.equal(getSiteOpenStatus(schedule, sat, { holidays, policy: { holidays: { policy: "closed" } } }).isOpen, true)
})

test("mañana festivo cerrado: no promete abrir mañana", () => {
  // lunes 13 21:00 Bogotá; mañana martes 14 es "festivo" que cierra
  const eve = new Date("2026-10-14T02:00:00Z")
  const ctx = { holidays, policy: { holidays: { policy: "closed" as const } } }
  assert.equal(getSiteOpenStatus(schedule, eve, ctx).label, "Cerrado")
  assert.equal(getSiteOpenStatus(schedule, eve, { holidays }).label, "Cerrado · Abre mañana 08:00")
})
