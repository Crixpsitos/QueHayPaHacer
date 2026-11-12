import { test } from "node:test"
import assert from "node:assert/strict"
import { TransactionalEmailBridge } from "./TransactionalEmailBridge"
import type { OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"

const T = new Date("2026-11-12T12:00:00Z")
function setup(over: { allow?: boolean; email?: string | null; secret?: string | undefined } = {}) {
  const queued: OutboxItem[] = []
  const bridge = new TransactionalEmailBridge({
    allows: async () => over.allow !== false, getEmail: async () => (over.email === undefined ? "ana@x.co" : over.email),
    enqueue: async (i) => { if (queued.some((q) => q.id === i.id)) return false; queued.push(i); return true },
    siteUrl: "https://x.co", secret: "secret" in over ? over.secret : "s3", clock: () => T, render: async (m) => `<p>${m.heading}</p>`,
  })
  return { bridge, queued }
}
const n = { type: "activity_join_confirmed", title: 'Estás dentro: "Senderismo"', body: "Salida: domingo 15.", href: "/actividades/senderismo" }

test("un aviso de reserva se convierte en correo transaccional con cabeceras de baja", async () => {
  const s = setup()
  await s.bridge.fromNotification("u1", n, "joinok_a_k_u1")
  assert.equal(s.queued.length, 1)
  assert.equal(s.queued[0].kind, "transactional"); assert.equal(s.queued[0].to, "ana@x.co")
  assert.match(s.queued[0].headers!["List-Unsubscribe"], /api\/email\/unsubscribe\?u=u1&t=/)
})
test("sin permiso, sin correo, sin secreto de baja o tipo que no va por correo: no se encola nada", async () => {
  for (const o of [{ allow: false }, { email: null }, { secret: undefined }] as const) { const s = setup(o); await s.bridge.fromNotification("u1", n, "x"); assert.equal(s.queued.length, 0, JSON.stringify(o)) }
  const t = setup(); await t.bridge.fromNotification("u1", { ...n, type: "activity_join" }, "x"); assert.equal(t.queued.length, 0)
})
test("idempotente: el mismo aviso no genera dos correos", async () => {
  const s = setup()
  await s.bridge.fromNotification("u1", n, "same"); await s.bridge.fromNotification("u1", n, "same")
  assert.equal(s.queued.length, 1)
})
