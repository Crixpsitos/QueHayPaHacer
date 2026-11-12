import { test } from "node:test"
import assert from "node:assert/strict"
import { buildAgenda } from "./agenda"
import type { ActivitySchedule } from "./value-objects/ActivitySchedule"

const NOW = new Date("2026-11-11T15:00:00Z") // miércoles 11, 10:00 en Bogotá
const wed18: ActivitySchedule = { rules: [{ kind: "weekly", weekdays: [3], start: "18:00" }], skipDates: [], requiresReservation: false }
const wed09: ActivitySchedule = { rules: [{ kind: "weekly", weekdays: [3, 6], start: "09:30" }], skipDates: [], requiresReservation: false }
const always: ActivitySchedule = { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false }
const items = [{ id: "a", schedule: wed18 }, { id: "b", schedule: wed09 }, { id: "c", schedule: always }]

test("un día: ordenado por hora, lo que no tiene hora fija al final", () => {
  const g = buildAgenda(items, { from: "2026-11-11", to: "2026-11-11" }, NOW)
  assert.equal(g.length, 1)
  assert.deepEqual(g[0].entries.map((e) => e.id), ["a", "c"]) // b (9:30) ya salió; a 6 p. m.; c todo el día
  assert.deepEqual(g[0].entries.map((e) => e.hhmm), ["18:00", null])
})
test("varios días: agrupa por día y deja fuera 'todo el día' (sería repetir lo mismo cada día)", () => {
  const g = buildAgenda(items, { from: "2026-11-11", to: "2026-11-14" }, NOW)
  assert.deepEqual(g.map((d) => d.date), ["2026-11-11", "2026-11-14"]) // miércoles y sábado
  assert.deepEqual(g[1].entries.map((e) => e.id), ["b"])
  assert.ok(g.every((d) => d.entries.every((e) => e.id !== "c")))
})
test("sin nada: lista vacía", () => {
  assert.deepEqual(buildAgenda([], { from: "2026-11-11", to: "2026-11-11" }, NOW), [])
})

test("anytimeIds: lo sin hora fija sale aparte en rangos de varios días, y no en un solo día", async () => {
  const { anytimeIds } = await import("./agenda")
  const always = { rules: [{ kind: "always" }], skipDates: [] } as never
  const timed = { rules: [{ kind: "weekly", weekdays: [0, 1, 2, 3, 4, 5, 6], start: "10:00" }], skipDates: [] } as never
  const items = [{ id: "cine", schedule: always }, { id: "trote", schedule: timed }]
  const now = new Date("2026-11-12T15:00:00Z")
  assert.deepEqual(anytimeIds(items, { from: "2026-11-12", to: "2026-11-18" }, now), ["cine"])
  assert.deepEqual(anytimeIds(items, { from: "2026-11-12", to: "2026-11-12" }, now), [])
})
