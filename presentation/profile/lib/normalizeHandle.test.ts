import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeHandle } from "./normalizeHandle"

// La clave de caché y la etiqueta de invalidación del perfil público salen de este handle limpio.
test("normalizeHandle: @, %40 y espacios dan la misma clave", () => {
  for (const raw of ["cristianpena", "@cristianpena", "%40cristianpena", " %2540cristianpena "]) {
    assert.equal(normalizeHandle(raw), "cristianpena")
  }
})

test("normalizeHandle: handle vacío o malformado no revienta", () => {
  assert.equal(normalizeHandle("@"), "")
  assert.equal(normalizeHandle("%E0%A4%A"), "%E0%A4%A")
})
