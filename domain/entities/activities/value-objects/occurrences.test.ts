import { test } from "node:test"
import assert from "node:assert/strict"
import type { ActivitySchedule, ScheduleRule } from "./ActivitySchedule"
import { bogotaDateIso, nextOccurrence, occursOn, occursWeekdays, occurrencesBetween } from "./occurrences"

const sched = (rules: ScheduleRule[], extra: Partial<ActivitySchedule> = {}): ActivitySchedule => ({ rules, skipDates: [], requiresReservation: false, ...extra })
const dates = (s: ActivitySchedule, from: string, to: string) => occurrencesBetween(s, from, to).map((o) => o.date)

test("semanal: todos los domingos de noviembre de 2026 (con instantes en UTC)", () => {
  const s = sched([{ kind: "weekly", weekdays: [0], start: "06:00", end: "14:00" }])
  const occ = occurrencesBetween(s, "2026-11-01", "2026-11-30")
  assert.deepEqual(occ.map((o) => o.date), ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"])
  assert.equal(occ[0].startsAt?.toISOString(), "2026-11-01T11:00:00.000Z")
  assert.equal(occ[0].endsAt?.toISOString(), "2026-11-01T19:00:00.000Z")
})

test("una hora nocturna de Bogotá cae al día siguiente en UTC", () => {
  const [o] = occurrencesBetween(sched([{ kind: "weekly", weekdays: [0], start: "23:30" }]), "2026-11-01", "2026-11-01")
  assert.equal(o.date, "2026-11-01")
  assert.equal(o.startsAt?.toISOString(), "2026-11-02T04:30:00.000Z")
})

test("cada 2 semanas respeta el ancla y cruza mes y año", () => {
  const s = sched([{ kind: "everyNWeeks", n: 2, anchorDate: "2026-11-14", weekdays: [6], start: "07:00" }])
  assert.deepEqual(dates(s, "2026-10-01", "2027-01-31"), ["2026-11-14", "2026-11-28", "2026-12-12", "2026-12-26", "2027-01-09", "2027-01-23"])
  assert.deepEqual(dates(s, "2026-12-20", "2027-01-15"), ["2026-12-26", "2027-01-09"])
})

test("cada 2 semanas con dos días: la semana empieza el lunes y no se cuenta antes del ancla", () => {
  const s = sched([{ kind: "everyNWeeks", n: 2, anchorDate: "2026-11-14", weekdays: [6, 0], start: "07:00" }])
  // semana del ancla (lun 9 – dom 15): sáb 14 y dom 15; la siguiente que cuenta: lun 23 – dom 29
  assert.deepEqual(dates(s, "2026-11-01", "2026-12-06"), ["2026-11-14", "2026-11-15", "2026-11-28", "2026-11-29"])
})

test("mensual: primer sábado y último viernes", () => {
  assert.deepEqual(dates(sched([{ kind: "monthlyNth", nth: 1, weekday: 6, start: "09:00" }]), "2026-11-01", "2027-01-31"), ["2026-11-07", "2026-12-05", "2027-01-02"])
  assert.deepEqual(dates(sched([{ kind: "monthlyNth", nth: "last", weekday: 5, start: "20:00" }]), "2026-11-01", "2027-02-28"), ["2026-11-27", "2026-12-25", "2027-01-29", "2027-02-26"])
})

test("mensual por día: el 31 salta los meses cortos; el 29 de febrero solo en bisiesto", () => {
  assert.deepEqual(dates(sched([{ kind: "monthlyDay", dayOfMonth: 31, start: "10:00" }]), "2026-11-01", "2027-02-28"), ["2026-12-31", "2027-01-31"])
  assert.deepEqual(dates(sched([{ kind: "monthlyDay", dayOfMonth: 29, start: "10:00" }]), "2027-02-01", "2027-02-28"), [])
  assert.deepEqual(dates(sched([{ kind: "monthlyDay", dayOfMonth: 29, start: "10:00" }]), "2028-02-01", "2028-02-29"), ["2028-02-29"])
})

test("fechas sueltas, excepciones y vigencia", () => {
  const rule: ScheduleRule = { kind: "dates", dates: ["2026-12-05", "2026-12-12", "2026-12-19"], start: "09:00" }
  assert.deepEqual(dates(sched([rule]), "2026-12-01", "2026-12-31"), ["2026-12-05", "2026-12-12", "2026-12-19"])
  assert.deepEqual(dates(sched([rule], { skipDates: ["2026-12-12"] }), "2026-12-01", "2026-12-31"), ["2026-12-05", "2026-12-19"])
  assert.deepEqual(dates(sched([rule], { validFrom: "2026-12-10", validUntil: "2026-12-15" }), "2026-12-01", "2026-12-31"), ["2026-12-12"])
})

test("always genera todos los días (con o sin horas) y byAppointment ninguno", () => {
  const withHours = occurrencesBetween(sched([{ kind: "always", start: "09:00", end: "17:00" }]), "2026-11-02", "2026-11-04")
  assert.equal(withHours.length, 3)
  assert.equal(withHours[0].startsAt?.toISOString(), "2026-11-02T14:00:00.000Z")
  const noHours = occurrencesBetween(sched([{ kind: "always" }]), "2026-11-02", "2026-11-03")
  assert.deepEqual(noHours.map((o) => o.startsAt), [null, null])
  assert.deepEqual(dates(sched([{ kind: "byAppointment" }]), "2026-11-01", "2026-12-31"), [])
})

test("varias reglas se mezclan ordenadas y sin duplicar el mismo día/hora", () => {
  const s = sched([{ kind: "weekly", weekdays: [6], start: "08:00" }, { kind: "weekly", weekdays: [0], start: "09:00" }])
  assert.deepEqual(dates(s, "2026-11-07", "2026-11-15"), ["2026-11-07", "2026-11-08", "2026-11-14", "2026-11-15"])
})

test("rango invertido da vacío y el rango se limita a 400 días", () => {
  const s = sched([{ kind: "always" }])
  assert.deepEqual(dates(s, "2026-12-01", "2026-11-01"), [])
  assert.equal(occurrencesBetween(s, "2026-01-01", "2030-01-01").length, 400)
})

test("bogotaDateIso usa la hora de Bogotá y no la UTC", () => {
  assert.equal(bogotaDateIso(new Date("2026-11-09T04:59:00Z")), "2026-11-08")
  assert.equal(bogotaDateIso(new Date("2026-11-09T05:00:00Z")), "2026-11-09")
})

test("nextOccurrence: en curso cuenta, ya empezada sin fin pasa a la siguiente", () => {
  const conFin = sched([{ kind: "weekly", weekdays: [0], start: "06:00", end: "14:00" }])
  assert.equal(nextOccurrence(conFin, new Date("2026-11-08T11:30:00Z"))?.date, "2026-11-08")
  assert.equal(nextOccurrence(conFin, new Date("2026-11-08T20:00:00Z"))?.date, "2026-11-15")
  const sinFin = sched([{ kind: "weekly", weekdays: [0], start: "06:00" }])
  assert.equal(nextOccurrence(sinFin, new Date("2026-11-08T11:30:00Z"))?.date, "2026-11-15")
  assert.equal(nextOccurrence(sinFin, new Date("2026-11-08T10:00:00Z"))?.date, "2026-11-08")
})

test("nextOccurrence: nada próximo devuelve null", () => {
  assert.equal(nextOccurrence(sched([{ kind: "byAppointment" }]), new Date("2026-11-08T10:00:00Z")), null)
  assert.equal(nextOccurrence(sched([{ kind: "dates", dates: ["2026-01-01"], start: "09:00" }]), new Date("2026-11-08T10:00:00Z")), null)
})

test("occursOn respeta excepciones y vigencia", () => {
  const s = sched([{ kind: "weekly", weekdays: [0], start: "06:00" }], { skipDates: ["2026-11-15"] })
  assert.equal(occursOn(s, "2026-11-08"), true)
  assert.equal(occursOn(s, "2026-11-15"), false)
  assert.equal(occursOn(s, "2026-11-09"), false)
})

test("occursWeekdays resume los días posibles", () => {
  assert.deepEqual(occursWeekdays(sched([{ kind: "weekly", weekdays: [5, 0], start: "06:00" }])), [0, 5])
  assert.deepEqual(occursWeekdays(sched([{ kind: "monthlyNth", nth: 1, weekday: 6, start: "06:00" }])), [6])
  assert.deepEqual(occursWeekdays(sched([{ kind: "dates", dates: ["2026-12-05"], start: "06:00" }])), [6])
  assert.deepEqual(occursWeekdays(sched([{ kind: "monthlyDay", dayOfMonth: 15, start: "06:00" }])), [0, 1, 2, 3, 4, 5, 6])
  assert.deepEqual(occursWeekdays(sched([{ kind: "always" }])), [0, 1, 2, 3, 4, 5, 6])
  assert.deepEqual(occursWeekdays(sched([{ kind: "byAppointment" }])), [])
})
