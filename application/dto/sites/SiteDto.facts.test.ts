import { test } from "node:test"
import assert from "node:assert/strict"
import { SiteDraftSchema, validateSiteForm } from "./SiteDto"
import { FACTS_MAX, FACT_LABEL_MAX, FACT_VALUE_MAX } from "@/domain/entities/sites/value-objects/SiteFacts"

const base = { name: "", description: "", address: "", city: "", region: "", country: "", category: "", coordinates: null, media: [], schedule: {} }
const check = (facts?: unknown) => validateSiteForm(SiteDraftSchema, facts === undefined ? base : { ...base, facts })
const ok = { icon: "price", label: "Entrada", value: "$20.000" }

test("sin facts es válido", () => assert.equal(check(), null))
test("acepta datos dentro de los límites", () => assert.equal(check([ok]), null))
test("rechaza icono fuera del catálogo", () => assert.match(check([{ ...ok, icon: "zzz" }])!, /Icono inválido/))
test("rechaza etiqueta y dato largos", () => {
  assert.match(check([{ ...ok, label: "l".repeat(FACT_LABEL_MAX + 1) }])!, /Etiqueta del dato/)
  assert.match(check([{ ...ok, value: "v".repeat(FACT_VALUE_MAX + 1) }])!, /Dato rápido/)
})
test("rechaza más de 6", () => assert.match(check(Array.from({ length: FACTS_MAX + 1 }, () => ok))!, /Máximo \d+ datos/))
