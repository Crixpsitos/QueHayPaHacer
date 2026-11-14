import { test } from "node:test"
import assert from "node:assert/strict"
import { buildGuia, guiaStatus, landingCategories, scopeGuia, type GuiaSiteIn } from "./buildGuia"

const day = { open: "08:00", close: "21:00", closed: false }
const schedule = { monday: day, tuesday: day, wednesday: day, thursday: day, friday: day, saturday: day, sunday: { open: "", close: "", closed: true } }
const site = (id: string, o: Partial<GuiaSiteIn> = {}): GuiaSiteIn => ({ id, slug: id, name: id, category: "cafe", address: "Cra 3", coverUrl: null, lat: 4.44, lng: -75.23, schedule, policy: null, closed: false, price: "", likes: 0, ...o })
// sábado 14 nov 2026, 3:00 pm en Bogotá
const NOW = new Date("2026-11-14T20:00:00.000Z")

test("orden: con evento, con promo, más guardados; planes solo con sitios y sumando sus tipos", () => {
  const v = buildGuia({
    sites: [site("a", { likes: 9 }), site("b", { category: "ice_cream" }), site("c", { category: "bar" }), site("d", { category: "gym", likes: 3 })],
    live: new Map([["c", "Hoy 9:00 pm: comedia"]]), promos: { b: "2×1" }, featuredIds: ["d", "zz", "a"], now: NOW,
  })
  assert.deepEqual(v.sites.map((s) => s.id), ["c", "b", "a", "d"])
  assert.deepEqual(v.plans.map((p) => [p.key, p.count, p.href]), [["tomar", 1, "/donde-ir-bares-ibague"], ["cafe", 2, "/donde-ir-cafeterias-ibague"]])
  assert.deepEqual(v.featuredIds, ["d", "a"])
  assert.equal(v.sites[0].href, "/donde-ir/c")
})

test("precio del dato rápido: va en la línea del tipo y marca entrada libre", () => {
  const [s] = buildGuia({ sites: [site("p", { category: "park", price: "Entrada libre" })], live: new Map(), promos: {}, now: NOW }).sites
  assert.equal(s.kind, "Parque · Entrada libre")
  assert.equal(s.free, true)
})

test("página por tipo: Cafeterías incluye heladerías; Museos solo museos", () => {
  assert.deepEqual(landingCategories("cafe"), ["cafe", "ice_cream"])
  assert.deepEqual(landingCategories("museum"), ["museum"])
  const v = buildGuia({ sites: [site("a"), site("b", { category: "ice_cream" }), site("c", { category: "bar" })], live: new Map(), promos: {}, now: NOW })
  assert.deepEqual(scopeGuia(v, landingCategories("cafe")).sites.map((s) => s.id), ["a", "b"])
})

test("estado corto: abierto, abre más tarde, cerrado hoy, cierre temporal y sin horario", () => {
  const s = site("a")
  assert.deepEqual(guiaStatus(s, NOW), { isOpen: true, label: "Abierto hasta 9:00 pm", short: "Cierra 9:00 pm" })
  assert.deepEqual(guiaStatus(s, new Date("2026-11-14T11:00:00.000Z")), { isOpen: false, label: "Abre 8:00 am", short: "Abre 8:00 am" }) // 6 am
  assert.deepEqual(guiaStatus(s, new Date("2026-11-15T20:00:00.000Z")), { isOpen: false, label: "Cerrado hoy", short: "Cerrado hoy" }) // domingo
  assert.equal(guiaStatus({ ...s, closed: true }, NOW).label, "Cerrado temporalmente")
  assert.deepEqual(guiaStatus({ ...s, schedule: null }, NOW), { isOpen: false, label: "", short: "" })
})
