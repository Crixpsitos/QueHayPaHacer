import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// Toda acción que guarda un vínculo evento→sitio debe validar en el servidor que el sitio sea propio del dueño
// del evento: el selector del wizard filtra, pero un cliente puede mandar cualquier `location.siteId`.
// migrate-event-type no valida a propósito: solo copia un vínculo que ya estaba guardado.
const GUARDED: [string, string][] = [
  ["create-draft-event.action.ts", "siteLinkError("],
  ["update-event.action.ts", "siteLinkError("],
  ["publish-event.action.ts", "siteLinkError("],
  ["create-event-session.action.ts", "sessionSiteLinkError("],
  ["update-event-session.action.ts", "sessionSiteLinkError("],
  ["save-draft-session.action.ts", "sessionSiteLinkError("],
]

for (const [file, call] of GUARDED) {
  test(`${file} valida el vínculo con el sitio en el servidor`, () => {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    assert.ok(src.includes(call), `${file} debe llamar a ${call}`)
  })
}

test("el selector del wizard solo ofrece sitios vinculables", () => {
  const src = readFileSync(new URL("../../sites/get-user-sites-for-picker.action.ts", import.meta.url), "utf8")
  assert.ok(src.includes("isLinkableSite"))
})
