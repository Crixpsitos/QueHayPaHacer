import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import type { IActivityJoinRepository, JoinOutcome, JoinRow, SetStatusOutcome } from "@/domain/repository/activities/IActivityJoinRepository"
import { holdsSpot, type JoinDecision, type JoinStatusValue } from "@/domain/entities/activities/activityJoin"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { ActivityJoinService } from "./ActivityJoinService"

const NOW = new Date("2026-11-10T15:00:00Z") // martes; próxima salida: domingo 15

class FakeRepo implements IActivityJoinRepository {
  rows = new Map<string, JoinRow & { activityId: string }>()
  private k = (a: string, key: string, uid: string) => `${a}|${key}|${uid}`
  private taken = (a: string, key: string) => [...this.rows.values()].filter((r) => r.activityId === a && r.key === key && holdsSpot(r.status)).length
  async join(i: { activityId: string; key: string; uid: string; name: string; status: JoinStatusValue; phone: string | null; consentVersion: string | null }, decide: (t: number) => JoinDecision): Promise<JoinOutcome> {
    if (this.rows.has(this.k(i.activityId, i.key, i.uid))) return "already"
    const d = decide(this.taken(i.activityId, i.key))
    if (!d.ok) return d.reason
    this.rows.set(this.k(i.activityId, i.key, i.uid), { activityId: i.activityId, key: i.key, uid: i.uid, name: i.name, status: i.status, phone: i.phone, createdAt: NOW })
    return "joined"
  }
  async cancel(i: { activityId: string; key: string; uid: string }) { return { changed: this.rows.delete(this.k(i.activityId, i.key, i.uid)) } }
  async setStatus(i: { activityId: string; key: string; uid: string; to: JoinStatusValue }, decide: (t: number) => JoinDecision): Promise<SetStatusOutcome> {
    const r = this.rows.get(this.k(i.activityId, i.key, i.uid))
    if (!r) return "missing"
    if (!holdsSpot(r.status) && holdsSpot(i.to) && !decide(this.taken(i.activityId, i.key)).ok) return "full"
    r.status = i.to
    return "ok"
  }
  async counts(a: string, keys: string[]) { return Object.fromEntries(keys.map((key) => [key, this.taken(a, key)])) }
  async mine(a: string, uid: string, keys: string[]) { return Object.fromEntries(keys.flatMap((key) => { const r = this.rows.get(this.k(a, key, uid)); return r ? [[key, r.status] as const] : [] })) }
  async listByUser(uid: string) { return [...this.rows.values()].filter((r) => r.uid === uid).map((r) => ({ activityId: r.activityId, key: r.key })) }
  async list(a: string) { return [...this.rows.values()].filter((r) => r.activityId === a) }
  closedCalls: [string, boolean][] = []
  async setClosed(a: string, closed: boolean) { this.closedCalls.push([a, closed]); return true }
}

function setup(over: Partial<Activity> = {}) {
  const repo = new FakeRepo()
  const activity = makeActivity({ id: "a1", slug: "senderismo", ownerUid: "owner", join: { capacity: 2, closed: false, payInstructions: "Nequi 300 765 4321" }, priceOptions: [{ label: "Gratis", amountCop: 0, unit: "persona", includes: [] }], ...over })
  const notes: { uid: string; n: NewNotification }[] = []
  const seenIds = new Set<string>()
  const svc = new ActivityJoinService({
    repo,
    getPublic: async (id) => (id === "a1" && activity.publicationStatus === "published" ? activity : null),
    getForManager: async (id, v) => (id === "a1" && (v.isAdmin || v.uid === activity.ownerUid) ? activity : null),
    displayName: async (uid) => `Persona ${uid}`,
    notify: async (uid, n, id) => { if (id && seenIds.has(id)) return; if (id) seenIds.add(id); notes.push({ uid, n }) },
    clock: () => NOW,
    legalVersion: "2026-11-05",
  })
  return { svc, repo, notes, activity }
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
  const { svc, repo } = setup()
  assert.deepEqual(await svc.setClosed({ uid: "otro", isAdmin: false }, "a1", true), { ok: false, error: "No encontramos esa actividad." })
  assert.deepEqual(await svc.setClosed({ uid: "owner", isAdmin: false }, "a1", true), { ok: true })
  assert.deepEqual(repo.closedCalls, [["a1", true]]) // solo el campo, sin reescribir la actividad
})

test("unirse y cancelar en bucle avisa al dueño una sola vez por persona y salida", async () => {
  const { svc, notes } = setup({ join: { capacity: null, closed: false } })
  for (let i = 0; i < 5; i++) { await svc.join("u1", "a1", null); await svc.cancel("u1", "a1", "2026-11-15") }
  assert.equal(notes.filter((n) => n.n.type === "activity_join").length, 1)
})

test("cancelar valida la forma de actividad y salida", async () => {
  const { svc } = setup()
  for (const key of ["../x", "2026-11-15_otro", "x/y", "2026-13"]) assert.equal((await svc.cancel("u1", "a1", key)).ok, false, key)
  assert.equal((await svc.cancel("u1", "a_1", "open")).ok, false)
  assert.equal((await svc.cancel("u1", "a1", "open")).ok, true)
})

const paidOver = { priceOptions: [{ label: "Salida", amountCop: 40000, unit: "persona" as const, includes: [] }] }
const contact = { phone: "300 123 4567", consent: true }

test("actividad gratis: confirmada al instante, sin guardar teléfono", async () => {
  const { svc, repo } = setup()
  assert.equal((await svc.join("u1", "a1", null, { phone: "3001234567", consent: true })).ok, true)
  const row = [...repo.rows.values()][0]
  assert.deepEqual([row.status, row.phone], ["confirmed", null])
})

test("actividad de pago: exige consentimiento y WhatsApp válido; queda por confirmar", async () => {
  const { svc, repo } = setup(paidOver)
  assert.equal((await svc.join("u1", "a1", null)).ok, false)
  assert.equal((await svc.join("u1", "a1", null, { phone: "3001234567" })).ok, false) // sin consentimiento
  assert.equal((await svc.join("u1", "a1", null, { phone: "123", consent: true })).ok, false)
  assert.equal(repo.rows.size, 0)
  assert.equal((await svc.join("u1", "a1", null, contact)).ok, true)
  const row = [...repo.rows.values()][0]
  assert.deepEqual([row.status, row.phone], ["pending", "3001234567"])
})

test("aviso al reservar con pago pendiente no dice 'estás dentro'", async () => {
  const { svc, notes } = setup(paidOver)
  await svc.join("u1", "a1", null, contact)
  assert.match(notes.find((n) => n.uid === "u1")!.n.title, /reservado/i)
})

test("'No pagó' libera el cupo; deshacer lo pide de nuevo y respeta el tope", async () => {
  const { svc } = setup({ ...paidOver, join: { capacity: 1, closed: false } })
  await svc.join("u1", "a1", null, contact)
  const owner = { uid: "owner", isAdmin: false }
  assert.deepEqual(await svc.setStatus(owner, "a1", "2026-11-15", "u1", "noShow"), { ok: true })
  assert.equal((await svc.join("u2", "a1", null, contact)).ok, true) // el cupo quedó libre
  assert.equal((await svc.setStatus(owner, "a1", "2026-11-15", "u1", "pending")).ok, false) // ya lo tomó otra persona
})

test("cambiar estado: solo dueño/QHPA y datos con forma válida", async () => {
  const { svc } = setup(paidOver)
  await svc.join("u1", "a1", null, contact)
  assert.equal((await svc.setStatus({ uid: "otro", isAdmin: false }, "a1", "2026-11-15", "u1", "confirmed")).ok, false)
  assert.equal((await svc.setStatus({ uid: null, isAdmin: false }, "a1", "2026-11-15", "u1", "confirmed")).ok, false)
  assert.equal((await svc.setStatus({ uid: "owner", isAdmin: false }, "a1", "../x", "u1", "confirmed")).ok, false)
  assert.equal((await svc.setStatus({ uid: "owner", isAdmin: false }, "a1", "2026-11-15", "u1", "borrar" as never)).ok, false)
  assert.equal((await svc.setStatus({ uid: "owner", isAdmin: false }, "a1", "2026-11-15", "nadie", "confirmed")).ok, false)
  assert.equal((await svc.setStatus({ uid: "owner", isAdmin: false }, "a1", "2026-11-15", "u1", "confirmed")).ok, true)
})

test("estado público: cómo se paga solo lo ve quien tiene una reserva por pagar", async () => {
  const { svc } = setup(paidOver)
  await svc.join("u1", "a1", null, contact)
  const mine = await svc.status("u1", "a1")
  assert.deepEqual([mine?.paid, mine?.payInstructions, mine?.occurrences[0].myStatus], [true, "Nequi 300 765 4321", "pending"])
  assert.equal((await svc.status("u2", "a1"))?.payInstructions, null)
  assert.equal((await svc.status(null, "a1"))?.payInstructions, null)
})

test("vista del organizador: reservas, cupo y métricas; nadie más la ve (IDOR)", async () => {
  const { svc } = setup(paidOver)
  await svc.join("u1", "a1", null, contact)
  const v = await svc.managerView({ uid: "owner", isAdmin: false }, "a1")
  assert.ok(v)
  assert.deepEqual([v.title, v.paid, v.join?.capacity, v.rows.length, v.rows[0].phone], ["Senderismo los domingos", true, 2, 1, "3001234567"])
  assert.equal(await svc.managerView({ uid: "otro", isAdmin: false }, "a1"), null)
  assert.equal(await svc.managerView({ uid: null, isAdmin: false }, "a1"), null)
  assert.equal(await svc.managerView({ uid: "owner", isAdmin: false }, "../x"), null)
})

test("solo se reservan las próximas salidas que se ofrecen (no todo el calendario)", async () => {
  const { svc, repo } = setup({ join: { capacity: null, closed: false } })
  assert.equal((await svc.join("u1", "a1", "2026-12-06")).ok, true) // 4.ª salida
  assert.equal((await svc.join("u1", "a1", "2026-12-13")).ok, false) // 5.ª: aún no se ofrece
  assert.equal(repo.rows.size, 1)
})

test("quien quedó como 'No pagó' no recibe un falso éxito al volver a reservar", async () => {
  const { svc } = setup(paidOver)
  await svc.join("u1", "a1", null, contact)
  await svc.setStatus({ uid: "owner", isAdmin: false }, "a1", "2026-11-15", "u1", "noShow")
  const r = await svc.join("u1", "a1", null, contact)
  assert.equal(r.ok, false)
})

test("borrar cuenta: elimina todas las reservas de la persona y libera sus cupos", async () => {
  const { svc, repo } = setup({ join: { capacity: 1, closed: false } })
  await svc.join("u1", "a1", "2026-11-15")
  await svc.join("u2", "a1", "2026-11-22")
  assert.equal(await svc.eraseUser("u1"), 1)
  assert.deepEqual([...repo.rows.values()].map((r) => r.uid), ["u2"])
  assert.equal((await svc.join("u3", "a1", "2026-11-15")).ok, true)
})
