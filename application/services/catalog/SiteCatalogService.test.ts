import { test } from "node:test"
import assert from "node:assert/strict"
import { SiteCatalogService } from "./SiteCatalogService"
import { emptyCatalog, type SiteCatalog } from "@/domain/entities/catalog/SiteCatalog"

const NOW = new Date("2026-11-20T20:00:00Z")
function setup(owner = "u1") {
  const saved = new Map<string, SiteCatalog>()
  const svc = new SiteCatalogService({ repo: { get: async (id) => saved.get(id) ?? null, save: async (id, c) => void saved.set(id, c) }, isOwner: async (uid) => uid === owner, clock: () => NOW })
  return { svc, saved }
}
const product = { id: "a", name: "Monstera", description: "", priceCop: 35000, unit: "unidad" as const, section: "Plantas", photoUrl: "", available: true, tags: [], traces: "", discount: null }

test("quien no es dueño no puede guardar ni abrir el panel, pero la lectura pública funciona", async () => {
  const { svc, saved } = setup()
  assert.deepEqual(await svc.save("otro", "s1", emptyCatalog("s1")), { ok: false, error: "Este sitio no es tuyo." })
  assert.equal(saved.size, 0)
  assert.equal(await svc.getForOwner("otro", "s1"), null)
  assert.equal((await svc.get("s1")).products.length, 0)
})
test("el dueño guarda y se normaliza (teléfono a 10 dígitos, siteId del servidor)", async () => {
  const { svc, saved } = setup()
  const r = await svc.save("u1", "s1", { ...emptyCatalog("OTRO"), whatsapp: "+57 316 000 0000", products: [product] })
  assert.equal(r.ok, true)
  assert.equal(saved.get("s1")?.siteId, "s1")
  assert.equal(saved.get("s1")?.whatsapp, "3160000000")
  assert.equal((await svc.getForOwner("u1", "s1"))?.products[0].name, "Monstera")
})
test("una carta inválida no se guarda y devuelve el motivo", async () => {
  const { svc, saved } = setup()
  const r = await svc.save("u1", "s1", { ...emptyCatalog("s1"), products: [{ ...product, priceCop: -5 }] })
  assert.equal(r.ok, false)
  assert.equal(saved.size, 0)
})
