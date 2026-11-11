import { test } from "node:test"
import assert from "node:assert/strict"
import { activityPublishError, plainTextError } from "./Activity"
import { makeActivity, makeImage } from "./activity.fixture"

test("una actividad completa se puede publicar", () => {
  assert.equal(activityPublishError(makeActivity()), null)
})

test("título: 3 a 80 caracteres", () => {
  assert.match(activityPublishError(makeActivity({ title: "ab" }))!, /título/i)
  assert.match(activityPublishError(makeActivity({ title: "x".repeat(81) }))!, /título/i)
})

test("descripción: mínimo 20, y sin HTML ni enlaces", () => {
  assert.match(activityPublishError(makeActivity({ description: "muy corta" }))!, /descripción/i)
  assert.match(activityPublishError(makeActivity({ description: "Visita https://mi-sitio.com para saber más de esta salida." }))!, /enlaces/i)
  assert.match(activityPublishError(makeActivity({ description: "Escríbenos a www.ejemplo.co para reservar tu cupo hoy." }))!, /enlaces/i)
  assert.match(activityPublishError(makeActivity({ description: "Salida con <script>alert(1)</script> y almuerzo incluido." }))!, /etiquetas/i)
})

test("plainTextError deja pasar texto normal con puntos y números", () => {
  assert.equal(plainTextError("X", "Sale a las 6.30 a. m. con 10 personas, cuesta $40.000."), null)
})

test("sitio vs global: coherencia de siteId", () => {
  assert.match(activityPublishError(makeActivity({ kind: "site", siteId: null }))!, /sitio/i)
  assert.match(activityPublishError(makeActivity({ kind: "global", siteId: "s1" }))!, /global/i)
  assert.equal(activityPublishError(makeActivity({ kind: "site", siteId: "s1" })), null)
})

test("punto de encuentro: fijo exige texto; compartido o variable no", () => {
  assert.match(activityPublishError(makeActivity({ meetingPoint: { mode: "fixed", text: "", references: "", geo: null } }))!, /punto de encuentro/i)
  assert.equal(activityPublishError(makeActivity({ meetingPoint: { mode: "sharedAfterJoining", text: "", references: "", geo: null } })), null)
  assert.equal(activityPublishError(makeActivity({ meetingPoint: { mode: "varies", text: "", references: "", geo: null } })), null)
})

test("exactamente una portada", () => {
  assert.match(activityPublishError(makeActivity({ media: [] }))!, /portada/i)
  assert.match(activityPublishError(makeActivity({ media: [makeImage("a", true), makeImage("b", true)] }))!, /portada/i)
  assert.match(activityPublishError(makeActivity({ media: [makeImage("a", false)] }))!, /portada/i)
  assert.match(activityPublishError(makeActivity({ media: [makeImage("a", true, { status: "error" })] }))!, /procesar/i)
})

test("categoría, con quién, dificultad y duración", () => {
  assert.match(activityPublishError(makeActivity({ category: "nada" as "otros" }))!, /categoría/i)
  assert.match(activityPublishError(makeActivity({ companions: ["amigos", "amigos"] }))!, /con quién/i)
  assert.match(activityPublishError(makeActivity({ difficulty: "extrema" as "easy" }))!, /dificultad/i)
  assert.match(activityPublishError(makeActivity({ durationMinutes: 5 }))!, /duración/i)
  assert.equal(activityPublishError(makeActivity({ difficulty: null, durationMinutes: null })), null)
})

test("propaga los errores de horario y precio", () => {
  assert.match(activityPublishError(makeActivity({ schedule: { rules: [], skipDates: [], requiresReservation: false } }))!, /regla/i)
  assert.match(activityPublishError(makeActivity({ priceOptions: [] }))!, /precio/i)
})

test("fotos: máximo 9, un solo video y texto alternativo corto", () => {
  const diez = Array.from({ length: 10 }, (_, i) => makeImage(`i${i}`, i === 0))
  assert.match(activityPublishError(makeActivity({ media: diez }))!, /máximo 9/i)
  const video = (id: string) => ({ ...makeImage(id, false), type: "video" as const })
  assert.match(activityPublishError(makeActivity({ media: [makeImage("c", true), video("v1"), video("v2")] }))!, /un video/i)
  assert.equal(activityPublishError(makeActivity({ media: [makeImage("c", true), video("v1")] })), null)
  assert.match(activityPublishError(makeActivity({ media: [makeImage("c", true, { alt: "x".repeat(126) })] }))!, /alternativo/i)
})
