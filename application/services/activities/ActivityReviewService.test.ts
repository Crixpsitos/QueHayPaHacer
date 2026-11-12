import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityReviewService } from "./ActivityReviewService"
import { applyReviewToRating, type ActivityReview, type ReviewInput } from "@/domain/entities/activities/review/ActivityReview"
import { reviewId } from "@/domain/entities/activities/review/reviewIdentity"
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
    async get(a, u) { return docs.get(reviewId(a, u)) ?? null },
    async save(r) { await Promise.resolve(); const prev = docs.get(r.id); rating = applyReviewToRating(rating, prev ? { type: "edit", from: prev.rating, to: r.rating } : { type: "add", rating: r.rating }); docs.set(r.id, r); return { created: !prev, rating } },
    async remove(a, u) { const d = docs.get(reviewId(a, u)); if (!d) return { removed: false, rating, media: [] }; if (d.status === "flagged") throw new Error("FLAGGED"); docs.delete(d.id); rating = applyReviewToRating(rating, { type: "remove", rating: d.rating }); return { removed: true, rating, media: [] } },
    async listBySite() { return [] },
    async listByActivity(a) { return [...docs.values()].filter((d) => d.activityId === a) },
    async listByAuthorSince(u, since) { return [...docs.values()].filter((d) => d.uid === u && d.createdAt >= since) },
    async getById() { throw new Error("n/a") }, async setFlag() { throw new Error("n/a") }, async countOpenFlags() { throw new Error("n/a") },
    async resolveFlag() { throw new Error("n/a") }, async setReply() { throw new Error("n/a") }, async listFlagged() { throw new Error("n/a") }, async restoreRemoved() { throw new Error("n/a") },
    async anonymize(a, u) { const d = docs.get(reviewId(a, u)); if (!d) return []; d.author = { ...d.author, displayName: "Usuario eliminado", photoURL: "" }; const m = d.media.map((x) => ({ path: x.path })); d.media = []; return m },
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
  assert.equal(r.review.id, reviewId("a1", "u1"))
  assert.ok(!r.review.id.includes("u1"), "el id del documento no lleva el uid")
  assert.equal(r.review.declarationVersion, "2026-11-11")
  assert.ok(!JSON.stringify(r.review).includes("@x.co"), "no se filtra el correo")
  assert.deepEqual([s.rating.count, s.rating.avg], [1, 5])
})

test("una por persona: reseñar otra vez edita (5 → 2), no suma", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  s.advance(60_000)
  const r = await s.svc.submit("u1", "a1", { ...input, rating: 2, body: "Cambié de opinión: el clima estuvo muy feo ese día." }, meta)
  assert.equal(r.review.editedAt?.getTime(), s.docs.get(reviewId("a1", "u1"))!.editedAt?.getTime())
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
  s.docs.get(reviewId("a1", "u1"))!.status = "flagged"
  await assert.rejects(s.svc.remove("u1", "a1"), /verificación/)
})

test("eliminar la cuenta borra todas sus reseñas (incluida una en verificación) y ajusta el promedio", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  s.advance(31_000)
  await s.svc.submit("u1", "a2", { ...input, body: "Otro texto distinto para otra actividad cualquiera." }, meta)
  assert.equal(s.rating.count, 2)
  assert.equal(await s.svc.eraseUser("u1"), 2)
  assert.equal(s.docs.size, 0)
  assert.equal(s.rating.count, 0)
})

const mediaOf = (uid: string, activity = "a1", over: Record<string, unknown> = {}) => ({ id: "m1", type: "image" as const, path: `public/activityReviews/${reviewId(activity, uid)}/images/foto.jpg-1`, url: `https://storage.googleapis.com/b/public/activityReviews/${reviewId(activity, uid)}/images/foto.jpg-1`, width: 10, height: 10, alt: "", isCover: true, ...over })

test("medios: una ruta ajena se rechaza (no se puede apuntar al archivo de otro recurso)", async () => {
  const s = setup()
  const evil = mediaOf("u1", "a1", { path: "public/events/ev1/images/portada.jpg", url: "https://storage.googleapis.com/b/public/events/ev1/images/portada.jpg" })
  await assert.rejects(s.svc.submit("u1", "a1", input, { media: [evil as never], coverIndex: 0 }), /no es válida/)
  const external = mediaOf("u1", "a1", { url: "https://evil.example/track.png" })
  await assert.rejects(setup().svc.submit("u1", "a1", input, { media: [external as never], coverIndex: 0 }), /no es válida/)
})
test("medios propios: entran como «procesando» aunque el cliente diga «ready»", async () => {
  const s = setup()
  const r = await s.svc.submit("u1", "a1", input, { media: [mediaOf("u1", "a1", { status: "ready", thumbnailPath: "public/events/x.jpg" }) as never], coverIndex: 0 })
  assert.equal(r.review.media[0].status, "processing")
  assert.equal(r.review.media[0].thumbnailPath, undefined)
  assert.equal(r.review.status, "pendingMedia")
})
test("una reseña retirada no se puede editar (se apela)", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  s.docs.get(reviewId("a1", "u1"))!.status = "removed"
  s.advance(31_000)
  await assert.rejects(s.svc.submit("u1", "a1", input, meta), /apelar/)
})
test("una cuenta con restricción de reseñas no reseña", async () => {
  const s = setup()
  const svc2 = new ActivityReviewService({ ...(s.svc as unknown as { d: ConstructorParameters<typeof ActivityReviewService>[0] }).d, isRestricted: async () => true })
  await assert.rejects(svc2.submit("u1", "a1", input, meta), /restricción/)
})

test("insignia: el aviso de reseña nueva se da una vez (no por ediciones) y un fallo del aviso no rompe la reseña", async () => {
  const s = setup()
  let calls = 0
  const d = (s.svc as unknown as { d: ConstructorParameters<typeof ActivityReviewService>[0] }).d
  const svc2 = new ActivityReviewService({ ...d, afterCreate: async () => { calls++; throw new Error("boom") } })
  await svc2.submit("u1", "a1", input, meta)
  assert.equal(calls, 1)
  s.advance(0)
})

test("el cooldown vale entre instancias: dos servicios con la misma base de límites, un solo envío pasa", async () => {
  const { InMemoryRateLimit } = await import("@/application/services/rateLimit/InMemoryRateLimit")
  const shared = new InMemoryRateLimit()
  const s = setup()
  const d = (s.svc as unknown as { d: ConstructorParameters<typeof ActivityReviewService>[0] }).d
  const a = new ActivityReviewService({ ...d, rateLimit: shared }), b = new ActivityReviewService({ ...d, rateLimit: shared })
  const results = await Promise.allSettled([a.submit("u1", "a1", input, meta), b.submit("u1", "a1", input, meta)])
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1)
})
test("eliminar la cuenta con una reseña EN VERIFICACIÓN no la borra: la anonimiza (la sanción sigue posible)", async () => {
  const s = setup()
  await s.svc.submit("u1", "a1", input, meta)
  s.docs.get(reviewId("a1", "u1"))!.status = "flagged"
  assert.equal(await s.svc.eraseUser("u1"), 1)
  const d = s.docs.get(reviewId("a1", "u1"))!
  assert.equal(d.status, "flagged")
  assert.equal(d.author.displayName, "Usuario eliminado")
})
