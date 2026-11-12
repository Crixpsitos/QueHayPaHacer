import { test } from "node:test"
import assert from "node:assert/strict"
import { EmailQueueService } from "./EmailQueueService"
import { InMemoryRateLimit } from "@/application/services/rateLimit/InMemoryRateLimit"
import type { IEmailOutboxRepository, OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"
import type { EmailResult, IEmailService } from "@/domain/services/IEmailService"

const T = new Date("2026-11-12T12:00:00Z")
const item = (id: string, kind: OutboxItem["kind"], over: Partial<OutboxItem> = {}): OutboxItem => ({ id, uid: "u", to: `${id}@x.co`, kind, subject: id, text: "t", html: "<p>t</p>", status: "queued", attempts: 0, sendAfter: T, createdAt: T, ...over })

function setup(cap: number, results: Record<string, EmailResult> = {}) {
  const db = new Map<string, OutboxItem>(); const sent: string[] = []; const logs: string[] = []
  const repo: IEmailOutboxRepository = {
    async enqueue(i) { if (db.has(i.id)) return false; db.set(i.id, { ...i }); return true },
    async due(now, n) { return [...db.values()].filter((i) => i.status === "queued" && i.sendAfter <= now).slice(0, n) },
    async markSent(id, pid, at) { Object.assign(db.get(id)!, { status: "sent", providerId: pid, sentAt: at }) },
    async markRetry(id, attempts, after, err) { Object.assign(db.get(id)!, { attempts, lastError: err, ...(after ? { sendAfter: after } : { status: "failed" }) }) },
  }
  const email: IEmailService = { async send(m) { sent.push(m.subject); return results[m.subject] ?? { ok: true, id: "r-" + m.subject } } }
  const svc = new EmailQueueService({ repo, email, rateLimit: new InMemoryRateLimit(), cap, clock: () => T, log: (m) => logs.push(m) })
  return { svc, db, sent, logs }
}

test("encolar es idempotente por id (un reintento del barrido no duplica correos)", async () => {
  const s = setup(10)
  assert.equal(await s.svc.enqueue(item("a", "transactional")), true)
  assert.equal(await s.svc.enqueue(item("a", "transactional")), false)
})
test("primero los transaccionales, luego los de valor", async () => {
  const s = setup(10)
  await s.svc.enqueue(item("w1", "weekly")); await s.svc.enqueue(item("t1", "transactional")); await s.svc.enqueue(item("f1", "forYou")); await s.svc.enqueue(item("t2", "transactional"))
  await s.svc.drain()
  assert.deepEqual(s.sent.slice(0, 2).sort(), ["t1", "t2"])
  assert.equal(s.sent.length, 4)
})
test("tope diario: no se pasa; lo que sobra queda en cola para mañana", async () => {
  const s = setup(2)
  for (const id of ["t1", "t2", "w1", "w2"]) await s.svc.enqueue(item(id, id.startsWith("t") ? "transactional" : "weekly"))
  const r = await s.svc.drain()
  assert.equal(r.sent, 2)
  assert.deepEqual(s.sent.sort(), ["t1", "t2"])
  assert.equal([...s.db.values()].filter((i) => i.status === "queued").length, 2)
})
test("aviso al llegar al 80% del tope (una vez)", async () => {
  const s = setup(5)
  for (let i = 0; i < 5; i++) await s.svc.enqueue(item(`t${i}`, "transactional"))
  await s.svc.drain()
  assert.equal(s.logs.filter((l) => l.includes("alert=qhpa_email_cap_80")).length, 1)
})
test("error reintentable: reintenta (máx. 3) con espera; error definitivo: falla de una", async () => {
  const s = setup(10, { r: { ok: false, error: "429", retryable: true }, d: { ok: false, error: "dominio sin verificar", retryable: false } })
  await s.svc.enqueue(item("r", "transactional")); await s.svc.enqueue(item("d", "transactional"))
  await s.svc.drain()
  assert.equal(s.db.get("r")!.status, "queued"); assert.equal(s.db.get("r")!.attempts, 1); assert.ok(s.db.get("r")!.sendAfter > T)
  assert.equal(s.db.get("d")!.status, "failed")
  s.db.get("r")!.attempts = 2; s.db.get("r")!.sendAfter = T
  await s.svc.drain()
  assert.equal(s.db.get("r")!.status, "failed")
})
test("un envío fallido no gasta cupo del día", async () => {
  const s = setup(1, { bad: { ok: false, error: "x", retryable: false } })
  await s.svc.enqueue(item("bad", "transactional")); await s.svc.enqueue(item("ok", "transactional"))
  const r = await s.svc.drain()
  assert.equal(r.sent, 1)
})
