import { test } from "node:test"
import assert from "node:assert/strict"
import { TransitRouteService, parseTransitRoutes } from "./TransitRouteService"
import type { ConfigDoc, IConfigRepository } from "@/domain/repository/config/IConfigRepository"

const fakeRepo = () => {
  const store = new Map<string, ConfigDoc<unknown>>()
  const repo: IConfigRepository = {
    get: async <T,>(k: string) => (store.get(k) as ConfigDoc<T> | undefined) ?? null,
    set: async (k, data, by) => { store.set(k, { data, updatedAt: 2, updatedBy: by }) },
    delete: async (k) => { store.delete(k) },
  }
  return { repo, store }
}

test("parseTransitRoutes valida id, nombre, repetidos y tope", () => {
  assert.equal(parseTransitRoutes([{ id: "4-7", label: " Ruta 4/7 ", operator: "X" }]).ok, true)
  assert.equal(parseTransitRoutes([{ id: "a b", label: "X" }]).ok, false)
  assert.equal(parseTransitRoutes([{ id: "12345678901", label: "X" }]).ok, false)
  assert.equal(parseTransitRoutes([{ id: "1", label: "A" }, { id: "1", label: "B" }]).ok, false)
  assert.equal(parseTransitRoutes([{ id: "1", label: "" }]).ok, false)
  assert.equal(parseTransitRoutes([{ id: "1", label: "x".repeat(41) }]).ok, false)
  assert.equal(parseTransitRoutes([{ id: "1", label: "A", changedAt: -1 }]).ok, false)
  assert.equal(parseTransitRoutes("x").ok, false)
  assert.equal(parseTransitRoutes(Array.from({ length: 121 }, (_, i) => ({ id: String(i), label: "R" }))).ok, false)
  const ok = parseTransitRoutes([{ id: "1", label: " A ", changedAt: 5 }])
  assert.ok(ok.ok && ok.routes[0].label === "A" && ok.routes[0].changedAt === 5)
})

test("list ordena de forma natural; sin documento devuelve vacío", async () => {
  const { repo } = fakeRepo()
  const svc = new TransitRouteService(repo)
  assert.deepEqual(await svc.list(), [])
  await svc.save([{ id: "10", label: "Ruta 10" }, { id: "2", label: "Ruta 2" }], "admin")
  assert.deepEqual((await svc.list()).map((r) => r.id), ["2", "10"])
})

test("markChanged pone changedAt solo a esa ruta; id desconocido no cambia nada", async () => {
  const { repo } = fakeRepo()
  const svc = new TransitRouteService(repo)
  await svc.save([{ id: "2", label: "Ruta 2" }, { id: "6", label: "Ruta 6" }], "admin")
  assert.equal(await svc.markChanged("99", "admin", 123), false)
  assert.equal(await svc.markChanged("6", "admin", 123), true)
  const list = await svc.list()
  assert.equal(list.find((r) => r.id === "6")?.changedAt, 123)
  assert.equal(list.find((r) => r.id === "2")?.changedAt, undefined)
})

test("seed no pisa un catálogo existente", async () => {
  const { repo } = fakeRepo()
  const svc = new TransitRouteService(repo)
  assert.equal(await svc.seed([{ id: "1", label: "Ruta 1" }], "script"), "created")
  assert.equal(await svc.seed([{ id: "2", label: "Ruta 2" }], "script"), "exists")
  assert.deepEqual((await svc.list()).map((r) => r.id), ["1"])
})
