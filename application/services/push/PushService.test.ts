import { test } from "node:test"
import assert from "node:assert/strict"
import { MAX_DEVICES, PUSH_PER_DAY, PushService } from "./PushService"
import { InMemoryRateLimit } from "@/application/services/rateLimit/InMemoryRateLimit"
import type { IPushSender, IPushTokenRepository, PushPayload, PushSendResult } from "@/domain/repository/push/IPushTokenRepository"

const T = new Date("2026-11-12T15:00:00Z")
const tok = (n: number) => `token-de-prueba-${String(n).padStart(4, "0")}-xxxxxxxxxx`
function setup(o: { allow?: boolean; enabled?: boolean; result?: (t: string) => PushSendResult } = {}) {
  const store = new Map<string, string[]>(); const sent: { t: string; p: PushPayload }[] = []
  const tokens: IPushTokenRepository = { async add(u, t) { store.set(u, [...(store.get(u) ?? []), t]) }, async remove(u, t) { store.set(u, (store.get(u) ?? []).filter((x) => x !== t)) }, async list(u) { return store.get(u) ?? [] } }
  const sender: IPushSender = { async send(t, p) { sent.push({ t, p }); return o.result ? o.result(t) : { ok: true } } }
  const svc = new PushService({ tokens, sender, rateLimit: new InMemoryRateLimit(), allows: async () => o.allow !== false, clock: () => T, enabled: o.enabled !== false })
  return { svc, store, sent }
}
const msg = { title: "Mañana sale: Senderismo", body: "Domingo 6:00 a. m.", href: "/actividades/s" }

test("sin permiso o sin claves configuradas no se registra ni se envía", async () => {
  await assert.rejects(setup({ allow: false }).svc.register("u1", tok(1)), /autoriza/)
  await assert.rejects(setup({ enabled: false }).svc.register("u1", tok(1)), /todavía no/)
  const s = setup({ allow: false }); assert.equal(await s.svc.notify("u1", msg), 0); assert.equal(s.sent.length, 0)
})
test("registra dispositivos con tope y rechaza tokens raros", async () => {
  const s = setup()
  await assert.rejects(s.svc.register("u1", "corto"), /dispositivo/)
  for (let i = 0; i < MAX_DEVICES; i++) await s.svc.register("u1", tok(i))
  await assert.rejects(s.svc.register("u1", tok(99)), /Máximo/)
})
test("tope diario de avisos por persona", async () => {
  const s = setup(); await s.svc.register("u1", tok(1))
  for (let i = 0; i < PUSH_PER_DAY; i++) assert.equal(await s.svc.notify("u1", msg), 1)
  assert.equal(await s.svc.notify("u1", msg), 0)
})
test("un token inválido se borra y no gasta el cupo del día", async () => {
  const s = setup({ result: () => ({ ok: false, invalidToken: true }) }); await s.svc.register("u1", tok(1))
  assert.equal(await s.svc.notify("u1", msg), 0)
  assert.deepEqual(s.store.get("u1"), [])
  const s2 = setup(); await s2.svc.register("u1", tok(1))
  for (let i = 0; i < PUSH_PER_DAY; i++) await s2.svc.notify("u1", msg)
})
test("el enlace siempre es interno y los textos se recortan", async () => {
  const s = setup(); await s.svc.register("u1", tok(1))
  await s.svc.notify("u1", { title: "t".repeat(200), body: "b".repeat(400), href: "https://evil.com" })
  assert.equal(s.sent[0].p.href, "/"); assert.ok(s.sent[0].p.title.length <= 80); assert.ok(s.sent[0].p.body.length <= 140)
})
