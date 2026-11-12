import { test } from "node:test"
import assert from "node:assert/strict"
import { NotificationPrefsService } from "./NotificationPrefsService"
import type { NotificationPrefs } from "@/domain/entities/notificationPrefs/prefs"
import type { INotificationPrefsRepository } from "@/domain/repository/notificationPrefs/INotificationPrefsRepository"

const NOW = new Date("2026-11-12T15:00:00Z")
const setup = () => {
  const db = new Map<string, NotificationPrefs>()
  const repo: INotificationPrefsRepository = { async get(u) { return db.get(u) ?? null }, async set(u, p) { db.set(u, p) }, async uidsWith(k) { return [...db].filter(([, p]) => p.email[k] && p.consent).map(([u]) => u) } }
  return { svc: new NotificationPrefsService(repo, "v1", () => NOW), db }
}

test("una cuenta existente (sin documento) NO está apuntada: solo lo transaccional", async () => {
  const { svc } = setup()
  assert.equal(await svc.allows("u1", "email", "weekly"), false)
  assert.equal(await svc.allows("u1", "push", "transactional"), false)
  assert.equal(await svc.allows("u1", "email", "transactional"), true)
})
test("guardar con casilla registra consentimiento; sin casilla falla y no guarda nada", async () => {
  const { svc, db } = setup()
  await assert.rejects(svc.save("u1", { email: { weekly: true } }, false), /casilla/)
  assert.equal(db.size, 0)
  const p = await svc.save("u1", { email: { weekly: true } }, true)
  assert.deepEqual(p.consent, { at: NOW, version: "v1" })
  assert.deepEqual(await svc.uidsWith("weekly"), ["u1"])
})
test("la baja apaga el correo y queda registrada; los envíos programados ya no la incluyen", async () => {
  const { svc, db } = setup()
  await svc.save("u1", { email: { weekly: true } }, true)
  await svc.unsubscribe("u1")
  assert.equal(await svc.allows("u1", "email", "weekly"), false)
  assert.equal(db.get("u1")?.unsubscribedAt?.getTime(), NOW.getTime())
  assert.deepEqual(await svc.uidsWith("weekly"), [])
})
