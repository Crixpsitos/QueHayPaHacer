import { test } from "node:test"
import assert from "node:assert/strict"
import { parseActivityInput } from "@/application/dto/activities/ActivityDto"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import {
  addExtra, addInclude, addPrice, addRule, emptyForm, formFromActivity, moneyToString, parseMoney, previewSchedule, removeInclude, removePrice, removeRule,
  stepError, toRawInput, toggleWeekday, updateRule, type ActivityForm,
} from "./activityForm"

const filled = (p: Partial<ActivityForm> = {}): ActivityForm => ({
  ...emptyForm(),
  title: "Senderismo los domingos",
  description: "Salimos cada domingo a caminar por los cerros de Ibagué, con almuerzo incluido.",
  category: "aire-libre",
  rules: [{ freq: "weekly", weekdays: [0], start: "06:00", end: "", n: "2", anchorDate: "", nth: "1", weekday: 6, dayOfMonth: "15", dates: [] }],
  priceOptions: [{ label: "Salida completa", amount: "40.000", unit: "persona", includes: ["Almuerzo"], note: "" }],
  ...p,
})

test("dinero: acepta puntos de miles y rechaza lo que no es un entero", () => {
  assert.equal(parseMoney("40.000"), 40000)
  assert.equal(parseMoney(" 1.250.000 "), 1250000)
  assert.equal(parseMoney("0"), 0)
  assert.ok(Number.isNaN(parseMoney("")))
  assert.ok(Number.isNaN(parseMoney("12,5")))
  assert.ok(Number.isNaN(parseMoney("abc")))
  assert.equal(moneyToString(40000), "40.000")
  assert.equal(moneyToString(0), "0")
})

test("un formulario completo se convierte en una entrada que el servidor acepta", () => {
  const r = parseActivityInput(toRawInput(filled()))
  assert.equal(r.ok, true, JSON.stringify(r))
})

test("el formulario vacío no pasa la validación del servidor", () => {
  assert.equal(parseActivityInput(toRawInput(emptyForm())).ok, false)
})

test("ida y vuelta: actividad → formulario → entrada conserva el contenido", () => {
  const a = makeActivity({
    kind: "site", siteId: "s1", companions: ["amigos", "pareja"], extras: [{ label: "Con agua", amountCop: 3000, unit: "persona" }],
    cta: { kind: "whatsappGroup", value: "https://chat.whatsapp.com/AbC123" }, sections: [{ title: "Qué llevar", body: "Agua" }],
    schedule: { rules: [{ kind: "everyNWeeks", n: 2, anchorDate: "2026-11-14", weekdays: [6, 0], start: "07:00", end: "13:00" }, { kind: "monthlyNth", nth: "last", weekday: 5, start: "20:00" }, { kind: "dates", dates: ["2026-12-05"], start: "09:00" }], skipDates: ["2026-12-25"], validFrom: "2026-11-01", validUntil: "2027-01-31", requiresReservation: true },
  })
  const r = parseActivityInput(toRawInput(formFromActivity(a)))
  assert.equal(r.ok, true, JSON.stringify(r))
  if (!r.ok) return
  assert.deepEqual(r.value.schedule, a.schedule)
  assert.deepEqual([r.value.siteId, r.value.companions, r.value.extras, r.value.cta, r.value.sections], ["s1", a.companions, a.extras, a.cta, a.sections])
  assert.deepEqual(r.value.priceOptions, a.priceOptions)
})

test("operaciones sobre reglas de horario: agregar (máx. 7), quitar y editar", () => {
  let f = filled()
  for (let i = 0; i < 10; i++) f = { ...f, rules: addRule(f.rules) }
  assert.equal(f.rules.length, 7)
  assert.equal(removeRule(f.rules, 0).length, 6)
  assert.equal(removeRule([f.rules[0]], 0).length, 1) // siempre queda al menos una
  assert.equal(updateRule(f.rules, 1, { start: "08:00" })[1].start, "08:00")
})

test("toggleWeekday agrega y quita sin repetir", () => {
  assert.deepEqual(toggleWeekday([0], 6), [0, 6])
  assert.deepEqual(toggleWeekday([0, 6], 0), [6])
})

test("precios: agregar (máx. 8), quitar (queda al menos uno) y 'incluye' (máx. 6, sin repetir)", () => {
  let p = filled().priceOptions
  for (let i = 0; i < 10; i++) p = addPrice(p)
  assert.equal(p.length, 8)
  assert.equal(removePrice(p, 0).length, 7)
  assert.equal(removePrice([p[0]], 0).length, 1)
  let inc: string[] = []
  for (const x of ["a", "b", "c", "d", "e", "f", "g", "a"]) inc = addInclude(inc, x)
  assert.deepEqual(inc, ["a", "b", "c", "d", "e", "f"])
  assert.deepEqual(removeInclude(["a", "b"], 0), ["b"])
  assert.equal(addExtra([]).length, 1)
})

test("validación por paso", () => {
  assert.equal(stepError(1, filled()), null)
  assert.match(stepError(1, filled({ kind: "site", siteId: null }))!, /sitio/i)
  assert.match(stepError(2, filled({ title: "ab" }))!, /título/i)
  assert.match(stepError(2, filled({ description: "corta" }))!, /descripción/i)
  assert.match(stepError(2, filled({ category: "" }))!, /categoría/i)
  assert.equal(stepError(3, filled()), null)
  assert.match(stepError(3, filled({ rules: [{ ...filled().rules[0], weekdays: [] }] }))!, /día/i)
  assert.equal(stepError(4, filled()), null)
  assert.match(stepError(4, filled({ priceOptions: [{ label: "x", amount: "abc", unit: "persona", includes: [], note: "" }] }))!, /precio/i)
  assert.match(stepError(5, filled({ meetingMode: "fixed", meetingText: "" }))!, /punto de encuentro/i)
  assert.equal(stepError(5, filled({ meetingMode: "sharedAfterJoining" })), null)
  assert.equal(stepError(5, filled({ kind: "site", siteId: "s1", meetingMode: "fixed", meetingText: "" })), null) // el sitio pone el lugar
  assert.equal(stepError(6, filled()), null) // sin contexto de medios no se evalúa
  assert.match(stepError(6, filled(), { coverCount: 0 })!, /al menos una foto/i)
  assert.match(stepError(6, filled(), { coverCount: 2 })!, /una sola/i)
  assert.equal(stepError(6, filled(), { coverCount: 1 }), null)
  assert.equal(stepError(7, filled()), null)
  assert.match(stepError(7, filled({ ctaKind: "website", ctaValue: "javascript:alert(1)" }))!, /https/i)
})

test("vista previa del horario: texto legible y próximas cinco fechas", () => {
  const p = previewSchedule(filled(), new Date("2026-11-10T15:00:00Z"))
  assert.equal(p.text, "Todos los domingos · 6:00 a. m.")
  assert.deepEqual(p.next, ["dom 15 nov", "dom 22 nov", "dom 29 nov", "dom 6 dic", "dom 13 dic"])
})

test("vista previa con un horario inválido no lanza y avisa", () => {
  const p = previewSchedule(filled({ rules: [{ ...filled().rules[0], weekdays: [] }] }), new Date("2026-11-10T15:00:00Z"))
  assert.equal(p.text, "")
  assert.deepEqual(p.next, [])
  assert.match(p.error!, /día/i)
})
