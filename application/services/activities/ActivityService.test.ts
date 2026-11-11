import { test } from "node:test"
import assert from "node:assert/strict"
import type { Activity } from "@/domain/entities/activities/Activity"
import type { IActivityRepository } from "@/domain/repository/activities/IActivityRepository"
import { makeActivity } from "@/domain/entities/activities/activity.fixture"
import { ActivityService } from "./ActivityService"

class FakeRepo implements IActivityRepository {
  constructor(public items: Activity[]) {}
  async findById(id: string) { return this.items.find((a) => a.id === id) ?? null }
  async findBySlug(slug: string) { return this.items.find((a) => a.slug === slug) ?? null }
  async slugExists(slug: string) { return this.items.some((a) => a.slug === slug) }
  async findByOwner(uid: string) { return this.items.filter((a) => a.ownerUid === uid) }
  async findBySite(siteId: string) { return this.items.filter((a) => a.siteId === siteId) }
  async findListable(limit: number) { return this.items.filter((a) => a.publicationStatus === "published" && a.moderationStatus === "approved" && a.isActive).slice(0, limit) }
  async findPendingReview(limit: number) { return this.items.filter((a) => a.publicationStatus === "published" && a.moderationStatus === "pending").slice(0, limit) }
  async create(a: Omit<Activity, "id">) { const x = { ...a, id: `n${this.items.length}` } as Activity; this.items.push(x); return x }
  async save(a: Activity) { this.items = this.items.map((x) => (x.id === a.id ? a : x)) }
}

const NOW = new Date("2026-11-10T15:00:00Z") // martes 10 de noviembre, 10:00 en Bogotá
const sundayAt = (hhmm: string) => ({ rules: [{ kind: "weekly" as const, weekdays: [0 as const], start: hhmm }], skipDates: [], requiresReservation: false })
const weekdayAt = (d: 0 | 1 | 2 | 3 | 4 | 5 | 6, hhmm: string) => ({ rules: [{ kind: "weekly" as const, weekdays: [d], start: hhmm }], skipDates: [], requiresReservation: false })
const okSite = { published: true, active: true }

const svc = (items: Activity[], sites: Record<string, { published: boolean; active: boolean } | null> = {}) =>
  new ActivityService(new FakeRepo(items), async (id) => sites[id] ?? null, () => NOW)

test("getPublicBySlug devuelve la pública y oculta pendiente, rechazada, pausada y desconocida", async () => {
  const s = svc([
    makeActivity({ id: "1", slug: "ok" }),
    makeActivity({ id: "2", slug: "pend", moderationStatus: "pending" }),
    makeActivity({ id: "3", slug: "rech", moderationStatus: "rejected" }),
    makeActivity({ id: "4", slug: "pausa", isActive: false }),
  ])
  assert.equal((await s.getPublicBySlug("ok"))?.id, "1")
  for (const slug of ["pend", "rech", "pausa", "nada"]) assert.equal(await s.getPublicBySlug(slug), null)
})

test("una actividad de sitio es pública solo si su sitio sigue publicado y activo", async () => {
  const a = makeActivity({ id: "1", slug: "en-sitio", kind: "site", siteId: "s1" })
  assert.equal((await svc([a], { s1: okSite }).getPublicBySlug("en-sitio"))?.id, "1")
  assert.equal(await svc([a], { s1: { published: false, active: true } }).getPublicBySlug("en-sitio"), null)
  assert.equal(await svc([a], {}).getPublicBySlug("en-sitio"), null)
})

test("getForViewer: el dueño y QHPA ven la pendiente (vista previa); un tercero no", async () => {
  const s = svc([makeActivity({ id: "1", slug: "pend", moderationStatus: "pending", ownerUid: "u1" })])
  assert.equal((await s.getForViewer("pend", { uid: "u1", isAdmin: false }))?.id, "1")
  assert.equal((await s.getForViewer("pend", { uid: "x", isAdmin: true }))?.id, "1")
  assert.equal(await s.getForViewer("pend", { uid: "x", isAdmin: false }), null)
  assert.equal(await s.getForViewer("pend", { uid: null, isAdmin: false }), null)
})

test("listPublic ordena por próxima salida y deja las de solo-cita al final; excluye las no visibles", async () => {
  const s = svc(
    [
      makeActivity({ id: "dom", slug: "dom", title: "Domingo", schedule: sundayAt("06:00") }), // dom 15 nov
      makeActivity({ id: "mie", slug: "mie", title: "Miércoles", schedule: weekdayAt(3, "18:00") }), // mié 11 nov
      makeActivity({ id: "cita", slug: "cita", title: "Con cita", schedule: { rules: [{ kind: "byAppointment" }], skipDates: [], requiresReservation: true } }),
      makeActivity({ id: "pend", slug: "pend", moderationStatus: "pending", schedule: weekdayAt(2, "20:00") }),
      makeActivity({ id: "sitio", slug: "sitio", kind: "site", siteId: "s9", schedule: weekdayAt(2, "20:00") }),
    ],
    { s9: { published: false, active: true } },
  )
  assert.deepEqual((await s.listPublic(10)).map((a) => a.id), ["mie", "dom", "cita"])
  assert.deepEqual((await s.listPublic(2)).map((a) => a.id), ["mie", "dom"])
})

test("listForSite devuelve solo las públicas de ese sitio, y nada si el sitio no está visible", async () => {
  const items = [
    makeActivity({ id: "1", slug: "a", kind: "site", siteId: "s1" }),
    makeActivity({ id: "2", slug: "b", kind: "site", siteId: "s1", moderationStatus: "pending" }),
    makeActivity({ id: "3", slug: "c", kind: "site", siteId: "s2" }),
  ]
  assert.deepEqual((await svc(items, { s1: okSite }).listForSite("s1")).map((a) => a.id), ["1"])
  assert.deepEqual(await svc(items, { s1: { published: true, active: false } }).listForSite("s1"), [])
})

test("listMine devuelve todas las propias (cualquier estado), la más reciente primero", async () => {
  const s = svc([
    makeActivity({ id: "viejo", slug: "v", ownerUid: "u1", updatedAt: new Date("2026-10-01T00:00:00Z") }),
    makeActivity({ id: "nuevo", slug: "n", ownerUid: "u1", moderationStatus: "pending", updatedAt: new Date("2026-11-05T00:00:00Z") }),
    makeActivity({ id: "ajeno", slug: "a", ownerUid: "u2" }),
  ])
  assert.deepEqual((await s.listMine("u1")).map((a) => a.id), ["nuevo", "viejo"])
})

test("isSlugTaken consulta el repositorio", async () => {
  const s = svc([makeActivity({ slug: "tomado" })])
  assert.equal(await s.isSlugTaken("tomado"), true)
  assert.equal(await s.isSlugTaken("libre"), false)
})

test("getPublicById devuelve solo públicas", async () => {
  const s = svc([makeActivity({ id: "1", slug: "a" }), makeActivity({ id: "2", slug: "b", moderationStatus: "pending" })])
  assert.equal((await s.getPublicById("1"))?.id, "1")
  assert.equal(await s.getPublicById("2"), null)
  assert.equal(await s.getPublicById("zzz"), null)
})

test("getForManager devuelve la actividad (en cualquier estado) solo a su dueño o a QHPA", async () => {
  const s = svc([makeActivity({ id: "p", slug: "p", ownerUid: "u1", moderationStatus: "pending", publicationStatus: "draft" })])
  assert.equal((await s.getForManager("p", { uid: "u1", isAdmin: false }))?.id, "p")
  assert.equal((await s.getForManager("p", { uid: "x", isAdmin: true }))?.id, "p")
  assert.equal(await s.getForManager("p", { uid: "x", isAdmin: false }), null)
  assert.equal(await s.getForManager("p", { uid: null, isAdmin: false }), null)
  assert.equal(await s.getForManager("zzz", { uid: "u1", isAdmin: false }), null)
})
