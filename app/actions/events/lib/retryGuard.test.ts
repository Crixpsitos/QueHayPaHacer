import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// Las acciones de "Reintentar" reescriben objetos en Storage: deben exigir permiso de edición, pasar por decideRetry
// (que limita el path al ámbito del evento/sesión) y aplicar el enfriamiento antes de tocar Storage.
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8")
const eventAction = read("../retry-event-media.action.ts")
const sessionAction = read("../retry-session-media.action.ts")
const apply = read("./applyRetry.ts")

test("evento: exige permiso edit_event antes de leer el evento y verifica al dueño", () => {
  assert.ok(eventAction.includes('requireEventPermission(eventId, "edit_event"'))
  assert.ok(eventAction.indexOf("requireEventPermission(") < eventAction.indexOf("getEventById("))
  assert.ok(eventAction.includes("event.author.id !== access.ownerId"))
})

test("sesión: usa el guard de sesiones antes de leer la sesión y limita el path a esa sesión", () => {
  assert.ok(sessionAction.includes("sessionOwnerError(eventId)"))
  assert.ok(sessionAction.indexOf("sessionOwnerError(") < sessionAction.indexOf("getById("))
  assert.ok(sessionAction.includes("sessionScope(sessionId)"))
})

test("ambas acciones solo reescriben lo que decide decideRetry", () => {
  assert.ok(eventAction.includes("decideRetry(") && sessionAction.includes("decideRetry("))
  assert.ok(eventAction.includes("applyRetry(") && sessionAction.includes("applyRetry("))
})

test("applyRetry aplica el enfriamiento antes de reescribir el objeto", () => {
  assert.ok(apply.includes("canRetryNow(age)"))
  assert.ok(apply.indexOf("canRetryNow(") < apply.indexOf("storage.retrigger("))
})
