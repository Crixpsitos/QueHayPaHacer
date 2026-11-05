import { test } from "node:test"
import assert from "node:assert/strict"
import { SiteDraftSchema, validateSiteForm } from "./SiteDto"
import { SECTIONS_MAX, SECTION_BODY_MAX, SECTION_TITLE_MAX } from "@/domain/entities/sites/value-objects/SiteSections"

const base = { name: "", description: "", address: "", city: "", region: "", country: "", category: "", coordinates: null, media: [], schedule: {} }
const check = (sections?: unknown) => validateSiteForm(SiteDraftSchema, sections === undefined ? base : { ...base, sections })

test("sin sections es válido (campo opcional)", () => assert.equal(check(), null))
test("acepta secciones dentro de los límites", () => assert.equal(check([{ title: "Cómo llegar", body: "Ruta 48" }]), null))
test("rechaza título largo", () => assert.match(check([{ title: "t".repeat(SECTION_TITLE_MAX + 1), body: "x" }])!, /Título de sección/))
test("rechaza cuerpo largo", () => assert.match(check([{ title: "t", body: "b".repeat(SECTION_BODY_MAX + 1) }])!, /Texto de sección/))
test("rechaza demasiadas secciones", () =>
  assert.match(check(Array.from({ length: SECTIONS_MAX + 1 }, () => ({ title: "t", body: "x" })))!, /Máximo \d+ secciones/))
test("rechaza el total excedido", () =>
  assert.match(check(Array.from({ length: 4 }, () => ({ title: "t", body: "b".repeat(SECTION_BODY_MAX) })))!, /suman demasiado/))
