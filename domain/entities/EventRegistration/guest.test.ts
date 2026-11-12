import { test } from "node:test"
import assert from "node:assert/strict"
import { cleanGuest, entryCode, entryMessage, isGuestId } from "./guest"

test("limpia el nombre y valida el WhatsApp opcional", () => {
  assert.deepEqual(cleanGuest({ name: "  Ana   María  ", phone: "300 123 4567" }), { ok: true, name: "Ana María", phone: "3001234567" })
  assert.deepEqual(cleanGuest({ name: "Luis", phone: "+57 300 123 4567" }), { ok: true, name: "Luis", phone: "3001234567" })
  assert.deepEqual(cleanGuest({ name: "Luis" }), { ok: true, name: "Luis", phone: null })
  assert.equal(cleanGuest({ name: "A" }).ok, false)
  assert.equal(cleanGuest({ name: "Ana", phone: "12345" }).ok, false)
})
test("código de entrada: acepta formato con guiones y minúsculas, rechaza basura", () => {
  assert.equal(entryCode("abcd-efgh-jkmn"), "ABCDEFGHJKMN")
  assert.equal(entryCode("xx"), null)
})
test("ids de invitado y mensaje", () => {
  assert.ok(isGuestId("guest_ab12")); assert.ok(!isGuestId("uid123"))
  assert.match(entryMessage({ name: "Ana María", eventTitle: "Feria", url: "https://x.co/e" }), /^Hola Ana, quedaste inscrito en «Feria».*https:\/\/x\.co\/e$/)
})
