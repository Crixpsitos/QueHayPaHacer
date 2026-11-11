import { test } from "node:test"
import assert from "node:assert/strict"
import { describeSchedule, validateSchedule, type ActivitySchedule, type ScheduleRule } from "./ActivitySchedule"

const sched = (rules: ScheduleRule[], extra: Partial<ActivitySchedule> = {}): ActivitySchedule => ({ rules, skipDates: [], requiresReservation: false, ...extra })

// ── validateSchedule ──
test("un horario semanal válido pasa", () => {
  assert.equal(validateSchedule(sched([{ kind: "weekly", weekdays: [0], start: "06:00", end: "14:00" }])), null)
})

test("exige entre 1 y 7 reglas", () => {
  assert.match(validateSchedule(sched([]))!, /al menos una/i)
  const eight = Array.from({ length: 8 }, () => ({ kind: "byAppointment" }) as ScheduleRule)
  assert.match(validateSchedule(sched(eight))!, /máximo 7/i)
})

test("rechaza horas mal formadas y fin anterior al inicio", () => {
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [0], start: "6:00" }]))!, /hora/i)
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [0], start: "25:00" }]))!, /hora/i)
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [0], start: "10:00", end: "09:00" }]))!, /fin/i)
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [0], start: "10:00", end: "10:00" }]))!, /fin/i)
})

test("weekdays: no vacío, sin repetidos y entre 0 y 6", () => {
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [], start: "06:00" }]))!, /día/i)
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [1, 1], start: "06:00" }]))!, /repet/i)
  assert.match(validateSchedule(sched([{ kind: "weekly", weekdays: [7 as 0], start: "06:00" }]))!, /día/i)
})

test("cada N semanas: N entre 2 y 8 y ancla válida", () => {
  const ok: ScheduleRule = { kind: "everyNWeeks", n: 2, anchorDate: "2026-11-14", weekdays: [6], start: "07:00" }
  assert.equal(validateSchedule(sched([ok])), null)
  assert.match(validateSchedule(sched([{ ...ok, n: 1 }]))!, /semanas/i)
  assert.match(validateSchedule(sched([{ ...ok, n: 9 }]))!, /semanas/i)
  assert.match(validateSchedule(sched([{ ...ok, anchorDate: "2026-02-30" }]))!, /fecha/i)
})

test("monthlyNth y monthlyDay validan sus rangos", () => {
  assert.equal(validateSchedule(sched([{ kind: "monthlyNth", nth: "last", weekday: 5, start: "18:00" }])), null)
  assert.match(validateSchedule(sched([{ kind: "monthlyNth", nth: 5 as 1, weekday: 5, start: "18:00" }]))!, /semana del mes/i)
  assert.equal(validateSchedule(sched([{ kind: "monthlyDay", dayOfMonth: 31, start: "10:00" }])), null)
  assert.match(validateSchedule(sched([{ kind: "monthlyDay", dayOfMonth: 0, start: "10:00" }]))!, /día del mes/i)
  assert.match(validateSchedule(sched([{ kind: "monthlyDay", dayOfMonth: 32, start: "10:00" }]))!, /día del mes/i)
})

test("fechas sueltas: 1 a 52, válidas y sin repetir", () => {
  assert.equal(validateSchedule(sched([{ kind: "dates", dates: ["2026-12-05"], start: "09:00" }])), null)
  assert.match(validateSchedule(sched([{ kind: "dates", dates: [], start: "09:00" }]))!, /fecha/i)
  assert.match(validateSchedule(sched([{ kind: "dates", dates: ["2026-12-05", "2026-12-05"], start: "09:00" }]))!, /repet/i)
  assert.match(validateSchedule(sched([{ kind: "dates", dates: ["nada"], start: "09:00" }]))!, /fecha/i)
  const many = Array.from({ length: 53 }, (_, i) => `2027-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}-${i}`)
  assert.match(validateSchedule(sched([{ kind: "dates", dates: many, start: "09:00" }]))!, /52|fecha/i)
})

test("skipDates máx. 60 y vigencia coherente", () => {
  const rule: ScheduleRule = { kind: "weekly", weekdays: [0], start: "06:00" }
  assert.match(validateSchedule(sched([rule], { skipDates: ["2026-02-30"] }))!, /fecha/i)
  assert.match(validateSchedule(sched([rule], { validFrom: "2026-12-01", validUntil: "2026-11-01" }))!, /vigencia/i)
  assert.equal(validateSchedule(sched([rule], { validFrom: "2026-11-01", validUntil: "2026-12-01" })), null)
})

test("always y byAppointment no piden más datos", () => {
  assert.equal(validateSchedule(sched([{ kind: "always" }])), null)
  assert.equal(validateSchedule(sched([{ kind: "byAppointment" }])), null)
  assert.match(validateSchedule(sched([{ kind: "always", start: "09:00", end: "08:00" }]))!, /fin/i)
})

// ── describeSchedule ──
test("semanal con un día y rango de horas", () => {
  assert.equal(describeSchedule(sched([{ kind: "weekly", weekdays: [0], start: "06:00" }])), "Todos los domingos · 6:00 a. m.")
  assert.equal(describeSchedule(sched([{ kind: "weekly", weekdays: [6], start: "07:30", end: "13:00" }])), "Todos los sábados · 7:30 a. m. a 1:00 p. m.")
})

test("semanal con varios días ordena de lunes a domingo", () => {
  assert.equal(describeSchedule(sched([{ kind: "weekly", weekdays: [0, 5, 1], start: "18:00" }])), "Los lunes, viernes y domingos · 6:00 p. m.")
  assert.equal(describeSchedule(sched([{ kind: "weekly", weekdays: [3, 4], start: "12:00" }])), "Los miércoles y jueves · 12:00 p. m.")
})

test("cada N semanas, mensual n-ésimo y mensual por día", () => {
  assert.equal(describeSchedule(sched([{ kind: "everyNWeeks", n: 2, anchorDate: "2026-11-14", weekdays: [6], start: "07:00" }])), "Cada 2 semanas, sábados · 7:00 a. m.")
  assert.equal(describeSchedule(sched([{ kind: "monthlyNth", nth: 1, weekday: 6, start: "09:00" }])), "El primer sábado de cada mes · 9:00 a. m.")
  assert.equal(describeSchedule(sched([{ kind: "monthlyNth", nth: "last", weekday: 5, start: "20:00" }])), "El último viernes de cada mes · 8:00 p. m.")
  assert.equal(describeSchedule(sched([{ kind: "monthlyDay", dayOfMonth: 15, start: "10:00" }])), "El día 15 de cada mes · 10:00 a. m.")
})

test("fechas sueltas, siempre y con cita", () => {
  assert.equal(describeSchedule(sched([{ kind: "dates", dates: ["2026-12-05", "2026-12-19"], start: "09:00" }])), "5 de diciembre y 19 de diciembre · 9:00 a. m.")
  assert.equal(describeSchedule(sched([{ kind: "dates", dates: ["2026-12-05", "2026-12-12", "2026-12-19", "2026-12-26"], start: "09:00" }])), "4 fechas, desde el 5 de diciembre · 9:00 a. m.")
  assert.equal(describeSchedule(sched([{ kind: "always" }])), "Mismo horario del sitio")
  assert.equal(describeSchedule(sched([{ kind: "always", start: "09:00", end: "17:00" }])), "Todos los días · 9:00 a. m. a 5:00 p. m.")
  assert.equal(describeSchedule(sched([{ kind: "byAppointment" }])), "Solo con cita")
})

test("varias reglas, vigencia y reserva previa", () => {
  const text = describeSchedule(
    sched([{ kind: "weekly", weekdays: [6], start: "08:00" }, { kind: "weekly", weekdays: [0], start: "09:00" }], { validFrom: "2026-12-01", validUntil: "2027-01-31", requiresReservation: true }),
  )
  assert.equal(text, "Todos los sábados · 8:00 a. m.; todos los domingos · 9:00 a. m. Del 1 de diciembre de 2026 al 31 de enero de 2027. Con reserva previa.")
})
