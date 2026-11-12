import { test } from "node:test"
import assert from "node:assert/strict"
import { ResendEmailService, type ResendLike } from "./ResendEmailService"

const msg = (to: string) => ({ to, subject: `s-${to}`, text: "t", html: "<p>t</p>", headers: { "List-Unsubscribe": "<x>" }, tags: [{ name: "kind", value: "weekly" }] })
const fake = (over: Partial<ResendLike> = {}): ResendLike => ({
  emails: { send: async () => ({ data: { id: "e1" }, error: null }) },
  batch: { send: async (p) => ({ data: { data: p.map((_, i) => ({ id: `b${i}` })) }, error: null }) },
  ...over,
})

test("sin clave ni cliente: desactivado y no envía", async () => {
  const s = new ResendEmailService(undefined, "A <a@x.co>")
  assert.equal(s.enabled, false)
  assert.equal((await s.send(msg("a@x.co"))).ok, false)
  assert.deepEqual((await s.sendBatch([msg("a@x.co")])).map((r) => r.ok), [false])
})
test("envío individual: manda remitente, cabeceras y etiquetas; clave de idempotencia aparte", async () => {
  let seen: { payload?: Record<string, unknown>; opts?: unknown } = {}
  const s = new ResendEmailService("k", "A <a@x.co>", fake({ emails: { send: async (payload, opts) => { seen = { payload, opts }; return { data: { id: "e9" }, error: null } } } }))
  const r = await s.send({ ...msg("a@x.co"), idempotencyKey: "id-1" })
  assert.deepEqual(r, { ok: true, id: "e9" })
  assert.equal(seen.payload?.from, "A <a@x.co>"); assert.deepEqual(seen.payload?.to, ["a@x.co"]); assert.ok(seen.payload?.tags); assert.deepEqual(seen.opts, { idempotencyKey: "id-1" })
})
test("429 y 5xx se pueden reintentar; 4xx no", async () => {
  for (const [code, retry] of [[429, true], [500, true], [422, false], [403, false]] as const) {
    const s = new ResendEmailService("k", "A <a@x.co>", fake({ emails: { send: async () => ({ data: null, error: { message: "x", statusCode: code } }) } }))
    const r = await s.send(msg("a@x.co")); assert.equal(r.ok, false); assert.equal(!r.ok && r.retryable, retry, String(code))
  }
})
test("lote: un resultado por correo, en orden, y un correo inválido no tumba a los demás", async () => {
  const s = new ResendEmailService("k", "A <a@x.co>", fake({ batch: { send: async () => ({ data: { data: [{ id: "b0" }, { id: "b2" }], errors: [{ index: 1, message: "invalid to" }] }, error: null }) } }))
  const r = await s.sendBatch([msg("a@x.co"), msg("malo"), msg("c@x.co")])
  assert.deepEqual(r.map((x) => x.ok), [true, false, true])
  assert.deepEqual(r[0].ok && r[0].id, "b0"); assert.deepEqual(r[2].ok && r[2].id, "b2")
  assert.equal(!r[1].ok && r[1].retryable, false)
})
test("lote: error de red o de Resend marca todos y respeta si se puede reintentar", async () => {
  const s = new ResendEmailService("k", "A <a@x.co>", fake({ batch: { send: async () => { throw new Error("red") } } }))
  assert.deepEqual((await s.sendBatch([msg("a@x.co"), msg("b@x.co")])).map((x) => !x.ok && x.retryable), [true, true])
  await assert.rejects(new ResendEmailService("k", "A <a@x.co>", fake()).sendBatch(Array.from({ length: 101 }, (_, i) => msg(`u${i}@x.co`))), /Máximo 100/)
})
