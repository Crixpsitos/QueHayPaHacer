import { test } from "node:test"
import assert from "node:assert/strict"
import { SiteTransitService } from "./SiteTransitService"
import { TransitRouteService } from "../config/TransitRouteService"
import type { SitesService } from "./SitesService"
import type { ConfigDoc, IConfigRepository } from "@/domain/repository/config/IConfigRepository"
import type { ISiteTransitReportRepository } from "@/domain/repository/siteTransit/ISiteTransitReportRepository"
import type { SiteTransit } from "@/domain/entities/sites/value-objects/SiteTransit"

type Snap = { name: string; authorId: string | null; isPublic: boolean; transit: SiteTransit | null }

function setup(site: Snap | null, catalog = [{ id: "2", label: "Ruta 2" }, { id: "6", label: "Ruta 6" }]) {
  const store = new Map<string, ConfigDoc<unknown>>([["transit-routes", { data: { routes: catalog }, updatedAt: 1, updatedBy: "a" }]])
  const config: IConfigRepository = {
    get: async <T,>(k: string) => (store.get(k) as ConfigDoc<T> | undefined) ?? null,
    set: async (k, data, by) => { store.set(k, { data, updatedAt: 2, updatedBy: by }) },
    delete: async (k) => { store.delete(k) },
  }
  const docs = new Map<string, { uid: string; at: number }>()
  const reports: ISiteTransitReportRepository = {
    getAt: async (s, u) => docs.get(`${s}_${u}`)?.at ?? null,
    save: async (s, u, at) => { docs.set(`${s}_${u}`, { uid: u, at }) },
    listBySite: async () => [...docs.values()],
  }
  let clock = 5000
  const sites = { getTransitSnapshot: async () => site } as unknown as SitesService
  const svc = new SiteTransitService(reports, sites, new TransitRouteService(config), () => ++clock)
  return { svc, docs, tick: (to: number) => { clock = to } }
}

const site = (over: Partial<Snap> = {}): Snap => ({ name: "Café", authorId: "owner", isPublic: true, transit: { routes: [{ id: "2" }], updatedAt: 1000 }, ...over })

test("resolveForSave: valida contra el catálogo y fija updatedAt en el servidor", async () => {
  const { svc } = setup(null)
  const out = await svc.resolveForSave({ routes: [{ id: "2", note: "Cl 60" }, { id: "99" }], updatedAt: 1 })
  assert.deepEqual(out, { routes: [{ id: "2", note: "Cl 60" }], updatedAt: 5001 })
  assert.equal(await svc.resolveForSave({ routes: [{ id: "99" }] }), null)
})

test("resolveForSave: si el bloque no cambió conserva su updatedAt; si cambió, lo renueva", async () => {
  const { svc } = setup(site())
  assert.equal((await svc.resolveForSave({ routes: [{ id: "2" }] }, "s1"))?.updatedAt, 1000)
  assert.equal((await svc.resolveForSave({ routes: [{ id: "2", note: "nueva" }] }, "s1"))?.updatedAt, 5001)
  assert.equal(await svc.resolveForSave({ routes: [] }, "s1"), null)
})

test("resolveForSave: una ruta retirada del catálogo no cuenta como cambio del autor", async () => {
  const { svc } = setup(site({ transit: { routes: [{ id: "2" }, { id: "77" }], updatedAt: 1000 } }))
  const out = await svc.resolveForSave({ routes: [{ id: "2" }, { id: "77" }] }, "s1")
  assert.equal(out?.updatedAt, 1000)
})

test("report: el autor, un sitio no público o sin buses no pueden recibir reportes", async () => {
  assert.equal((await setup(site()).svc.report("owner", "s1")).success, false)
  assert.equal((await setup(site({ isPublic: false })).svc.report("u1", "s1")).success, false)
  assert.equal((await setup(site({ transit: null })).svc.report("u1", "s1")).success, false)
  assert.equal((await setup(null).svc.report("u1", "s1")).success, false)
})

test("report: una vez por persona; 3 distintas pasan a por confirmar", async () => {
  const { svc } = setup(site())
  const first = await svc.report("u1", "s1")
  assert.ok(first.success && first.count === 1 && !first.reachedThreshold)
  assert.equal((await svc.report("u1", "s1")).success, false)
  await svc.report("u2", "s1")
  const third = await svc.report("u3", "s1")
  assert.ok(third.success && third.count === 3 && third.reachedThreshold && third.authorId === "owner")
  const view = await svc.getView("s1")
  assert.equal(view?.unconfirmed, true)
  assert.equal(view?.byReports, true)
})

test("los reportes anteriores a la última confirmación no cuentan y la persona puede volver a reportar", async () => {
  const { svc, docs, tick } = setup(site({ transit: { routes: [{ id: "2" }], updatedAt: 9000 } }))
  tick(10000)
  docs.set("s1_u1", { uid: "u1", at: 8000 })
  assert.equal((await svc.getView("s1"))?.unconfirmed, false)
  const again = await svc.report("u1", "s1")
  assert.ok(again.success && again.count === 1)
})

test("getView: una ruta cambiada después de la confirmación pone el sitio por confirmar", async () => {
  const { svc } = setup(site(), [{ id: "2", label: "Ruta 2", changedAt: 2000 } as never])
  const view = await svc.getView("s1")
  assert.deepEqual(view?.changedLabels, ["Ruta 2"])
  assert.equal(view?.unconfirmed, true)
})
