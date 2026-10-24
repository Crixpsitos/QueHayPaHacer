import { test } from "node:test"
import assert from "node:assert/strict"
import { eventAtSiteNotice, recountSites } from "./siteEventsCore"
import { sanitizeNotification, NOTIFICATION_TYPES } from "@/domain/entities/notification/Notification"

// Cuentas por sitio; `set` devuelve el autor solo si el valor cambió (como SitesService.setEventCount).
const world = (counts: Record<string, number>, stored: Record<string, number>, boom: string[] = []) => {
  const writes: [string, number][] = []
  return {
    writes,
    deps: {
      count: async (id: string) => {
        if (boom.includes(id)) throw new Error("falla")
        return counts[id] ?? 0
      },
      set: async (id: string, n: number) => {
        if (stored[id] === n) return null
        stored[id] = n
        writes.push([id, n])
        return { authorId: `autor-${id}` }
      },
    },
  }
}

test("un evento que cambia de sitio recuenta el anterior Y el nuevo", async () => {
  // El evento se movió de A a B: A pasa de 3 a 2 y B de 1 a 2.
  const { deps, writes } = world({ A: 2, B: 2 }, { A: 3, B: 1 })
  const changed = await recountSites(["A", "B"], deps)
  assert.deepEqual(writes, [["A", 2], ["B", 2]])
  assert.deepEqual(changed.map((c) => c.siteId), ["A", "B"])
})

test("ignora vacíos y repetidos, y no reporta sitios que ya estaban al día", async () => {
  const { deps, writes } = world({ A: 1, B: 4 }, { A: 1, B: 0 })
  const changed = await recountSites(["A", null, undefined, "B", "B", "A"], deps)
  assert.deepEqual(writes, [["B", 4]])
  assert.deepEqual(changed, [{ siteId: "B", authorId: "autor-B" }])
})

test("el fallo de un sitio no frena a los demás", async () => {
  const errors: string[] = []
  const { deps, writes } = world({ A: 1, B: 2 }, {}, ["A"])
  const changed = await recountSites(["A", "B"], deps, (id) => errors.push(id))
  assert.deepEqual(errors, ["A"])
  assert.deepEqual(writes, [["B", 2]])
  assert.equal(changed.length, 1)
})

test("aviso al autor del sitio cuando el evento es de otra persona", () => {
  const n = eventAtSiteNotice({ id: "e1", title: "Noche de jazz", author: { id: "u2" } }, { id: "s1", title: "Café Luna", authorId: "u1" })
  assert.ok(n)
  assert.equal(n.to, "u1")
  assert.equal(n.id, "event_at_site_e1_s1", "id idempotente por evento y sitio")
  assert.deepEqual(n.notification, {
    type: "event_at_site",
    title: 'Se publicó un evento en tu sitio "Café Luna"',
    body: "Noche de jazz",
    href: "/eventos/e1",
  })
})

test("sin aviso si el evento es del mismo autor o el sitio no tiene autor", () => {
  const event = { id: "e1", title: "T", author: { id: "u1" } }
  assert.equal(eventAtSiteNotice(event, { id: "s1", title: "S", authorId: "u1" }), null)
  assert.equal(eventAtSiteNotice(event, { id: "s1", title: "S", authorId: null }), null)
})

test("event_at_site es un tipo válido y sobrevive a sanitizeNotification con su enlace", () => {
  assert.ok((NOTIFICATION_TYPES as readonly string[]).includes("event_at_site"))
  const clean = sanitizeNotification({ type: "event_at_site", title: "x".repeat(200), body: "y", href: "/eventos/e1" })
  assert.equal(clean.type, "event_at_site")
  assert.equal(clean.href, "/eventos/e1")
  assert.ok(clean.title.length <= 120)
  assert.equal(sanitizeNotification({ type: "event_at_site", title: "t", href: "https://malo.example" }).href, undefined)
})
