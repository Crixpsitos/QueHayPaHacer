import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { ActivityReminderService } from "./ActivityReminderService"

const NOW = new Date("2026-11-14T12:00:00Z") // sábado 14, 7:00 en Bogotá; mañana = domingo 15 (el fixture sale los domingos 6:00)

function setup(acts: Activity[], data: { reserved?: Record<string, string[]>; savers?: Record<string, string[]>; taken?: number } = {}) {
  const sent = new Map<string, { uid: string; n: NewNotification }>()
  const svc = new ActivityReminderService({
    listPublic: async () => acts,
    reservedFor: async (id, key) => (key === "2026-11-15" ? data.reserved?.[id] ?? [] : []),
    taken: async () => data.taken ?? 0,
    savers: async (id) => data.savers?.[id] ?? [],
    notify: async (uid, n, id) => { if (!sent.has(id)) sent.set(id, { uid, n }) }, // idempotente por id
    clock: () => NOW,
  })
  return { svc, sent }
}

test("avisa de las salidas de mañana a quien reservó y a quien guardó", async () => {
  const a = makeActivity({ id: "a1", slug: "senderismo", join: { capacity: 10, closed: false } })
  const { svc, sent } = setup([a], { reserved: { a1: ["u1"] }, savers: { a1: ["u2"] } })
  const r = await svc.sweep()
  assert.deepEqual([r.activities, r.notified], [1, 2])
  assert.deepEqual([...sent.values()].map((s) => s.uid).sort(), ["u1", "u2"])
})
test("un segundo barrido el mismo día no repite", async () => {
  const a = makeActivity({ id: "a1", join: { capacity: 10, closed: false } })
  const { svc, sent } = setup([a], { reserved: { a1: ["u1"] } })
  await svc.sweep(); await svc.sweep()
  assert.equal(sent.size, 1)
})
test("sin salida mañana no avisa (el fixture sale los domingos y mañana es domingo; un martes no)", async () => {
  const tue = makeActivity({ id: "a2", schedule: { rules: [{ kind: "weekly", weekdays: [2], start: "10:00" }], skipDates: [], requiresReservation: false } })
  const { svc } = setup([tue], { savers: { a2: ["u1"] } })
  assert.equal((await svc.sweep()).notified, 0)
})
test("'todos los días' no genera avisos (sería spam)", async () => {
  const always = makeActivity({ id: "a3", schedule: { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false } })
  const { svc } = setup([always], { savers: { a3: ["u1"] } })
  assert.equal((await svc.sweep()).notified, 0)
})
test("último cupo: con tope 10 y 9 ocupados avisa a quien guardó", async () => {
  const a = makeActivity({ id: "a1", join: { capacity: 10, closed: false } })
  const { svc, sent } = setup([a], { savers: { a1: ["u9"] }, taken: 9 })
  await svc.sweep()
  assert.equal([...sent.values()][0].n.type, "activity_last_spot")
})
test("salida de mañana con 'saltar fecha' no avisa", async () => {
  const a = makeActivity({ id: "a1", schedule: { rules: [{ kind: "weekly", weekdays: [0], start: "06:00" }], skipDates: ["2026-11-15"], requiresReservation: false } })
  const { svc } = setup([a], { savers: { a1: ["u1"] } })
  assert.equal((await svc.sweep()).notified, 0)
})
