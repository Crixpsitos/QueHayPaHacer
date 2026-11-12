import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeConfirm } from "./MeetingConfirm"

test("enlace del canal: se limpia y se acepta", () => {
  const r = normalizeConfirm({ channel: "whatsapp", url: " chat.whatsapp.com/AbC123 " })
  assert.deepEqual(r, { ok: true, confirm: { channel: "whatsapp", url: "https://chat.whatsapp.com/AbC123" } })
  assert.equal(normalizeConfirm({ channel: "telegram", url: "https://t.me/mi_grupo" }).ok, true)
  assert.equal(normalizeConfirm({ channel: "instagram", url: "instagram.com/mi_perfil" }).ok, true)
})
test("rechaza canal ajeno, http, credenciales, vacío y canal inválido", () => {
  assert.equal(normalizeConfirm({ channel: "whatsapp", url: "https://instagram.com/x" }).ok, false)
  assert.equal(normalizeConfirm({ channel: "other", url: "http://ejemplo.com" }).ok, false)
  assert.equal(normalizeConfirm({ channel: "other", url: "https://u:p@ejemplo.com" }).ok, false)
  assert.equal(normalizeConfirm({ channel: "whatsapp", url: "" }).ok, false)
  assert.equal(normalizeConfirm({ channel: "signal", url: "https://x.com" }).ok, false)
  assert.equal(normalizeConfirm({ channel: "whatsapp", url: "https://chat.whatsapp.com.evil.com/x" }).ok, false)
  assert.equal(normalizeConfirm({ channel: "other", url: "https://ejemplo.com/grupo" }).ok, true)
})
