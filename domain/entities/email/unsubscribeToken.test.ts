import { test } from "node:test"
import assert from "node:assert/strict"
import { unsubscribeHeaders, unsubscribeToken, verifyUnsubscribeToken } from "./unsubscribeToken"

test("el token valida solo para ese uid y ese secreto", () => {
  const t = unsubscribeToken("u1", "s3cret")
  assert.equal(verifyUnsubscribeToken("u1", t, "s3cret"), true)
  assert.equal(verifyUnsubscribeToken("u2", t, "s3cret"), false)
  assert.equal(verifyUnsubscribeToken("u1", t, "otro"), false)
  assert.equal(verifyUnsubscribeToken("u1", "x".repeat(32), "s3cret"), false)
})
test("sin secreto o con token raro no hay baja", () => {
  assert.equal(verifyUnsubscribeToken("u1", unsubscribeToken("u1", "s"), undefined), false)
  for (const bad of [undefined, null, 5, "", "ab"]) assert.equal(verifyUnsubscribeToken("u1", bad, "s"), false)
})
test("cabeceras List-Unsubscribe de un clic (RFC 8058)", () => {
  const h = unsubscribeHeaders("https://x.co", "u 1", "s")
  assert.match(h.link, /^https:\/\/x\.co\/baja\?u=u%201&t=[a-f0-9]{32}$/)
  assert.match(h.headers["List-Unsubscribe"], /^<https:\/\/x\.co\/api\/email\/unsubscribe\?u=u%201&t=/)
  assert.equal(h.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click")
})
