import { test } from "node:test"
import assert from "node:assert/strict"
import { ReviewModerationService } from "./ReviewModerationService"
import { reviewKey } from "@/presentation/activities/lib/reviewView"
import { applyReviewToRating, reviewId, type ActivityReview, type ReviewFlag } from "@/domain/entities/activities/review/ActivityReview"
import type { Sanction } from "@/domain/entities/activities/moderation/reviewModeration"
import type { ActivityRating } from "@/domain/entities/activities/Activity"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"
import type { IActivitySanctionRepository } from "@/domain/repository/activities/IActivitySanctionRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"

const T0 = new Date("2026-11-12T15:00:00Z")
const review = (uid: string, rating = 2): ActivityReview => ({ id: reviewId("a1", uid), activityId: "a1", uid, rating, title: "", body: "texto de la reseña larga", visitedAt: "2026-10", media: [], coverIndex: 0, author: { uid, displayName: "Ana P.", photoURL: "" }, status: "published", flag: null, ownerReply: null, createdAt: T0, updatedAt: T0, editedAt: null, declarationVersion: "v" })
const note = "x".repeat(30)

function setup() {
  let clock = T0
  const docs = new Map<string, ActivityReview>([[reviewId("a1", "r1"), review("r1")], [reviewId("a1", "r2", ), review("r2", 5)]])
  let rating: ActivityRating = { count: 2, sum: 7, avg: 3.5, dist: [0, 1, 0, 0, 1] }
  const reviews: IActivityReviewRepository = {
    async get(a, u) { return docs.get(`${a}_${u}`) ?? null }, async save() { throw new Error("n/a") }, async remove() { throw new Error("n/a") },
    async listByActivity() { return [...docs.values()] }, async listByAuthorSince() { return [] },
    async getById(id) { return docs.get(id) ?? null },
    async setFlag(id, flag: ReviewFlag) { const d = docs.get(id); if (!d || d.status !== "published") return false; d.status = "flagged"; d.flag = flag; return true },
    async countOpenFlags(f) { return [...docs.values()].filter((d) => d.status === "flagged" && (!f.by || d.flag?.by === f.by) && (!f.activityId || d.activityId === f.activityId)).length },
    async resolveFlag(id, r) { const d = docs.get(id); if (!d || d.status !== "flagged") return null; d.status = r.status; d.flag = { ...d.flag!, resolution: r.resolution, resolvedAt: r.at, resolvedBy: r.resolvedBy }; if (r.status === "removed") rating = applyReviewToRating(rating, { type: "remove", rating: d.rating }); return { review: d, rating } },
    async setReply(id, reply) { docs.get(id)!.ownerReply = reply }, async listFlagged() { return [...docs.values()].filter((d) => d.status === "flagged") }, async restoreRemoved() { throw new Error("n/a") },
  }
  const sanctions: Sanction[] = []
  const sRepo: IActivitySanctionRepository = { async add(s) { sanctions.push(s) }, async listByUid(u) { return sanctions.filter((s) => s.uid === u) }, async countSince(u, role, since) { return sanctions.filter((s) => s.uid === u && s.role === role && s.createdAt >= since).length } }
  const notes: { uid: string; n: NewNotification }[] = []
  const logs: string[] = []
  const svc = new ReviewModerationService({
    reviews, sanctions: sRepo,
    getActivity: async (id) => (id === "a1" ? { id, slug: "senderismo", title: "Senderismo", ownerUid: "owner", siteOwnerUid: "siteboss" } : null),
    notify: async (uid, n) => { notes.push({ uid, n }) }, clock: () => clock, log: (m) => logs.push(m),
  })
  return { svc, docs, sanctions, notes, logs, advance: (ms: number) => { clock = new Date(clock.getTime() + ms) }, get rating() { return rating } }
}
const key = reviewKey

test("el creador cuestiona: la reseña queda en verificación (sigue existiendo) y se registra el aviso para QHPA", async () => {
  const s = setup()
  await s.svc.flag("owner", "a1", key("a1", "r1"), { reason: "false_info", note })
  assert.equal(s.docs.get("a1_r1")!.status, "flagged")
  assert.ok(s.logs.some((l) => l.includes("alert=qhpa_new_flag")))
})
test("el dueño del sitio también cuestiona; un tercero no; una reseña no se cuestiona dos veces", async () => {
  const s = setup()
  await s.svc.flag("siteboss", "a1", key("a1", "r1"), { reason: "spam", note })
  await assert.rejects(s.svc.flag("tercero", "a1", key("a1", "r2"), { reason: "spam", note }), /Reportar/)
  s.advance(31_000)
  await assert.rejects(s.svc.flag("owner", "a1", key("a1", "r1"), { reason: "spam", note }), /ya está en revisión|ya fue cuestionada/)
})
test("cooldown de 30 s entre cuestionamientos y llave inexistente = error genérico", async () => {
  const s = setup()
  await s.svc.flag("owner", "a1", key("a1", "r1"), { reason: "spam", note })
  await assert.rejects(s.svc.flag("owner", "a1", key("a1", "r2"), { reason: "spam", note }), /unos segundos/)
  s.advance(31_000)
  await assert.rejects(s.svc.flag("owner", "a1", "no-existe", { reason: "spam", note }), /no existe/)
})
test("resolver «falsa»: se retira, sale del promedio, sanciona a la autora y avisa a ambos", async () => {
  const s = setup()
  await s.svc.flag("owner", "a1", key("a1", "r1"), { reason: "not_attended", note })
  const r = await s.svc.resolve({ reviewId: "a1_r1", outcome: "removed", abusive: false, by: "qhpa" })
  assert.equal(r.review.status, "removed")
  assert.deepEqual([s.rating.count, s.rating.sum], [1, 5])
  assert.deepEqual(s.sanctions.map((x) => [x.uid, x.role, x.kind]), [["r1", "reviewer", "warning"]])
  assert.deepEqual(s.notes.map((n) => n.n.type).sort(), ["activity_sanction", "review_flag_resolved", "review_flag_resolved"])
})
test("resolver «real»: queda verificada, sin sanción si no hubo abuso", async () => {
  const s = setup()
  await s.svc.flag("owner", "a1", key("a1", "r1"), { reason: "false_info", note })
  const r = await s.svc.resolve({ reviewId: "a1_r1", outcome: "upheld", abusive: false, by: "qhpa" })
  assert.equal(r.review.status, "published")
  assert.equal(r.review.flag?.resolution, "upheld")
  assert.equal(s.sanctions.length, 0)
})
test("no se resuelve dos veces", async () => {
  const s = setup()
  await s.svc.flag("owner", "a1", key("a1", "r1"), { reason: "spam", note })
  await s.svc.resolve({ reviewId: "a1_r1", outcome: "upheld", abusive: false, by: "qhpa" })
  await assert.rejects(s.svc.resolve({ reviewId: "a1_r1", outcome: "removed", abusive: false, by: "qhpa" }), /no está en verificación/)
})
test("respuesta del organizador: hasta 600 caracteres, solo quien organiza, editable", async () => {
  const s = setup()
  await s.svc.reply("owner", "a1", key("a1", "r2"), "¡Gracias por venir!")
  assert.equal(s.docs.get("a1_r2")!.ownerReply?.text, "¡Gracias por venir!")
  await assert.rejects(s.svc.reply("tercero", "a1", key("a1", "r2"), "hola"), /organiza/)
  await assert.rejects(s.svc.reply("owner", "a1", key("a1", "r2"), "x".repeat(601)), /600/)
  await assert.rejects(s.svc.reply("owner", "a1", key("a1", "r2"), "   "), /escribe/i)
})
