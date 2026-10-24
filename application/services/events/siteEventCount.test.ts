import { test } from "node:test"
import assert from "node:assert/strict"
import { EventsService } from "./EventsService"
import type { IEventsRepository } from "@/domain/repository/events/IEventsRepository"

const NOW = new Date("2026-10-24T12:00:00Z")
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000)

const service = (events: { status: string; endDate: Date }[], previousSiteIds: string[] = []) => {
  const calls: unknown[] = []
  const repo = {
    findPublishedBySiteId: async (siteId: string, limit: number) => { calls.push({ siteId, limit }); return events },
    updateSiteIds: async (eventId: string, siteIds: string[]) => { calls.push({ eventId, siteIds }); return previousSiteIds },
  } as unknown as IEventsRepository
  return { svc: new EventsService(repo, {} as never), calls }
}

test("countRecentBySiteId cuenta publicados recientes y consulta con un tope amplio", async () => {
  const { svc, calls } = service([
    { status: "published", endDate: day(5) },
    { status: "published", endDate: day(-100) },
    { status: "pending", endDate: day(5) },
  ])
  assert.equal(await svc.countRecentBySiteId("s1", NOW), 1)
  assert.deepEqual(calls, [{ siteId: "s1", limit: 300 }])
})

test("syncSiteIds devuelve los siteIds anteriores para recontar también los que se perdieron", async () => {
  const { svc } = service([], ["A", "B"])
  assert.deepEqual(await svc.syncSiteIds("e1", ["B", "C"]), ["A", "B"])
})
