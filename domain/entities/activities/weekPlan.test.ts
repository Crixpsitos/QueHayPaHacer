import { test } from "node:test"
import assert from "node:assert/strict"
import { buildWeekPlan, weekPlanText } from "./weekPlan"
import type { ActivitySchedule } from "./value-objects/ActivitySchedule"

const weekly = (weekdays: number[], start: string, end?: string): ActivitySchedule => ({ rules: [{ kind: "weekly", weekdays: weekdays as never, start, ...(end ? { end } : {}) }], skipDates: [], requiresReservation: false })
// 2026-11-11 es miércoles (3)
const NOW = new Date("2026-11-11T15:00:00Z") // 10:00 a. m. Bogotá

test("agrupa por día, ordena por hora y devuelve 7 días con o sin planes", () => {
  const w = buildWeekPlan([{ id: "a", title: "Trote", schedule: weekly([3], "17:30", "18:30") }, { id: "b", title: "Lectura", schedule: weekly([3], "08:00", "09:00") }], "2026-11-11", NOW)
  assert.equal(w.length, 7)
  assert.deepEqual(w[0].blocks.map((b) => b.id), ["b", "a"].filter((id) => id === "a")) // «b» ya terminó (8–9 a. m.)
  assert.equal(w[1].blocks.length, 0)
})

test("marca los cruces entre planes del mismo día", () => {
  const w = buildWeekPlan([{ id: "a", title: "Trote", schedule: weekly([3], "17:30", "18:30") }, { id: "b", title: "Lectura", schedule: weekly([3], "18:00", "20:00") }, { id: "c", title: "Cine", schedule: weekly([3], "20:00", "21:00") }], "2026-11-11", NOW)
  const by = Object.fromEntries(w[0].blocks.map((b) => [b.id, b.conflictsWith]))
  assert.deepEqual(by.a, ["b"])
  assert.deepEqual(by.b, ["a"])
  assert.deepEqual(by.c, []) // empieza justo cuando termina otro: no es cruce
})

test("sin hora de fin se asume 1 h; sin hora fija va aparte y nunca cruza", () => {
  const w = buildWeekPlan([{ id: "a", title: "A", schedule: weekly([4], "10:00") }, { id: "b", title: "B", schedule: weekly([4], "10:30") }, { id: "c", title: "C", schedule: { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false } }], "2026-11-12", NOW)
  const thu = w[0]
  assert.deepEqual(thu.blocks.filter((b) => b.startMin !== null).map((b) => b.conflictsWith.length), [1, 1])
  assert.ok(thu.blocks.find((b) => b.id === "c")!.startMin === null && thu.blocks.find((b) => b.id === "c")!.conflictsWith.length === 0)
})

test("texto para WhatsApp: un renglón por plan, solo días con planes", () => {
  const w = buildWeekPlan([{ id: "a", title: "Trote", schedule: weekly([3], "17:30", "18:30") }], "2026-11-11", NOW)
  const t = weekPlanText(w, "Mi semana en Ibagué")
  assert.match(t, /^Mi semana en Ibagué/)
  assert.match(t, /Trote/)
  assert.match(t, /5:30 p\. m\./)
  assert.ok(!/jueves/i.test(t))
})
