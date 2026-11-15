import { test } from "node:test"
import assert from "node:assert/strict"
import { SiteSuggestionService } from "./SiteSuggestionService"
import type { ISiteSuggestionRepository } from "@/domain/repository/siteSuggestion/ISiteSuggestionRepository"
import type { SitesService } from "../sites/SitesService"

const make = (siteIds: string[], counts: { seen: string[][]; total: number }) =>
  new SiteSuggestionService(
    { countPendingBySites: async (ids: string[]) => { counts.seen.push(ids); return counts.total }, listBySite: async () => { throw new Error("no debe leer el historial") } } as unknown as ISiteSuggestionRepository,
    { getMySites: async () => siteIds.map((id) => ({ id })) } as unknown as SitesService,
  )

test("pendientes: una sola agregación con los ids de los sitios; sin sitios no consulta", async () => {
  const c = { seen: [] as string[][], total: 3 }
  assert.equal(await make(["a", "b"], c).countPendingForOwner("u1"), 3)
  assert.deepEqual(c.seen, [["a", "b"]])
  const none = { seen: [] as string[][], total: 9 }
  assert.equal(await make([], none).countPendingForOwner("u1"), 0)
  assert.equal(none.seen.length, 0)
})
