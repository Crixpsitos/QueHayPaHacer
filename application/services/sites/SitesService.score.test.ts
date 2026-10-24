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
  const r = await svc.setEventCount("s1", 2)
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 2, score: 3 + 2 * 4 } }])
  assert.deepEqual(r, { authorId: "u1" })
})

test("setEventCount no escribe si eventCount y score ya son correctos", async () => {
  const { svc, writes } = fake({ analytics: { likes: 0, shares: 0, eventCount: 2, score: 8 } as never, listingComplete: false })
  assert.equal(await svc.setEventCount("s1", 2), null)
  assert.deepEqual(writes, [])
})

test("setEventCount corrige el score aunque el conteo ya coincida (score desfasado)", async () => {
  const { svc, writes } = fake({ analytics: { likes: 0, shares: 0, eventCount: 2, score: 0 } as never, listingComplete: true })
  await svc.setEventCount("s1", 2)
  assert.deepEqual(writes, [{ id: "s1", analytics: { eventCount: 2, score: 2 * 4 + 10 } }])
})

test("setEventCount ignora sitios que no existen", async () => {
  const { svc, writes } = fake(null)
  assert.equal(await svc.setEventCount("nope", 3), null)
  assert.deepEqual(writes, [])
})
