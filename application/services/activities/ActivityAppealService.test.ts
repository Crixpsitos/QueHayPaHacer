import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityAppealService, APPEAL_MIN_CHARS } from "./ActivityAppealService"
import type { ActivityAppeal, IActivityAppealRepository } from "@/domain/repository/activities/IActivityAppealRepository"
import type { ActivityReview } from "@/domain/entities/activities/review/ActivityReview"

const removed = { id: "a1_u1", activityId: "a1", uid: "u1", rating: 2, status: "removed", flag: { by: "o", reason: "x", note: "", at: new Date(), resolution: "removed" } } as unknown as ActivityReview
const text = "x".repeat(APPEAL_MIN_CHARS)

function setup(review: ActivityReview | null = removed) {
  const db = new Map<string, ActivityAppeal>()
  const repo: IActivityAppealRepository = {
    async create(a) { if (db.has(a.reviewId)) return false; db.set(a.reviewId, a); return true },
    async get(id) { return db.get(id) ?? null }, async listOpen() { return [...db.values()].filter((a) => a.status === "open") },
    async resolve(id, status) { const a = db.get(id); if (!a || a.status !== "open") return false; a.status = status; return true },
  }
  let restored = false
  const svc = new ActivityAppealService({ appeals: repo, getReview: async () => review, restore: async () => { restored = true; return true }, clock: () => new Date() })
  return { svc, db, get restored() { return restored } }
}

test("quien tuvo una reseña retirada apela una sola vez con explicación de 30+ caracteres", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1_u1", text)
  assert.equal(s.db.get("a1_u1")?.status, "open")
  await assert.rejects(s.svc.submit("u1", "a1_u1", text), /una sola vez/)
})
test("explicación corta, reseña ajena, reseña no retirada: se rechaza", async () => {
  await assert.rejects(setup().svc.submit("u1", "a1_u1", "muy corta"), /30/)
  await assert.rejects(setup().svc.submit("otra", "a1_u1", text), /tuya/)
  await assert.rejects(setup({ ...removed, status: "published" } as ActivityReview).svc.submit("u1", "a1_u1", text), /retirada/)
})
test("QHPA restituye (la reseña vuelve) o rechaza sin trámite", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1_u1", text)
  await s.svc.resolve("a1_u1", "restored", "qhpa")
  assert.equal(s.restored, true)
  assert.equal(s.db.get("a1_u1")?.status, "restored")
  const t = setup()
  await t.svc.submit("u1", "a1_u1", text)
  await t.svc.resolve("a1_u1", "rejected", "qhpa")
  assert.equal(t.restored, false)
})
