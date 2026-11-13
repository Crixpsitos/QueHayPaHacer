import { test } from "node:test"
import assert from "node:assert/strict"
import { PlanExtrasService } from "./PlanExtrasService"
import { planKey, type PlanItem } from "@/domain/entities/activities/planItem"

const NOW = new Date("2026-11-12T20:00:00Z") // jueves 3 p. m. en Bogotá
function setup(o: { eventPublished?: boolean; eventEnd?: Date } = {}) {
  const store = new Map<string, PlanItem>()
  const svc = new PlanExtrasService({
    repo: {
      list: async () => [...store.values()],
      get: async (_u, k, id) => store.get(planKey(k, id)) ?? null,
      put: async (_u, it) => void store.set(planKey(it.kind, it.refId), it),
      remove: async (_u, k, id) => void store.delete(planKey(k, id)),
    },
    getEvent: async (id) => (id === "e1" ? { id: "e1", slug: "feria", title: "Feria", venue: "Parque", startDate: new Date("2026-11-14T01:00:00Z"), endDate: o.eventEnd ?? new Date("2026-11-14T04:00:00Z"), imageUrl: null, priceLabel: "Gratis", published: o.eventPublished ?? true } : null),
    getSite: async (id) => (id === "s1" ? { id: "s1", slug: "cafe", name: "Café", coverUrl: null, address: "Calle 1", published: true } : null),
    clock: () => NOW,
  })
  return { svc, store }
}

test("evento: entra con su propio día y hora (el cliente no manda horario)", async () => {
  const { svc } = setup()
  const r = await svc.add("u1", "event", "e1", { date: "2026-11-13", time: "10:00" })
  assert.deepEqual(r.ok && r.item, { kind: "event", refId: "e1", date: "2026-11-13", time: "20:00" }) // 14-nov 01:00Z = 13-nov 8 p. m. Bogotá
})
test("evento terminado, inexistente o sin publicar no se agrega", async () => {
  assert.equal((await setup({ eventEnd: new Date("2026-11-12T10:00:00Z") }).svc.add("u1", "event", "e1")).ok, false)
  assert.equal((await setup().svc.add("u1", "event", "nope")).ok, false)
  assert.equal((await setup({ eventPublished: false }).svc.add("u1", "event", "e1")).ok, false)
})
test("sitio: con día y hora, sin día, y rechaza un día fuera de la semana", async () => {
  const { svc } = setup()
  assert.deepEqual((await svc.add("u1", "site", "s1", { date: "2026-11-15", time: "16:30" })).ok, true)
  const sin = await svc.add("u1", "site", "s1", null)
  assert.deepEqual(sin.ok && sin.item, { kind: "site", refId: "s1", date: null, time: null })
  assert.equal((await svc.add("u1", "site", "s1", { date: "2026-12-30", time: null })).ok, false)
})
test("sitio: una hora sin día se descarta (queda sin día)", async () => {
  const r = await setup().svc.add("u1", "site", "s1", { date: null, time: "15:00" })
  assert.deepEqual(r.ok && r.item, { kind: "site", refId: "s1", date: null, time: null })
})
test("entradas inválidas: tipo, id o sesión", async () => {
  const { svc } = setup()
  assert.equal((await svc.add("", "site", "s1")).ok, false)
  assert.equal((await svc.add("u1", "activity", "s1")).ok, false)
  assert.equal((await svc.add("u1", "site", "../x")).ok, false)
})
test("estado, quitar y «Mis planes» con evento (con horario) y sitio (con y sin día)", async () => {
  const { svc } = setup()
  await svc.add("u1", "event", "e1")
  await svc.add("u1", "site", "s1", { date: "2026-11-15", time: null })
  assert.equal((await svc.state("u1", "site", "s1"))?.date, "2026-11-15")
  const mine = await svc.mine("u1")
  assert.deepEqual(mine.cards.map((c) => c.id), ["event_e1", "site_s1"])
  assert.deepEqual(mine.slots, { event_e1: { date: "2026-11-13", time: "20:00" }, site_s1: { date: "2026-11-15", time: null } })
  await svc.remove("u1", "site", "s1")
  assert.equal(await svc.state("u1", "site", "s1"), null)
  assert.deepEqual((await svc.mine("u1")).cards.map((c) => c.id), ["event_e1"])
})
test("un evento que ya terminó sale solo de «Mis planes»", async () => {
  const { svc, store } = setup({ eventEnd: new Date("2026-11-12T10:00:00Z") })
  store.set("event_e1", { kind: "event", refId: "e1", date: "2026-11-13", time: "20:00" })
  assert.deepEqual((await svc.mine("u1")).cards, [])
})
