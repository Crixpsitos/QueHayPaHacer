import { test } from "node:test"
import assert from "node:assert/strict"
import { buildWeekendDigest, digestText, DIGEST_MAX_PER_DAY, type DigestActivity, type DigestEvent } from "./weeklyDigest"
import type { ActivitySchedule } from "./value-objects/ActivitySchedule"

const weekly = (weekdays: number[], start: string, end?: string): ActivitySchedule => ({ rules: [{ kind: "weekly", weekdays: weekdays as never, start, ...(end ? { end } : {}) }], skipDates: [], requiresReservation: false })
// miércoles 11-nov-2026, 10 a. m. Bogotá → fin de semana = vie 13, sáb 14, dom 15
const NOW = new Date("2026-11-11T15:00:00Z")
const ev = (id: string, startISO: string, endISO: string, place = "Teatro"): DigestEvent => ({ id, title: `E-${id}`, start: new Date(startISO), end: new Date(endISO), place, url: `/eventos/${id}` })
const act = (id: string, schedule: ActivitySchedule, priceFrom = "Gratis"): DigestActivity => ({ id, title: `A-${id}`, schedule, priceFrom, place: "Parque", url: `/actividades/${id}` })

test("cubre viernes, sábado y domingo, en ese orden, y omite días sin nada", () => {
  const d = buildWeekendDigest([], [act("a", weekly([6], "08:00"))], NOW)
  assert.deepEqual(d.days.map((x) => x.date), ["2026-11-14"])
})

test("un evento solo aparece los días que cubre; un actividad en los días de su horario", () => {
  const d = buildWeekendDigest([ev("e", "2026-11-14T23:00:00Z", "2026-11-15T03:00:00Z")], [act("a", weekly([5, 0], "09:00"))], NOW) // sáb 6 p. m. a dom 10 p. m.
  const by = Object.fromEntries(d.days.map((x) => [x.date, x.items.map((i) => i.title)]))
  assert.deepEqual(by["2026-11-13"], ["A-a"])
  assert.deepEqual(by["2026-11-14"], ["E-e"].filter(() => true))
  assert.ok(by["2026-11-15"].includes("A-a"))
})

test("ordena por hora y pone la hora en texto; sin hora va al final del día", () => {
  const d = buildWeekendDigest([], [act("tarde", weekly([6], "17:30")), act("manana", weekly([6], "07:00")), act("libre", { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false })], NOW)
  const sat = d.days.find((x) => x.date === "2026-11-14")!
  assert.deepEqual(sat.items.map((i) => i.title), ["A-manana", "A-tarde"]) // «siempre» no tiene hora fija y no se lista
  assert.equal(sat.items[0].timeLabel, "7:00 a. m.")
})

test("tope por día y nada vencido", () => {
  const many = Array.from({ length: 12 }, (_, i) => act(`m${i}`, weekly([5], `${String(8 + i).padStart(2, "0")}:00`)))
  const d = buildWeekendDigest([], many, NOW)
  assert.equal(d.days[0].items.length, DIGEST_MAX_PER_DAY)
  const past = buildWeekendDigest([ev("old", "2026-11-01T15:00:00Z", "2026-11-02T15:00:00Z")], [], NOW)
  assert.equal(past.days.length, 0)
})

test("texto para el Canal: título, un día por bloque y enlaces absolutos", () => {
  const t = digestText(buildWeekendDigest([], [act("a", weekly([6], "08:00"))], NOW), "https://x.co")
  assert.match(t, /^Qué hacer este fin de semana en Ibagué/)
  assert.match(t, /sábado 14/i)
  assert.match(t, /8:00 a\. m\. A-a/)
  assert.match(t, /https:\/\/x\.co\/actividades\/a/)
})

test("sin nada que contar: digest vacío", () => assert.equal(buildWeekendDigest([], [], NOW).days.length, 0))
