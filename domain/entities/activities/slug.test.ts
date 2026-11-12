import { test } from "node:test"
import assert from "node:assert/strict"
import { slugifyActivity, uniqueSlug, SLUG_MAX } from "./slug"
import { normalizeSearchQuery, SEARCH_QUERY_MAX } from "./searchQuery"

test("slug: minúsculas, sin tildes ni símbolos, con guiones", () => {
  assert.equal(slugifyActivity("Senderismo los Domingos ¡Con almuerzo!"), "senderismo-los-domingos-con-almuerzo")
  assert.equal(slugifyActivity("  Café & Lectura  "), "cafe-lectura")
})

test("slug: máximo 60 y sin guion al final", () => {
  const s = slugifyActivity("a".repeat(59) + " b" + " c".repeat(10))
  assert.ok(s.length <= SLUG_MAX)
  assert.ok(!s.endsWith("-"))
})

test("slug: título vacío o de símbolos cae a 'actividad'", () => {
  assert.equal(slugifyActivity("¡¡¡"), "actividad")
  assert.equal(slugifyActivity(""), "actividad")
})

test("uniqueSlug: usa la base si está libre y numera si choca", async () => {
  assert.equal(await uniqueSlug("yoga", async () => false), "yoga")
  const taken = new Set(["yoga", "yoga-2"])
  assert.equal(await uniqueSlug("yoga", async (s) => taken.has(s)), "yoga-3")
})

test("uniqueSlug: el sufijo cabe en el máximo", async () => {
  const base = "a".repeat(SLUG_MAX)
  const taken = new Set([base])
  const s = await uniqueSlug(base, async (x) => taken.has(x))
  assert.ok(s.length <= SLUG_MAX)
  assert.notEqual(s, base)
})

test("búsqueda: recorta, colapsa espacios, quita control y limita el largo", () => {
  assert.equal(normalizeSearchQuery("  senderismo   domingo  "), "senderismo domingo")
  assert.equal(normalizeSearchQuery("a\u0000b\u0007c"), "abc")
  assert.equal(normalizeSearchQuery("x".repeat(200)).length, SEARCH_QUERY_MAX)
  assert.equal(normalizeSearchQuery(undefined), "")
  assert.equal(normalizeSearchQuery(42 as unknown as string), "")
})

test("búsqueda: un salto de línea separa palabras en vez de pegarlas", () => {
  assert.equal(normalizeSearchQuery("senderismo\ndomingo"), "senderismo domingo")
})

test("un título que sería una ruta reservada recibe sufijo (no choca con /actividades/crear ni /actividades/mis)", () => {
  assert.equal(slugifyActivity("Crear"), "crear-actividad")
  assert.equal(slugifyActivity("MIS"), "mis-actividad")
  assert.equal(slugifyActivity("Crear cerámica"), "crear-ceramica")
})
