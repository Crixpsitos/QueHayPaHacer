import { test } from "node:test"
import assert from "node:assert/strict"
import { isSiteSubject, siteIdOfSubject, siteSubject } from "./subject"

test("sujeto de sitio: ida y vuelta; ids de actividad no lo son", () => {
  assert.equal(siteIdOfSubject(siteSubject("abc123")), "abc123")
  assert.equal(isSiteSubject(siteSubject("abc123")), true)
  assert.equal(isSiteSubject("Zk3j9actividad"), false)
  assert.equal(isSiteSubject("site_"), false)
})
