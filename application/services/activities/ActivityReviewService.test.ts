import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityReviewService } from "./ActivityReviewService"
import { applyReviewToRating, type ActivityReview, type ReviewInput } from "@/domain/entities/activities/review/ActivityReview"
import type { ActivityRating } from "@/domain/entities/activities/Activity"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"

const T0 = new Date("2026-11-11T15:00:00Z")
const input: ReviewInput = { rating: 5, title: "Muy buena", body: "Salimos temprano y el guía conocía todo el camino.", visitedAt: "2026-10", photos: 0, video: 0 }
const meta = { media: [], coverIndex: 0 }

function setup(o: { now?: () => Date; accountAgeMin?: number; activityOwner?: string; siteOwner?: string | null; isPublic?: boolean } = {}) {
  let clock = T0
  const docs = new Map<string, ActivityReview>()
  let rating: ActivityRating = { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] }
  const repo: IActivityReviewRepository = {
    async get(a, u) { return docs.get(`${a}_${u}`) ?? null },
    async save(r) { await Promise.resolve(); const prev = docs.get(r.id); rating = applyReviewToRating(rating, prev ? { type: "edit", from: prev.rating, to: r.rating } : { type: "add", rating: r.rating }); docs.set(r.id, r); return { created: !prev, rating } },
    async remove(a, u) { const d = docs.get(`${a}_${u}`); if (!d) return { removed: false, rating }; if (d.status === "flagged") throw new Error("FLAGGED"); docs.delete(d.id); rating = applyReviewToRating(rating, { type: "remove", rating: d.rating }); return { removed: true, rating } },
    async listByActivity(a) { return [...docs.values()].filter((d) => d.activityId === a) },
    async listByAuthorSince(u, since) { return [...docs.values()].filter((d) => d.uid === u && d.createdAt >= since) },
    async getById() { throw new Error("n/a") }, async setFlag() { throw new Error("n/a") }, async countOpenFlags() { throw new Error("n/a") },
    async resolveFlag() { throw new Error("n/a") }, async setReply() { throw new Error("n/a") }, async listFlagged() { throw new Error("n/a") },
  }
  const notes: { uid: string; n: NewNotification; id?: string }[] = []
  const svc = new ActivityReviewService({
    repo,
    getActivity: async (id) => (o.isPublic === false ? null : { id, slug: "senderismo", title: "Senderismo", ownerUid: o.activityOwner ?? "owner", siteOwnerUid: o.siteOwner ?? null }),
    getAccount: async (uid) => ({ displayName: "Ana María Pérez Gómez", photoURL: "https://x/p.jpg", email: `${uid}@x.co`, createdAt: new Date(T0.getTime() - (o.accountAgeMin ?? 60) * 60_000) }),
    notify: async (uid, n, id) => { notes.push({ uid, n, id }) },
    clock: () => (o.now ? o.now() : clock),
    legalVersion: "2026-11-11",
  })
  return { svc, docs, notes, advance: (ms: number) => { clock = new Date(clock.getTime() + ms) }, get rating() { return rating } }
}

test("crea la reseña con el nombre público (primer nombre + inicial) y sin correo; el agregado queda correcto", async () => {
  const s = setup()
  const r = await s.svc.submit("u1", "a1", input, meta)
  assert.equal(r.review.author.displayName, "Ana P.")
  assert.equal(r.review.id, "a1_u1")
  assert.equal(r.review.declarationVersion, "2026-11-11")
  assert.ok(!JSON.stringify(r.review).includes("@x.co"), "no se filtra el correo")
  assert.deepEqual([s.rating.count, s.rating.avg], [1, 5])
})

test("una por persona: reseñar otra vez edita (5 → 2), no suma", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  s.advance(60_000)
  const r = await s.svc.submit("u1", "a1", { ...input, rating: 2, body: "Cambié de opinión: el clima estuvo muy feo ese día." }, meta)
  assert.equal(r.review.editedAt?.getTime(), s.docs.get("a1_u1")!.editedAt?.getTime())
  assert.deepEqual([s.rating.count, s.rating.sum], [1, 2])
})

test("quien publicó la actividad y el dueño del sitio no reseñan", async () => {
  await assert.rejects(setup({ activityOwner: "u1" }).svc.submit("u1", "a1", input, meta), /publicaste/)
  await assert.rejects(setup({ siteOwner: "u1" }).svc.submit("u1", "a1", input, meta), /propio sitio/)
})

test("actividad no pública o inexistente: error genérico", async () => {
  await assert.rejects(setup({ isPublic: false }).svc.submit("u1", "a1", input, meta), /no existe/)
})

test("cuenta con menos de 10 minutos de antigüedad no reseña", async () => {
  await assert.rejects(setup({ accountAgeMin: 3 }).svc.submit("u1", "a1", input, meta), /unos minutos/)
})

test("carrera: dos envíos casi simultáneos de la misma persona → solo uno pasa (cooldown 30 s) y cuenta 1", async () => {
  const s = setup()
  const results = await Promise.allSettled([s.svc.submit("u1", "a1", input, meta), s.svc.submit("u1", "a1", input, meta)])
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1)
  assert.equal(s.rating.count, 1)
})

test("tope de 10 reseñas por día y texto repetido en 7 días", async () => {
  const s = setup()
  for (let i = 0; i < 10; i++) { await s.svc.submit("u1", `a${i}`, { ...input, body: `Texto distinto número ${i} de la reseña larga.` }, meta); s.advance(31_000) }
  await assert.rejects(s.svc.submit("u1", "a99", { ...input, body: "Otra reseña completamente nueva y larga." }, meta), /por hoy/)
  const t = setup()
  await t.svc.submit("u2", "a1", input, meta)
  t.advance(31_000)
  await assert.rejects(t.svc.submit("u2", "a2", input, meta), /repetid/)
})

test("avisa al organizador una vez por reseña nueva (no por ediciones)", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  s.advance(31_000)
  await s.svc.submit("u1", "a1", { ...input, rating: 4, body: "Al final sí me gustó, solo que hizo mucho calor." }, meta)
  assert.deepEqual(s.notes.map((n) => [n.uid, n.n.type]), [["owner", "review_received"]])
})

test("validación del dominio se aplica (teléfono en el texto)", async () => {
  await assert.rejects(setup().svc.submit("u1", "a1", { ...input, body: "Escríbeme al 300 123 4567 y hablamos" }, meta), /enlaces|teléfonos/)
})

test("borrar: se puede, ajusta el agregado y no se puede si está cuestionada", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  await s.svc.remove("u1", "a1")
  assert.equal(s.rating.count, 0)
  s.advance(31_000)
  await s.svc.submit("u1", "a1", input, meta)
  s.docs.get("a1_u1")!.status = "flagged"
  await assert.rejects(s.svc.remove("u1", "a1"), /verificación/)
})
