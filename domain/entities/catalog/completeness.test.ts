import { test } from "node:test"
import assert from "node:assert/strict"
import { catalogStats } from "./completeness"
import { emptyCatalog, type SiteCatalog } from "./SiteCatalog"
import type { Product } from "./Product"

const prod = (id: string, o: Partial<Product> = {}): Product => ({ id, name: id, description: "Algo", priceCop: 1000, unit: "unidad", section: "", photoUrl: "https://x.co/a.jpg", available: true, tags: [], traces: "", discount: null, ...o })
const cat = (o: Partial<SiteCatalog> = {}): SiteCatalog => ({ ...emptyCatalog("s"), whatsapp: "3160000000", ...o })

test("carta vacía: 0 % y sin productos", () => {
  const s = catalogStats(cat(), 0)
  assert.deepEqual([s.products, s.percent], [0, 0])
})
test("carta completa: 100 % y sin consejo", () => {
  const s = catalogStats(cat({ products: [prod("a"), prod("b")] }), 1)
  assert.deepEqual([s.percent, s.tip, s.promotions], [100, null, 1])
})
test("sin foto en uno de dos baja el porcentaje y avisa", () => {
  const s = catalogStats(cat({ products: [prod("a"), prod("b", { photoUrl: "" })] }), 0)
  assert.equal(s.percent, 83)
  assert.equal(s.tip, "Faltan fotos en 1 producto")
  assert.equal(s.withoutPhoto, 1)
})
test("sin WhatsApp el primer consejo es ponerlo; cuenta solo disponibles", () => {
  const s = catalogStats(cat({ whatsapp: "", products: [prod("a"), prod("b", { available: false })] }), 0)
  assert.match(s.tip ?? "", /WhatsApp/)
  assert.equal(s.available, 1)
})
