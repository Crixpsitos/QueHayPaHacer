import { test } from "node:test"
import assert from "node:assert/strict"
import { SitesService } from "./SitesService"
import type { SitesAdapter } from "@/infraestructure/adapters/sites/SitesAdapter"
import type { FirebaseSiteDto } from "@/infraestructure/firebase/dto/sites/FirebaseSiteDto"

// Adapter mínimo: solo lo que usa recomputeScore.
const fake = (dto: Partial<FirebaseSiteDto> | null) => {
  const writes: unknown[] = []
  const adapter = {
    findRawById: async () => dto as FirebaseSiteDto | null,
    updateRaw: async (d: unknown) => { writes.push(d) },
  } as unknown as SitesAdapter
  return { svc: new SitesService(adapter), writes }
}

test("recomputeScore escribe solo analytics.score cuando cambió", async () => {
  const { svc, writes } = fake({ analytics: { likes: 2, shares: 1, eventCount: 0, score: 0 } as never, listingComplete: true })
  await svc.recomputeScore("s1")
  assert.deepEqual(writes, [{ id: "s1", analytics: { score: 2 * 3 + 5 + 10 } }])
})

test("recomputeScore no escribe si el puntaje ya es el correcto", async () => {
  const { svc, writes } = fake({ analytics: { likes: 0, shares: 0, eventCount: 0, score: 10 } as never, listingComplete: true })
  await svc.recomputeScore("s1")
  assert.deepEqual(writes, [])
})

test("recomputeScore ignora sitios que no existen", async () => {
  const { svc, writes } = fake(null)
  await svc.recomputeScore("nope")
  assert.deepEqual(writes, [])
})

// --- setEventCount: fija eventCount y recalcula el score en una sola escritura ---

test("setEventCount escribe eventCount y score juntos y devuelve el autor", async () => {
  const { svc, writes } = fake({ author: { id: "u1" } as never, analytics: { likes: 1, shares: 0, eventCount: 0, score: 3 } as never, listingComplete: false })
  const r = await svc.setEventCount("s1", { count: 2, validUntil: null })
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 2, score: 3 + 2 * 4, eventCountValidUntil: null } }])
  assert.deepEqual(r, { authorId: "u1", visible: true })
})

test("setEventCount no escribe si eventCount y score ya son correctos", async () => {
  const { svc, writes } = fake({ analytics: { likes: 0, shares: 0, eventCount: 2, score: 8, eventCountValidUntil: null } as never, listingComplete: false })
  assert.equal(await svc.setEventCount("s1", { count: 2, validUntil: null }), null)
  assert.deepEqual(writes, [])
})

test("setEventCount corrige el score aunque el conteo ya coincida (score desfasado)", async () => {
  const { svc, writes } = fake({ analytics: { likes: 0, shares: 0, eventCount: 2, score: 0 } as never, listingComplete: true })
  await svc.setEventCount("s1", { count: 2, validUntil: null })
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 2, score: 2 * 4 + 10, eventCountValidUntil: null } }])
})

test("setEventCount ignora sitios que no existen", async () => {
  const { svc, writes } = fake(null)
  assert.equal(await svc.setEventCount("nope", { count: 3, validUntil: null }), null)
  assert.deepEqual(writes, [])
})

test("setEventCount guarda el vencimiento junto al conteo", async () => {
  const until = new Date("2026-11-01T00:00:00Z")
  const { svc, writes } = fake({ author: { id: "u1" } as never, analytics: { likes: 0, shares: 0, eventCount: 0, score: 0 } as never, listingComplete: false })
  await svc.setEventCount("s1", { count: 1, validUntil: until })
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 1, score: 4, eventCountValidUntil: until } }])
})

test("setEventCount escribe si solo cambió el vencimiento, y no si es el mismo instante", async () => {
  const until = new Date("2026-11-01T00:00:00Z")
  const stored = { toDate: () => until }
  const a = fake({ analytics: { likes: 0, shares: 0, eventCount: 1, score: 4, eventCountValidUntil: stored } as never, listingComplete: false })
  assert.equal(await a.svc.setEventCount("s1", { count: 1, validUntil: new Date(until) }), null, "mismo instante: sin escritura")
  assert.deepEqual(a.writes, [])
  const b = fake({ analytics: { likes: 0, shares: 0, eventCount: 1, score: 4, eventCountValidUntil: stored } as never, listingComplete: false })
  await b.svc.setEventCount("s1", { count: 1, validUntil: new Date("2026-11-05T00:00:00Z") })
  assert.equal(b.writes.length, 1, "otro vencimiento: escribe")
})

test("el tope de 5 eventos aplica al puntaje pero eventCount guarda el conteo real", async () => {
  const { svc, writes } = fake({ author: { id: "u1" } as never, analytics: { likes: 0, shares: 0, eventCount: 0, score: 0 } as never, listingComplete: false })
  await svc.setEventCount("s1", { count: 9, validUntil: null })
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 9, score: 20, eventCountValidUntil: null } }])
})

test("getLinkSnapshot lee autor y declaración; un doc antiguo se lee como propuesto", async () => {
  const a = fake({ author: { id: "u1" } as never, publishedAs: "owner", verification: "claimed", publicationStatus: "published", moderationStatus: "approved" } as never)
  assert.deepEqual(await a.svc.getLinkSnapshot("s1"), { authorId: "u1", publishedAs: "owner", verification: "claimed", publicationStatus: "published", moderationStatus: "approved" })
  const old = fake({ author: { id: "u2" } as never, publicationStatus: "published", moderationStatus: "approved" } as never)
  const snap = await old.svc.getLinkSnapshot("s1")
  assert.equal(snap?.publishedAs, "proposer")
  assert.equal(snap?.verification, "community")
  assert.equal(await fake(null).svc.getLinkSnapshot("x"), null)
})

test("un sitio sin el campo eventCountValidUntil lo recibe (null) en el primer recuento aunque nada más cambie", async () => {
  const { svc, writes } = fake({ author: { id: "u1" } as never, analytics: { likes: 0, shares: 0, eventCount: 0, score: 0 } as never, listingComplete: false })
  const r = await svc.setEventCount("s1", { count: 0, validUntil: null })
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 0, score: 0, eventCountValidUntil: null } }])
  assert.deepEqual(r, { authorId: "u1", visible: false }, "no cambió nada visible: no hay que invalidar cachés")
  // y con el campo ya presente (null) no vuelve a escribir
  const again = fake({ analytics: { likes: 0, shares: 0, eventCount: 0, score: 0, eventCountValidUntil: null } as never, listingComplete: false })
  assert.equal(await again.svc.setEventCount("s1", { count: 0, validUntil: null }), null)
})

test("si solo se mueve el vencimiento, el cambio no es visible; si cambia el conteo o el puntaje, sí", async () => {
  const stored = { toDate: () => new Date("2026-11-01T00:00:00Z") }
  const a = fake({ author: { id: "u1" } as never, analytics: { likes: 0, shares: 0, eventCount: 1, score: 4, eventCountValidUntil: stored } as never, listingComplete: false })
  assert.deepEqual(await a.svc.setEventCount("s1", { count: 1, validUntil: new Date("2026-11-09T00:00:00Z") }), { authorId: "u1", visible: false })
  const b = fake({ author: { id: "u1" } as never, analytics: { likes: 0, shares: 0, eventCount: 2, score: 8, eventCountValidUntil: stored } as never, listingComplete: false })
  assert.deepEqual(await b.svc.setEventCount("s1", { count: 1, validUntil: null }), { authorId: "u1", visible: true })
})

test("findExpiredEventCounts y countExpiredEventCounts delegan en el repositorio", async () => {
  const calls: unknown[] = []
  const adapter = {
    findExpiredEventCounts: async (now: Date, limit: number) => { calls.push(["find", now.toISOString(), limit]); return [{ id: "a", validUntil: 1 }] },
    countExpiredEventCounts: async (now: Date) => { calls.push(["count", now.toISOString()]); return 3 },
  } as unknown as SitesAdapter
  const svc = new SitesService(adapter)
  const now = new Date("2026-10-24T00:00:00Z")
  assert.deepEqual(await svc.findExpiredEventCounts(now, 100), [{ id: "a", validUntil: 1 }])
  assert.equal(await svc.countExpiredEventCounts(now), 3)
  assert.deepEqual(calls, [["find", now.toISOString(), 100], ["count", now.toISOString()]])
})
