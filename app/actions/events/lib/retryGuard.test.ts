import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// retryEventMediaAction reescribe objetos en Storage: debe exigir permiso de edición sobre el evento, comprobar que el
// evento es del dueño y no tocar Storage sin pasar por decideRetry (que limita el path a la carpeta del evento).
const src = readFileSync(new URL("../retry-event-media.action.ts", import.meta.url), "utf8")

test("exige permiso edit_event antes de leer el evento", () => {
  assert.ok(src.includes('requireEventPermission(eventId, "edit_event"'))
  assert.ok(src.indexOf("requireEventPermission(") < src.indexOf("getEventById("))
})

test("verifica que el evento pertenezca al dueño", () => {
  assert.ok(src.includes("event.author.id !== access.ownerId"))
})

test("solo reescribe el path que devuelve decideRetry", () => {
  assert.ok(src.includes("decideRetry("))
  assert.ok(src.includes("storageService.retrigger(decision.path)"))
  assert.ok(src.indexOf("decideRetry(") < src.indexOf("storageService.retrigger("))
})
