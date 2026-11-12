import { test } from "node:test"
import assert from "node:assert/strict"
import { parseChannelUrl, withChannelAttribution } from "./channelLink"

test("acepta solo enlaces https de canales de WhatsApp", () => {
  assert.equal(parseChannelUrl("https://whatsapp.com/channel/0029VaAbCdEf"), "https://whatsapp.com/channel/0029VaAbCdEf")
  assert.equal(parseChannelUrl("  https://www.whatsapp.com/channel/0029VaAbCdEf  "), "https://www.whatsapp.com/channel/0029VaAbCdEf")
})
test("rechaza vacío, otros dominios, http y trucos", () => {
  for (const bad of ["", undefined, null, 5, "http://whatsapp.com/channel/abc", "https://evil.com/channel/abc", "https://whatsapp.com.evil.com/channel/abc", "https://whatsapp.com/channel/", "javascript:alert(1)", "https://whatsapp.com/channel/abc def"]) assert.equal(parseChannelUrl(bad), null, String(bad))
})
test("la atribución se agrega a un enlace nuestro con el canal «wc»", () => {
  assert.equal(withChannelAttribution("https://x.co/actividades/a"), "https://x.co/actividades/a?ch=wc&utm_source=whatsapp&utm_medium=channel&utm_campaign=auto")
})
