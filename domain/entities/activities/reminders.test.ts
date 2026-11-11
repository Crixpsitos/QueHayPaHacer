import { test } from "node:test"
import assert from "node:assert/strict"
import { planReminders, reminderId, type ReminderActivity } from "./reminders"

const A: ReminderActivity = { id: "a1", slug: "senderismo", title: "Senderismo", dateKey: "2026-11-15", timeLabel: "6:00 a. m.", spotsLeft: 5, reserved: ["u1"], savers: ["u2", "u1"] }
const B: ReminderActivity = { id: "a2", slug: "lectura", title: "Club de lectura", dateKey: "2026-11-15", timeLabel: null, spotsLeft: null, reserved: [], savers: ["u2"] }

test("mañana sale: avisa a quien reservó y a quien guardó, una vez por persona", () => {
  const plan = planReminders([A], "2026-11-14")
  assert.deepEqual(plan.map((p) => [p.uid, p.notification.type]).sort(), [["u1", "activity_reminder"], ["u2", "activity_reminder"]])
})
test("quien reservó recibe el aviso de su reserva (no el de guardado)", () => {
  const u1 = planReminders([A], "2026-11-14").find((p) => p.uid === "u1")!
  assert.match(u1.notification.title, /Mañana/)
  assert.match(u1.notification.body ?? "", /reserva/i)
})
test("máximo un aviso diario por persona: varias actividades se juntan en uno", () => {
  const plan = planReminders([A, B], "2026-11-14")
  assert.equal(plan.filter((p) => p.uid === "u2").length, 1)
  const u2 = plan.find((p) => p.uid === "u2")!
  assert.match(u2.notification.title + (u2.notification.body ?? ""), /y 1 más/)
})
test("el id del aviso es fijo por persona y día (un segundo barrido no repite)", () => {
  const plan = planReminders([A], "2026-11-14")
  assert.ok(plan.every((p) => p.id === reminderId("2026-11-14", p.uid)))
})
test("último cupo: avisa a quien guardó y no reservó, si la salida es mañana", () => {
  const last = { ...A, spotsLeft: 1, reserved: [], savers: ["u3"] }
  const p = planReminders([last], "2026-11-14")[0]
  assert.equal(p.notification.type, "activity_last_spot")
  assert.match(p.notification.title, /último cupo/i)
})
test("sin gente que avisar o sin salida mañana: nada", () => {
  assert.deepEqual(planReminders([{ ...A, reserved: [], savers: [] }], "2026-11-14"), [])
  assert.deepEqual(planReminders([], "2026-11-14"), [])
})
test("el enlace lleva a la ficha de la actividad", () => {
  assert.equal(planReminders([A], "2026-11-14")[0].notification.href, "/actividades/senderismo")
})
