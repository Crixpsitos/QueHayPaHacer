import { test } from "node:test"
import assert from "node:assert/strict"
import type { IActivityEngagementRepository } from "@/domain/repository/activities/IActivityEngagementRepository"
import { ActivityEngagementService } from "./ActivityEngagementService"

class FakeRepo implements IActivityEngagementRepository {
  saved = new Set<string>()
  visited = new Set<string>()
  saves: Record<string, number> = {}
  slots: Record<string, { date: string; time: string | null }> = {}
  async setPlanSlot(uid: string, id: string, slot: { date: string; time: string | null } | null) { if (!this.saved.has(`${uid}|${id}`)) return false; if (slot) this.slots[id] = slot; else delete this.slots[id]; return true }
  async listPlanSlots() { return this.slots }
  visits: Record<string, number> = {}
  async setSaved(uid: string, id: string, saved: boolean) {
    const k = `${uid}|${id}`
    if (saved === this.saved.has(k)) return { changed: false }
    if (saved) this.saved.add(k); else this.saved.delete(k)
    this.saves[id] = (this.saves[id] ?? 0) + (saved ? 1 : -1)
    return { changed: true }
  }
  async savedAmong(uid: string, ids: string[]) { return ids.filter((i) => this.saved.has(`${uid}|${i}`)) }
  async markVisited(uid: string, id: string) {
    const k = `${uid}|${id}`
    if (this.visited.has(k)) return { changed: false }
    this.visited.add(k); this.visits[id] = (this.visits[id] ?? 0) + 1
    return { changed: true }
  }
  async hasVisited(uid: string, id: string) { return this.visited.has(`${uid}|${id}`) }
  async listSavedIds(uid: string) { return [...this.saved].filter((k) => k.startsWith(`${uid}|`)).map((k) => k.split("|")[1]) }
  async listVisitedIds(uid: string) { return [...this.visited].filter((k) => k.startsWith(`${uid}|`)).map((k) => k.split("|")[1]) }
  async listSaverIds(id: string) { return [...this.saved].filter((k) => k.endsWith(`|${id}`)).map((k) => k.split("|")[0]) }
  async recordTrack() {}
}

const make = (publicIds: string[] = ["a1"]) => {
  const repo = new FakeRepo()
  return { repo, svc: new ActivityEngagementService(repo, async (id) => publicIds.includes(id)) }
}

test("guardar es idempotente: doble toque cuenta una sola vez", async () => {
  const { repo, svc } = make()
  await svc.setSaved("u1", "a1", true)
  await svc.setSaved("u1", "a1", true)
  assert.equal(repo.saves.a1, 1)
})

test("quitar de guardados libera y es idempotente (nunca negativo)", async () => {
  const { repo, svc } = make()
  await svc.setSaved("u1", "a1", true)
  await svc.setSaved("u1", "a1", false)
  await svc.setSaved("u1", "a1", false)
  assert.equal(repo.saves.a1, 0)
})

test("no se puede guardar una actividad que no es pública, pero sí quitarla", async () => {
  const { repo, svc } = make(["a1"])
  await assert.rejects(svc.setSaved("u1", "pend", true), /no existe/i)
  repo.saved.add("u1|gone")
  await svc.setSaved("u1", "gone", false) // pausada después de guardarla: debe poder quitarla
  assert.equal(repo.saved.has("u1|gone"), false)
})

test("exige uid y id", async () => {
  const { svc } = make()
  await assert.rejects(svc.setSaved("", "a1", true))
  await assert.rejects(svc.setSaved("u1", " ", true))
  await assert.rejects(svc.markVisited("", "a1"))
})

test("cada persona guarda por separado", async () => {
  const { svc } = make()
  await svc.setSaved("u1", "a1", true)
  assert.deepEqual(await svc.savedAmong("u1", ["a1"]), ["a1"])
  assert.deepEqual(await svc.savedAmong("u2", ["a1"]), [])
  assert.deepEqual(await svc.savedAmong("", ["a1"]), [])
})

test("'Yo fui' cuenta una vez por persona y solo en actividades públicas", async () => {
  const { repo, svc } = make()
  await svc.markVisited("u1", "a1")
  await svc.markVisited("u1", "a1")
  await svc.markVisited("u2", "a1")
  assert.equal(repo.visits.a1, 2)
  await assert.rejects(svc.markVisited("u1", "pend"), /no existe/i)
  assert.equal(await svc.hasVisited("u1", "a1"), true)
  assert.equal(await svc.hasVisited("u3", "a1"), false)
})

test("elegir día y hora: solo de lo guardado, dentro de la semana y con hora válida", async () => {
  const repo = new FakeRepo()
  const svc = new ActivityEngagementService(repo, async () => true)
  await svc.setSaved("u1", "a1", true)
  assert.equal(await svc.setPlanSlot("u1", "a1", { date: "2026-11-14", time: "16:30" }, "2026-11-12"), true)
  assert.deepEqual(await svc.planSlots("u1"), { a1: { date: "2026-11-14", time: "16:30" } })
  assert.equal(await svc.setPlanSlot("u1", "no-guardada", { date: "2026-11-14", time: null }, "2026-11-12"), false)
  await assert.rejects(() => svc.setPlanSlot("u1", "a1", { date: "2026-11-30", time: null }, "2026-11-12"), /semana/)
  await assert.rejects(() => svc.setPlanSlot("u1", "a1", { date: "2026-11-14", time: "25:99" }, "2026-11-12"), /hora/)
  assert.equal(await svc.setPlanSlot("u1", "a1", null, "2026-11-12"), true)
})
