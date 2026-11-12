import { test } from "node:test"
import assert from "node:assert/strict"
import { occurrencesBetween } from "./occurrences"
import { describeSchedule, validateSchedule, type ActivitySchedule } from "./ActivitySchedule"

// 2026: lunes 2 y lunes 16 de noviembre son festivos en Colombia (Todos los Santos e Independencia de Cartagena, trasladados)
const base = (holidays?: "skip" | "only"): ActivitySchedule => ({ rules: [{ kind: "weekly", weekdays: [1], start: "10:00" }], skipDates: [], requiresReservation: false, ...(holidays ? { holidays } : {}) })
const dates = (s: ActivitySchedule) => occurrencesBetween(s, "2026-11-01", "2026-11-30").map((o) => o.date)

test("sin política de festivos: todos los lunes", () => assert.deepEqual(dates(base()), ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]))
test("«no sale en festivos»: se saltan los lunes festivos", () => assert.deepEqual(dates(base("skip")), ["2026-11-09", "2026-11-23", "2026-11-30"]))
test("«solo en festivos»: únicamente los lunes festivos", () => assert.deepEqual(dates(base("only")), ["2026-11-02", "2026-11-16"]))
test("política inválida se rechaza y el texto legible la dice", () => {
  assert.notEqual(validateSchedule({ ...base(), holidays: "siempre" as never }), null)
  assert.match(describeSchedule(base("skip")), /festivos/i)
  assert.match(describeSchedule(base("only")), /solo.*festivos/i)
  assert.doesNotMatch(describeSchedule(base()), /festivos/i)
})
