import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import type { AccountHistory } from "@/domain/entities/activities/trust"
import { makeActivity, makeImage } from "@/domain/entities/activities/activity.fixture"
import type { ActivityInput } from "@/application/dto/activities/ActivityDto"
import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"
import type { IActivityAccountRepository } from "@/domain/repository/activities/IActivityAccountRepository"
import { ActivityPublishService, type SiteLinkSnapshot } from "./ActivityPublishService"

class FakeRepo implements IActivityRepository {
  items: Activity[] = []
  async findById(id: string) { return this.items.find((a) => a.id === id) ?? null }
  async findBySlug(slug: string) { return this.items.find((a) => a.slug === slug) ?? null }
  async slugExists(slug: string) { return this.items.some((a) => a.slug === slug) }
  async findByOwner(uid: string) { return this.items.filter((a) => a.ownerUid === uid) }
  async findBySite(siteId: string) { return this.items.filter((a) => a.siteId === siteId) }
  async findListable() { return [] }
  async findPendingReview(limit: number) { return this.items.filter((a) => a.publicationStatus === "published" && a.moderationStatus === "pending").slice(0, limit) }
  async create(a: Omit<Activity, "id">) { const x = { ...a, id: `n${this.items.length + 1}` } as Activity; this.items.push(x); return x }
  async save(a: Activity) { this.items = this.items.map((x) => (x.id === a.id ? a : x)) }
}

const NOW = new Date("2026-11-10T15:00:00Z")
const input = (p: Partial<ActivityInput> = {}): ActivityInput => ({
  title: "Senderismo los domingos",
  tagline: "Caminata con almuerzo",
  description: "Salimos cada domingo a caminar por los cerros de Ibagué, con almuerzo incluido.",
  siteId: null,
  category: "aire-libre",
  companions: ["amigos"],
  difficulty: "medium",
  durationMinutes: 240,
  ageNote: "",
  meetingPoint: { mode: "sharedAfterJoining", text: "", references: "", geo: null },
  schedule: { rules: [{ kind: "weekly", weekdays: [0], start: "06:00" }], skipDates: [], requiresReservation: false },
  priceOptions: [{ label: "Completa", amountCop: 40000, unit: "persona", includes: ["Almuerzo"] }],
  extras: [],
  sections: [],
  cta: null,
  ...p,
})

function setup(opts: { history?: AccountHistory; sites?: Record<string, SiteLinkSnapshot>; gateOk?: boolean } = {}) {
  const repo = new FakeRepo()
  const calls = { declared: [] as string[], creator: [] as string[], approved: [] as string[], logs: [] as object[] }
  const accounts: IActivityAccountRepository = {
    get: async () => opts.history ?? { approvedCount: 0, activeSanctions: 0, suspendedUntil: null },
    recordApproved: async (uid) => { calls.approved.push(uid) },
  }
  const svc = new ActivityPublishService({
    repo,
    accounts,
    siteSnapshot: async (id) => opts.sites?.[id] ?? null,
    hostGate: async () => (opts.gateOk === false ? { ok: false, reason: "missing", message: "Para publicar debes registrar tus datos de identificación." } : { ok: true }),
    declare: async (_uid, id) => { calls.declared.push(id) },
    markCreator: async (uid) => { calls.creator.push(uid) },
    hostProfile: async () => ({ displayName: "Club Cerros", photoURL: "" }),
    clock: () => NOW,
    log: (e) => calls.logs.push(e),
  })
  return { repo, svc, calls }
}
const mediaFor = (id: string) => [makeImage("m1", true, { path: `public/activities/${id}/images/m1.jpg`, url: `https://storage.googleapis.com/b/public/activities/${id}/images/m1.jpg` })]
const user = { uid: "u1", isAdmin: false, accountCreatedAt: NOW.getTime() - 86_400_000 }
const admin = { uid: "admin", isAdmin: true }
const own = { s1: { name: "Nebraska", slug: "nebraska", authorId: "u1", published: true, active: true, linkable: true } }

test("borrador: se guarda sin declaración, sin registro de oferente y sin pasar a creator", async () => {
  const { svc, repo, calls } = setup({ gateOk: false })
  const r = await svc.save(user, { input: input(), media: [], publish: false, declaration: false })
  assert.equal(r.ok, true)
  const a = repo.items[0]
  assert.deepEqual([a.publicationStatus, a.moderationStatus, a.slug, a.ownerUid], ["draft", "pending", "senderismo-los-domingos", "u1"])
  assert.deepEqual([calls.creator, calls.declared], [[], []])
})

test("publicar exige la declaración (exactamente true)", async () => {
  const { svc, repo } = setup()
  const r = await svc.save(user, { input: input(), media: [], publish: true, declaration: "true" as unknown as boolean })
  assert.equal(r.ok, false)
  assert.equal(repo.items.length, 0)
})

test("publicar exige el registro de oferente (salvo QHPA)", async () => {
  const sin = setup({ gateOk: false })
  const r = await sin.svc.save(user, { input: input(), media: [], publish: true, declaration: true })
  assert.deepEqual(r, { ok: false, error: "Para publicar debes registrar tus datos de identificación." })
})

test("publicar sin portada falla con mensaje claro y no guarda como publicada", async () => {
  const { svc, repo } = setup()
  const r = await svc.save(user, { input: input(), media: [], publish: true, declaration: true })
  assert.equal(r.ok, false)
  assert.match((r as { error: string }).error, /portada/i)
  assert.equal(repo.items.length, 0)
})

// Para publicar hace falta que la actividad ya exista (el id define dónde viven los medios): borrador → publicar.
async function draftThenPublish(s: ReturnType<typeof setup>, ctx: typeof user | typeof admin, p: Partial<ActivityInput> = {}) {
  const d = await s.svc.save(ctx, { input: input(p), media: [], publish: false, declaration: false })
  assert.equal(d.ok, true)
  const id = (d as { id: string }).id
  const media = [makeImage("m1", true, { path: `public/activities/${id}/images/m1.jpg`, url: `https://storage.googleapis.com/b/public/activities/${id}/images/m1.jpg` })]
  return s.svc.save(ctx, { id, input: input(p), media, publish: true, declaration: true })
}

test("cuenta nueva: publica y queda en revisión, pasa a creator, registra la declaración y alerta a QHPA", async () => {
  const s = setup()
  const r = await draftThenPublish(s, user)
  assert.deepEqual([(r as { ok: boolean }).ok, (r as { moderationStatus: string }).moderationStatus, (r as { publicationStatus: string }).publicationStatus], [true, "pending", "published"])
  assert.deepEqual(s.calls.creator, ["u1"])
  assert.equal(s.calls.declared.length, 1)
  assert.equal(s.calls.approved.length, 0)
  assert.equal((s.calls.logs[0] as { alert: string }).alert, "qhpa_new_activity")
})

test("cuenta de confianza: se autoaprueba y suma una aprobada; 'otros' siempre queda en revisión", async () => {
  const trusted = { approvedCount: 3, activeSanctions: 0, suspendedUntil: null }
  const s = setup({ history: trusted })
  const r = await draftThenPublish(s, user)
  assert.equal((r as { moderationStatus: string }).moderationStatus, "approved")
  assert.deepEqual(s.calls.approved, ["u1"])
  const o = setup({ history: trusted })
  assert.equal(((await draftThenPublish(o, user, { category: "otros" })) as { moderationStatus: string }).moderationStatus, "pending")
})

test("una sanción vigente quita la autoaprobación", async () => {
  const s = setup({ history: { approvedCount: 9, activeSanctions: 1, suspendedUntil: null } })
  assert.equal(((await draftThenPublish(s, user)) as { moderationStatus: string }).moderationStatus, "pending")
})

test("QHPA se autoaprueba y se salta el registro de oferente y el antispam", async () => {
  const s = setup({ gateOk: false })
  for (let i = 0; i < 5; i++) {
    const r = await draftThenPublish(s, admin, { title: `Actividad número ${i} de prueba` })
    assert.equal((r as { moderationStatus: string }).moderationStatus, "approved")
  }
  assert.equal(s.calls.approved.length, 0)
})

test("D12: solo el autor del sitio (o QHPA) crea actividades de ese sitio; error genérico para los demás", async () => {
  const s = setup({ sites: own })
  assert.equal((await s.svc.save(user, { input: input({ siteId: "s1" }), media: [], publish: false, declaration: false })).ok, true)
  assert.equal(s.repo.items[0].kind, "site")
  const ajeno = setup({ sites: { s1: { ...own.s1, authorId: "otro" } } })
  const r = await ajeno.svc.save(user, { input: input({ siteId: "s1" }), media: [], publish: false, declaration: false })
  assert.deepEqual(r, { ok: false, error: "No se pudo guardar la actividad." })
  assert.equal(ajeno.repo.items.length, 0)
  assert.equal((await ajeno.svc.save(admin, { input: input({ siteId: "s1" }), media: [], publish: false, declaration: false })).ok, true)
  assert.equal((await setup().svc.save(user, { input: input({ siteId: "no-existe" }), media: [], publish: false, declaration: false })).ok, false)
})

test("un sitio del usuario que no es 'de verdad propio' (propuesto o sin aprobar) no admite actividades, salvo QHPA", async () => {
  const sites = { s1: { ...own.s1, linkable: false } }
  const s = setup({ sites })
  assert.deepEqual(await s.svc.save(user, { input: input({ siteId: "s1" }), media: [], publish: false, declaration: false }), { ok: false, error: "No se pudo guardar la actividad." })
  assert.equal((await setup({ sites }).svc.save(admin, { input: input({ siteId: "s1" }), media: [], publish: false, declaration: false })).ok, true)
})

test("antispam: con 3 actividades en revisión no deja crear otra", async () => {
  const s = setup()
  for (let i = 0; i < 3; i++) s.repo.items.push(makeActivity({ id: `p${i}`, slug: `p${i}`, ownerUid: "u1", moderationStatus: "pending", title: `Otra ${i}`, createdAt: new Date(NOW.getTime() - 3 * 86_400_000) }))
  const r = await s.svc.save(user, { input: input({ title: "Una más nueva" }), media: [], publish: false, declaration: false })
  assert.equal(r.ok, false)
  assert.match((r as { error: string }).error, /en revisión/)
})

test("crear con medios sin id es inválido (los medios viven bajo el id de la actividad)", async () => {
  const s = setup()
  const r = await s.svc.save(user, { input: input(), media: [makeImage("m1", true)], publish: false, declaration: false })
  assert.equal(r.ok, false)
})

test("editar: solo el dueño o QHPA; los demás reciben el mismo error genérico", async () => {
  const s = setup()
  const d = (await s.svc.save(user, { input: input(), media: [], publish: false, declaration: false })) as { id: string }
  const otro = await s.svc.save({ uid: "u2", isAdmin: false }, { id: d.id, input: input({ title: "Me la robo" }), media: [], publish: false, declaration: false })
  assert.deepEqual(otro, { ok: false, error: "No se pudo guardar la actividad." })
  assert.equal(s.repo.items[0].title, "Senderismo los domingos")
  const noExiste = await s.svc.save(user, { id: "zzz", input: input(), media: [], publish: false, declaration: false })
  assert.deepEqual(noExiste, { ok: false, error: "No se pudo guardar la actividad." })
})

test("editar el título de una aprobada: sin confianza vuelve a revisión; con confianza no; el slug no cambia", async () => {
  const s = setup()
  s.repo.items.push(makeActivity({ id: "x", slug: "fijo", ownerUid: "u1", media: mediaFor("x") }))
  const r = await s.svc.save(user, { id: "x", input: input({ title: "Otro título distinto" }), media: s.repo.items[0].media, publish: true, declaration: true })
  assert.equal(r.ok, true)
  assert.deepEqual([s.repo.items[0].moderationStatus, s.repo.items[0].slug], ["pending", "fijo"])
  const t = setup({ history: { approvedCount: 3, activeSanctions: 0, suspendedUntil: null } })
  t.repo.items.push(makeActivity({ id: "x", slug: "fijo", ownerUid: "u1", media: mediaFor("x") }))
  await t.svc.save(user, { id: "x", input: input({ title: "Otro título distinto" }), media: t.repo.items[0].media, publish: true, declaration: true })
  assert.equal(t.repo.items[0].moderationStatus, "approved")
})

test("editar el horario o el precio no reabre la revisión", async () => {
  const s = setup()
  s.repo.items.push(makeActivity({ id: "x", slug: "fijo", ownerUid: "u1", title: "Senderismo los domingos", media: mediaFor("x") }))
  await s.svc.save(user, { id: "x", input: input({ priceOptions: [{ label: "Nueva", amountCop: 10, unit: "persona", includes: [] }] }), media: s.repo.items[0].media, publish: true, declaration: true })
  assert.equal(s.repo.items[0].moderationStatus, "approved")
})

test("no se pueden inyectar medios de otra actividad", async () => {
  const s = setup()
  const d = (await s.svc.save(user, { input: input(), media: [], publish: false, declaration: false })) as { id: string }
  const forged = [makeImage("m1", true, { path: "public/activities/OTRA/images/m1.jpg", url: "https://storage.googleapis.com/b/x.jpg" })]
  const r = await s.svc.save(user, { id: d.id, input: input(), media: forged, publish: true, declaration: true })
  assert.equal(r.ok, false)
})

test("pausar y reactivar: solo el dueño o QHPA", async () => {
  const s = setup()
  s.repo.items.push(makeActivity({ id: "x", ownerUid: "u1" }))
  assert.deepEqual(await s.svc.setActive({ uid: "u2", isAdmin: false }, "x", false), { ok: false, error: "No se pudo guardar la actividad." })
  assert.equal(s.repo.items[0].isActive, true)
  assert.deepEqual(await s.svc.setActive(user, "x", false), { ok: true })
  assert.equal(s.repo.items[0].isActive, false)
  assert.deepEqual(await s.svc.setActive(admin, "x", true), { ok: true })
  assert.equal(s.repo.items[0].isActive, true)
})
