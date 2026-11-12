import { test } from "node:test"
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { verifyResendWebhook } from "./ResendWebhookVerifier"

// Svix firma «{id}.{timestamp}.{cuerpo}» con HMAC-SHA256 y la parte base64 del secreto (`whsec_…`).
const secret = "whsec_" + Buffer.from("secreto-de-prueba-1234567890").toString("base64")
const sign = (id: string, ts: string, body: string) => "v1," + createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest("base64")
const headers = (id: string, ts: string, sig: string) => new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig })
const body = JSON.stringify({ type: "email.bounced", created_at: "2026-11-12T00:00:00Z", data: { email_id: "e-123", bounce: { type: "Permanent" } } })

test("firma válida: devuelve solo lo que usamos", () => {
  const ts = String(Math.floor(Date.now() / 1000))
  assert.deepEqual(verifyResendWebhook(body, headers("m1", ts, sign("m1", ts, body)), secret), { type: "email.bounced", emailId: "e-123", bounceType: "Permanent" })
})
test("firma falsa, cuerpo alterado, sin secreto o fecha vieja: null", () => {
  const ts = String(Math.floor(Date.now() / 1000))
  assert.equal(verifyResendWebhook(body, headers("m1", ts, "v1,AAAA"), secret), null)
  assert.equal(verifyResendWebhook(body + " ", headers("m1", ts, sign("m1", ts, body)), secret), null)
  assert.equal(verifyResendWebhook(body, headers("m1", ts, sign("m1", ts, body)), undefined), null)
  const old = String(Math.floor(Date.now() / 1000) - 3600)
  assert.equal(verifyResendWebhook(body, headers("m1", old, sign("m1", old, body)), secret), null)
})
