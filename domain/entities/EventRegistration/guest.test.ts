import { test } from "node:test"
import assert from "node:assert/strict"
import { cleanGuest, entryCode, entryMessage, isGuestId } from "./guest"

test("limpia el nombre y valida el WhatsApp opcional", () => {
  assert.deepEqual(cleanGuest({ name: "  Ana   María  ", phone: "300 123 4567" }), { ok: true, name: "Ana María", phone: "3001234567", email: null })
  assert.deepEqual(cleanGuest({ name: "Luis", phone: "+57 300 123 4567" }), { ok: true, name: "Luis", phone: "3001234567", email: null })
  assert.deepEqual(cleanGuest({ name: "Luis" }), { ok: true, name: "Luis", phone: null, email: null })
  assert.equal(cleanGuest({ name: "A" }).ok, false)
  assert.equal(cleanGuest({ name: "Ana", phone: "12345" }).ok, false)
})
test("correo opcional: se normaliza a minúsculas y se rechaza si no parece un correo", () => {
  assert.deepEqual(cleanGuest({ name: "Ana", email: "  Ana.Perez@Gmail.COM " }), { ok: true, name: "Ana", phone: null, email: "ana.perez@gmail.com" })
  assert.deepEqual(cleanGuest({ name: "Ana", email: "" }), { ok: true, name: "Ana", phone: null, email: null })
  assert.equal(cleanGuest({ name: "Ana", email: "ana@" }).ok, false)
  assert.equal(cleanGuest({ name: "Ana", email: "ana perez@x.co" }).ok, false)
})
test("código de entrada: acepta formato con guiones y minúsculas, rechaza basura", () => {
  assert.equal(entryCode("abcd-efgh-jkmn"), "ABCDEFGHJKMN")
  assert.equal(entryCode("xx"), null)
})
test("ids de invitado y mensaje", () => {
  assert.ok(isGuestId("guest_ab12")); assert.ok(!isGuestId("uid123"))
  assert.match(entryMessage({ name: "Ana María", eventTitle: "Feria", url: "https://x.co/e" }), /^Hola Ana, quedaste inscrito en «Feria».*https:\/\/x\.co\/e$/)
})
