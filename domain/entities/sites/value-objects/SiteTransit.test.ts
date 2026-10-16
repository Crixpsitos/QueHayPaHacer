import { test } from "node:test"
import assert from "node:assert/strict"
import { buildTransitView, normalizeTransit, sameTransit, type TransitRoute } from "./SiteTransit"

const catalog: TransitRoute[] = [{ id: "2", label: "Ruta 2" }, { id: "6", label: "Ruta 6" }, { id: "47", label: "Ruta 47", changedAt: 2000 }]
const ids = catalog.map((r) => r.id)

test("normalizeTransit descarta ids fuera del catálogo y duplicados, recorta notas", () => {
  const out = normalizeTransit({ routes: [{ id: "2", note: `  ${"x".repeat(200)} ` }, { id: "2" }, { id: "99" }, { id: 6 }, { id: "6", note: "  " }] }, ids)
  assert.deepEqual(out, { routes: [{ id: "2", note: "x".repeat(120) }, { id: "6" }] })
})

test("normalizeTransit: máximo 8 rutas y vacío = sin dato", () => {
  const many = Array.from({ length: 10 }, (_, i) => String(i + 1))
  assert.equal(normalizeTransit({ routes: many.map((id) => ({ id })) }, many)?.routes.length, 8)
  assert.equal(normalizeTransit({ routes: [{ id: "99" }] }, ids), undefined)
  assert.equal(normalizeTransit(null, ids), undefined)
  assert.equal(normalizeTransit({ routes: "x" }, ids), undefined)
})

test("sameTransit ignora el orden pero no las notas", () => {
  assert.equal(sameTransit({ routes: [{ id: "2" }, { id: "6" }] }, { routes: [{ id: "6" }, { id: "2" }] }), true)
  assert.equal(sameTransit({ routes: [{ id: "2", note: "a" }] }, { routes: [{ id: "2" }] }), false)
  assert.equal(sameTransit(undefined, { routes: [] }), true)
})

test("buildTransitView: ok, por reportes y por ruta cambiada", () => {
  const t = { routes: [{ id: "2", note: "Cl 60" }], updatedAt: 1000 }
  const ok = buildTransitView(t, catalog, 2)
  assert.equal(ok?.unconfirmed, false)
  assert.deepEqual(ok?.routes, [{ id: "2", label: "Ruta 2", note: "Cl 60" }])
  assert.equal(buildTransitView(t, catalog, 3)?.byReports, true)
  assert.equal(buildTransitView(t, catalog, 3)?.unconfirmed, true)
  const changed = buildTransitView({ routes: [{ id: "47" }], updatedAt: 1000 }, catalog, 0)
  assert.deepEqual(changed?.changedLabels, ["Ruta 47"])
  assert.equal(changed?.unconfirmed, true)
  // reconfirmado después del cambio: ya no hay aviso
  assert.equal(buildTransitView({ routes: [{ id: "47" }], updatedAt: 3000 }, catalog, 0)?.unconfirmed, false)
})

test("buildTransitView: sin dato o sin rutas vigentes en el catálogo no hay vista", () => {
  assert.equal(buildTransitView(undefined, catalog, 0), null)
  assert.equal(buildTransitView({ routes: [{ id: "88" }], updatedAt: 1 }, catalog, 0), null)
})
