import { test } from "node:test"
import assert from "node:assert/strict"
import { filterHref } from "./filterHref"

test("sin filtros va al hub limpio", () => {
  assert.equal(filterHref({}, {}), "/actividades")
})

test("agrega, cambia y quita un filtro conservando los demás", () => {
  assert.equal(filterHref({}, { category: "aire-libre" }), "/actividades?categoria=aire-libre")
  assert.equal(filterHref({ category: "aire-libre" }, { kind: "global" }), "/actividades?categoria=aire-libre&tipo=global")
  assert.equal(filterHref({ category: "aire-libre", kind: "global" }, { category: undefined }), "/actividades?tipo=global")
  assert.equal(filterHref({ kind: "site" }, { kind: "global" }), "/actividades?tipo=global")
  assert.equal(filterHref({ siteSlug: "nebraska" }, { category: "en-familia" }), "/actividades?categoria=en-familia&sitio=nebraska")
})

test("cuándo, presupuesto y con quién viajan en la dirección; un toque en el mismo chip lo quita", () => {
  assert.equal(filterHref({}, { when: "hoy" }), "/actividades?cuando=hoy")
  assert.equal(filterHref({ when: "hoy" }, { budget: "gratis" }), "/actividades?cuando=hoy&presupuesto=gratis")
  assert.equal(filterHref({ when: "hoy", budget: "gratis", companion: "familia" }, { when: undefined }), "/actividades?presupuesto=gratis&con=familia")
  assert.equal(filterHref({ category: "aire-libre", when: "esta-semana" }, { companion: "pareja" }), "/actividades?categoria=aire-libre&cuando=esta-semana&con=pareja")
})
