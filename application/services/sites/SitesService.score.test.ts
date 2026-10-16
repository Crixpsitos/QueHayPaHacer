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
