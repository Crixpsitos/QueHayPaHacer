import { test } from "node:test"
import assert from "node:assert/strict"
import type { HostIdentityRecord } from "@/domain/entities/activities/HostIdentity"
import type { HostIdentityAccess, IHostIdentityRepository } from "@/domain/repository/activities/IHostIdentityRepository"
import { HostIdentityService } from "./HostIdentityService"

class FakeRepo implements IHostIdentityRepository {
  records = new Map<string, HostIdentityRecord>()
  log: { hostUid: string; entry: HostIdentityAccess }[] = []
  async get(uid: string) { return this.records.get(uid) ?? null }
  async upsert(r: HostIdentityRecord) { this.records.set(r.uid, r) }
  async appendAccess(hostUid: string, entry: HostIdentityAccess) { this.log.push({ hostUid, entry }) }
}

const NOW = new Date("2026-11-10T12:00:00Z")
const raw = () => ({ kind: "person", name: "Camila Rodríguez", documentType: "CC", documentNumber: "1234567890", address: "Calle 10 # 5-20, Ibagué", email: "camila@correo.com", phones: ["3001234567"] })
const make = (allow = () => true) => {
  const repo = new FakeRepo()
  return { repo, svc: new HostIdentityService(repo, () => NOW, allow) }
}

test("guardar exige autorización de datos y datos válidos", async () => {
  const { svc, repo } = make()
  assert.deepEqual(await svc.save("u1", raw(), false, "2026-11-05"), { ok: false, error: "Debes autorizar el tratamiento de tus datos para continuar." })
  const bad = await svc.save("u1", { ...raw(), email: "x" }, true, "2026-11-05")
  assert.equal(bad.ok, false)
  assert.equal(repo.records.size, 0)
})

test("guardar crea el registro con uid del servidor, versión legal y fechas", async () => {
  const { svc, repo } = make()
  assert.deepEqual(await svc.save("u1", { ...raw(), uid: "otro" }, true, "2026-11-05"), { ok: true })
  const r = repo.records.get("u1")!
  assert.equal(r.uid, "u1")
  assert.equal(repo.records.has("otro"), false)
  assert.equal(r.legalVersion, "2026-11-05")
  assert.equal(r.dataAuthorization, true)
  assert.deepEqual([r.confirmedAt, r.updatedAt], [NOW, NOW])
})

test("gate: sin registro no se publica; con registro vigente sí", async () => {
  const { svc } = make()
  assert.equal((await svc.gate("u1")).ok, false)
  await svc.save("u1", raw(), true, "v")
  assert.deepEqual(await svc.gate("u1"), { ok: true })
})

test("consulta para queja: pide sesión, aplica límite y deja bitácora", async () => {
  const { svc, repo } = make()
  await svc.save("host", raw(), true, "v")
  assert.deepEqual(await svc.consultForComplaint({ requesterUid: null, hostUid: "host", activityId: "a1" }), { ok: false, error: "Inicia sesión para consultar los datos de quien ofrece." })
  const r = await svc.consultForComplaint({ requesterUid: "comprador", hostUid: "host", activityId: "a1" })
  assert.equal(r.ok, true)
  assert.deepEqual(repo.log, [{ hostUid: "host", entry: { by: "comprador", at: NOW, purpose: "complaint", activityId: "a1" } }])
  if (r.ok) assert.equal("uid" in r.data, false)
})

test("consulta para queja: el límite de uso la bloquea sin dejar bitácora", async () => {
  const { svc, repo } = make(() => false)
  await svc.save("host", raw(), true, "v")
  const r = await svc.consultForComplaint({ requesterUid: "c", hostUid: "host", activityId: "a1" })
  assert.deepEqual(r, { ok: false, error: "Hiciste muchas consultas seguidas. Intenta de nuevo en unos minutos." })
  assert.equal(repo.log.length, 0)
})

test("consulta de un oferente sin registro responde genérico", async () => {
  const { svc } = make()
  const r = await svc.consultForComplaint({ requesterUid: "c", hostUid: "nadie", activityId: "a1" })
  assert.deepEqual(r, { ok: false, error: "No hay datos de identificación registrados para esta actividad." })
})

test("exportar para la autoridad deja bitácora con quién lo exportó", async () => {
  const { svc, repo } = make()
  await svc.save("host", raw(), true, "v")
  const rec = await svc.exportForAuthority("host", "admin-script")
  assert.equal(rec?.name, "Camila Rodríguez")
  assert.deepEqual(repo.log[0].entry, { by: "admin-script", at: NOW, purpose: "authority_export" })
  assert.equal(await svc.exportForAuthority("nadie", "admin-script"), null)
})
