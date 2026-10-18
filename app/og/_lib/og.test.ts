import { test } from "node:test"
import assert from "node:assert/strict"
import { coverToJpeg, isAllowedCoverUrl } from "./og"

test("solo se descargan portadas https de hosts permitidos", () => {
  assert.ok(isAllowedCoverUrl("https://storage.googleapis.com/bucket/public/sites/x/cover.webp"))
  assert.ok(isAllowedCoverUrl("https://firebasestorage.googleapis.com/v0/b/x/o/y?alt=media"))
  assert.equal(isAllowedCoverUrl("http://storage.googleapis.com/bucket/x.webp"), null) // sin https
  assert.equal(isAllowedCoverUrl("https://evil.example.com/x.jpg"), null) // host no permitido
  assert.equal(isAllowedCoverUrl("https://storage.googleapis.com.evil.com/x.jpg"), null) // subdominio engañoso
  assert.equal(isAllowedCoverUrl("file:///etc/passwd"), null)
  assert.equal(isAllowedCoverUrl("no es una url"), null)
  assert.equal(isAllowedCoverUrl(undefined), null)
  assert.equal(isAllowedCoverUrl(""), null)
})

test("coverToJpeg devuelve null sin descargar cuando la URL no es válida", async () => {
  assert.equal(await coverToJpeg("https://evil.example.com/x.jpg"), null)
  assert.equal(await coverToJpeg(null), null)
})
