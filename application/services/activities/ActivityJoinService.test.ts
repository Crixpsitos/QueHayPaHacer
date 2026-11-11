import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import type { IActivityJoinRepository, JoinOutcome, JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"
import type { JoinDecision } from "@/domain/entities/activities/activityJoin"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { ActivityJoinService } from "./ActivityJoinService"

const NOW = new Date("2026-11-10T15:00:00Z") // martes; próxima salida: domingo 15

class FakeRepo implements IActivityJoinRepository {
  rows = new Map<string, JoinRow & { activityId: string }>()
  private k = (a: string, key: string, uid: string) => `${a}|${key}|${uid}`
  private taken = (a: string, key: string) => [...this.rows.values()].filter((r) => r.activityId === a && r.key === key).length
  async join(i: { activityId: string; key: string; uid: string; name: string }, decide: (t: number) => JoinDecision): Promise<JoinOutcome> {
    if (this.rows.has(this.k(i.activityId, i.key, i.uid))) return "already"
    const d = decide(this.taken(i.activityId, i.key))
    if (!d.ok) return d.reason
    this.rows.set(this.k(i.activityId, i.key, i.uid), { ...i, createdAt: NOW })
    return "joined"
  }
  async cancel(i: { activityId: string; key: string; uid: string }) { return { changed: this.rows.delete(this.k(i.activityId, i.key, i.uid)) } }
  async counts(a: string, keys: string[]) { return Object.fromEntries(keys.map((key) => [key, this.taken(a, key)])) }
  async mine(a: string, uid: string, keys: string[]) { return keys.filter((key) => this.rows.has(this.k(a, key, uid))) }
  async list(a: string) { return [...this.rows.values()].filter((r) => r.activityId === a) }
}

function setup(over: Partial<Activity> = {}) {
  const repo = new FakeRepo()
  const activity = makeActivity({ id: "a1", slug: "senderismo", ownerUid: "owner", join: { capacity: 2, closed: false }, ...over })
  const saved: Activity[] = []
  const notes: { uid: string; n: NewNotification }[] = []
  const svc = new ActivityJoinService({
    repo,
    getPublic: async (id) => (id === "a1" && activity.publicationStatus === "published" ? activity : null),
    getForManager: async (id, v) => (id === "a1" && (v.isAdmin || v.uid === activity.ownerUid) ? activity : null),
    saveActivity: async (a) => { saved.push(a) },
    displayName: async (uid) => `Persona ${uid}`,
    notify: async (uid, n) => { notes.push({ uid, n }) },
    clock: () => NOW,
  })
  return { svc, repo, notes, saved, activity }
}

test("unirse: queda dentro, avisa al creador y confirma al usuario", async () => {
  const { svc, notes } = setup()
  const r = await svc.join("u1", "a1", null)
  assert.deepEqual(r, { ok: true, key: "2026-11-15" })
  assert.deepEqual(notes.map((x) => [x.uid, x.n.type]), [["owner", "activity_join"], ["u1", "activity_join_confirmed"]])
})

test("doble toque: una sola inscripción y un solo aviso", async () => {
  const { svc, repo, notes } = setup()
  await svc.join("u1", "a1", null)
  const again = await svc.join("u1", "a1", null)
  assert.equal(again.ok, true)
  assert.equal(repo.rows.size, 1)
  assert.equal(notes.length, 2)
})

test("cupo lleno: el último cupo se lo lleva uno solo, el resto recibe error claro", async () => {
  const { svc } = setup()
  const results = await Promise.all(["u1", "u2", "u3", "u4"].map((u) => svc.join(u, "a1", null)))
  assert.equal(results.filter((r) => r.ok).length, 2)
  const bad = results.find((r) => !r.ok)
  assert.match(bad && !bad.ok ? bad.error : "", /lleno|cupo/i)
})

test("cancelar libera el cupo para otra persona", async () => {
  const { svc } = setup({ join: { capacity: 1, closed: false } })
  await svc.join("u1", "a1", null)
  assert.equal((await svc.join("u2", "a1", null)).ok, false)
  assert.deepEqual(await svc.cancel("u1", "a1", "2026-11-15"), { ok: true })
  assert.equal((await svc.join("u2", "a1", null)).ok, true)
})

test("cupo cerrado, sin inscripciones o actividad no pública: error y nada escrito", async () => {
  for (const [over, re] of [
    [{ join: { capacity: null, closed: true } }, /cerr/i],
    [{ join: null }, /no recibe/i],
    [{ publicationStatus: "draft" as const }, /no existe/i],
  ] as const) {
    const { svc, repo } = setup(over)
    const r = await svc.join("u1", "a1", null)
    assert.equal(r.ok, false)
    assert.match(!r.ok ? r.error : "", re)
    assert.equal(repo.rows.size, 0)
  }
})

test("fecha que no es una salida: rechazada", async () => {
  const { svc } = setup()
  assert.equal((await svc.join("u1", "a1", "2026-11-17")).ok, false)
})

test("estado público: próximas salidas con cupos y 'estás dentro'", async () => {
  const { svc } = setup()
  await svc.join("u1", "a1", null)
  const s = await svc.status("u1", "a1")
  assert.ok(s)
  assert.equal(s.enabled, true)
  assert.deepEqual([s.occurrences[0].key, s.occurrences[0].spotsLeft, s.occurrences[0].joined], ["2026-11-15", 1, true])
  assert.equal(s.occurrences[1].joined, false)
  const anon = await svc.status(null, "a1")
  assert.equal(anon?.occurrences[0].joined, false)
})

test("lista del creador: solo dueño o QHPA (IDOR)", async () => {
  const { svc } = setup()
  await svc.join("u1", "a1", null)
  assert.equal((await svc.listForManager({ uid: "owner", isAdmin: false }, "a1"))?.length, 1)
  assert.equal((await svc.listForManager({ uid: "admin", isAdmin: true }, "a1"))?.length, 1)
  assert.equal(await svc.listForManager({ uid: "otro", isAdmin: false }, "a1"), null)
  assert.equal(await svc.listForManager({ uid: null, isAdmin: false }, "a1"), null)
})

test("cerrar cupos: solo dueño o QHPA", async () => {
  const { svc, saved } = setup()
  assert.deepEqual(await svc.setClosed({ uid: "otro", isAdmin: false }, "a1", true), { ok: false, error: "No encontramos esa actividad." })
  assert.deepEqual(await svc.setClosed({ uid: "owner", isAdmin: false }, "a1", true), { ok: true })
  assert.deepEqual(saved[0].join, { capacity: 2, closed: true })
})
