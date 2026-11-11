import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { ActivityModerationService } from "./ActivityModerationService"

const NOW = new Date("2026-11-10T15:00:00Z")
function setup(items: Activity[]) {
  const state = { items, approved: [] as string[], notified: [] as { uid: string; n: NewNotification }[] }
  const repo = {
    findById: async (id: string) => state.items.find((a) => a.id === id) ?? null,
    findPendingReview: async (limit: number) => state.items.filter((a) => a.publicationStatus === "published" && a.moderationStatus === "pending").slice(0, limit),
    save: async (a: Activity) => { state.items = state.items.map((x) => (x.id === a.id ? a : x)) },
  } as unknown as IActivityRepository
  const svc = new ActivityModerationService({
    repo,
    accounts: { get: async () => ({ approvedCount: 0, activeSanctions: 0, suspendedUntil: null }), recordApproved: async (uid) => { state.approved.push(uid) } },
    notify: async (uid, n) => { state.notified.push({ uid, n }) },
    clock: () => NOW,
  })
  return { state, svc }
}
const pending = (id = "p1") => makeActivity({ id, slug: `act-${id}`, title: "Senderismo", ownerUid: "u1", moderationStatus: "pending" })

test("listPending trae solo publicadas en revisión, con edad en horas", async () => {
  const { svc } = setup([pending("a"), makeActivity({ id: "ok" }), makeActivity({ id: "borr", publicationStatus: "draft", moderationStatus: "pending" })])
  const rows = await svc.listPending(10)
  assert.deepEqual(rows.map((r) => r.id), ["a"])
  assert.equal(typeof rows[0].ageHours, "number")
})

test("aprobar: queda aprobada con revisor y fecha, suma a la cuenta y avisa al dueño", async () => {
  const { svc, state } = setup([pending()])
  assert.deepEqual(await svc.approve("p1", "admin1"), { ok: true })
  const a = state.items[0]
  assert.deepEqual([a.moderationStatus, a.reviewedBy, a.reviewedAt, a.rejectionReason], ["approved", "admin1", NOW, null])
  assert.deepEqual(state.approved, ["u1"])
  assert.equal(state.notified[0].uid, "u1")
  assert.equal(state.notified[0].n.type, "activity_moderation")
  assert.match(state.notified[0].n.title, /Aprobaron/)
})

test("aprobar dos veces o algo que no está en revisión falla sin efectos", async () => {
  const { svc, state } = setup([pending(), makeActivity({ id: "ya", moderationStatus: "approved" })])
  await svc.approve("p1", "admin1")
  assert.deepEqual(await svc.approve("p1", "admin1"), { ok: false, error: "Esta actividad no está en revisión." })
  assert.deepEqual(await svc.approve("ya", "admin1"), { ok: false, error: "Esta actividad no está en revisión." })
  assert.deepEqual(await svc.approve("nada", "admin1"), { ok: false, error: "No existe la actividad." })
  assert.equal(state.approved.length, 1)
})

test("rechazar exige motivo, guarda el motivo y avisa", async () => {
  const { svc, state } = setup([pending()])
  assert.deepEqual(await svc.reject("p1", "admin1", "  "), { ok: false, error: "Escribe el motivo del rechazo (mínimo 5 caracteres)." })
  assert.equal(state.items[0].moderationStatus, "pending")
  assert.deepEqual(await svc.reject("p1", "admin1", "Fotos de otra persona"), { ok: true })
  const a = state.items[0]
  assert.deepEqual([a.moderationStatus, a.rejectionReason, a.rejectedAt], ["rejected", "Fotos de otra persona", NOW])
  assert.match(state.notified[0].n.title, /No aprobaron/)
  assert.equal(state.notified[0].n.body, "Fotos de otra persona")
  assert.equal(state.approved.length, 0)
})
